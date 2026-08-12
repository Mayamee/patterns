/**
 * ЗАДАЧА 2 — легаси CRM-синка в B2B SaaS
 *
 * Контекст (как на работе, без ярлыка паттерна):
 * Продукт пушит сущности из нашего приложения во внешние CRM.
 * Исторически интеграции писали «под конкретного вендора»: наследовали
 * базовый SalesforceSync / HubSpotSync и переопределяли куски.
 * Потом попросили те же сущности в Pipedrive — скопировали иерархию.
 * Потом «давайте ещё Activity». Потом «в Salesforce иначе маппим кастомные поля».
 *
 * Сейчас в бэклоге три тикета (см. внизу). Оцени стоимость на ЭТОМ коде,
 * потом отрефактори так, чтобы тикеты стали дешёвыми.
 *
 * Важно:
 * - здесь нет учебной подсказки «ось A / ось B» и нет готовых ролей паттерна;
 * - не всё, что бесит, обязано стать отдельной иерархией;
 * - если выделишь лишнее «на будущее» — это тоже ошибка.
 *
 * Критерий готовности — не «похоже на solution из папки», а:
 *   1) тикеты ниже правятся локально (желательно +1 место на каждое изменение оси);
 *   2) нет копипасты маппинга Contact/Deal между CRM;
 *   3) смена транспорта/API-клиента CRM не требует трогать сборку Deal/Contact;
 *   4) в комментарии (10–15 строк) своими словами: что росло мультипликативно,
 *      что ты развёл, что сознательно оставил простым.
 */

interface Contact {
  id: string;
  email: string;
  fullName: string;
}

interface Deal {
  id: string;
  title: string;
  amountCents: number;
  stage: "lead" | "won" | "lost";
}

interface Activity {
  id: string;
  contactId: string;
  note: string;
}

/** кусок «платформенного» клиента — детали HTTP/SDK вендора */
class SalesforceApi {
  upsertContact(fields: Record<string, string>): void {
    console.log("SF upsert Contact", fields);
  }
  upsertOpportunity(fields: Record<string, unknown>): void {
    console.log("SF upsert Opportunity", fields);
  }
  createTask(fields: Record<string, string>): void {
    console.log("SF create Task", fields);
  }
}

class HubSpotApi {
  putContact(properties: Record<string, string>): void {
    console.log("HS put contact", properties);
  }
  putDeal(properties: Record<string, unknown>): void {
    console.log("HS put deal", properties);
  }
  putEngagement(properties: Record<string, string>): void {
    console.log("HS put engagement", properties);
  }
}

class PipedriveApi {
  savePerson(payload: Record<string, string>): void {
    console.log("PD save person", payload);
  }
  saveDeal(payload: Record<string, unknown>): void {
    console.log("PD save deal", payload);
  }
  saveActivity(payload: Record<string, string>): void {
    console.log("PD save activity", payload);
  }
}

// ─── «удобное» наследование под вендора ──────────────────────────────────────
// Выглядит нормально: общее для Salesforce в базе, сущности — подклассы.
// Боль проявляется, когда та же сетка сущностей появляется у другого вендора.

abstract class SalesforceSync {
  protected api = new SalesforceApi();

  abstract push(): void;

  protected mapContact(c: Contact): Record<string, string> {
    return {
      Email: c.email,
      LastName: c.fullName,
      External_Id__c: c.id,
    };
  }
}

class SalesforceContactSync extends SalesforceSync {
  constructor(private contact: Contact) {
    super();
  }

  push(): void {
    this.api.upsertContact(this.mapContact(this.contact));
  }
}

class SalesforceDealSync extends SalesforceSync {
  constructor(private deal: Deal) {
    super();
  }

  push(): void {
    // stage → SF picklist живёт ЗДЕСЬ; в HubSpotDealSync будет другая копия смысла
    const stageName =
      this.deal.stage === "won"
        ? "Closed Won"
        : this.deal.stage === "lost"
          ? "Closed Lost"
          : "Prospecting";

    this.api.upsertOpportunity({
      Name: this.deal.title,
      Amount: this.deal.amountCents / 100,
      StageName: stageName,
      External_Id__c: this.deal.id,
    });
  }
}

class SalesforceActivitySync extends SalesforceSync {
  constructor(private activity: Activity) {
    super();
  }

  push(): void {
    this.api.createTask({
      WhoExternalId: this.activity.contactId,
      Description: this.activity.note,
      External_Id__c: this.activity.id,
    });
  }
}

abstract class HubSpotSync {
  protected api = new HubSpotApi();
  abstract push(): void;
}

class HubSpotContactSync extends HubSpotSync {
  constructor(private contact: Contact) {
    super();
  }

  push(): void {
    // тот же Contact, другой словарь полей — но знание «что такое контакт»
    // снова внутри CRM-класса
    this.api.putContact({
      email: this.contact.email,
      firstname: this.contact.fullName,
      app_contact_id: this.contact.id,
    });
  }
}

class HubSpotDealSync extends HubSpotSync {
  constructor(private deal: Deal) {
    super();
  }

  push(): void {
    const dealstage =
      this.deal.stage === "won"
        ? "closedwon"
        : this.deal.stage === "lost"
          ? "closedlost"
          : "appointmentscheduled";

    this.api.putDeal({
      dealname: this.deal.title,
      amount: String(this.deal.amountCents / 100),
      dealstage,
      app_deal_id: this.deal.id,
    });
  }
}

class HubSpotActivitySync extends HubSpotSync {
  constructor(private activity: Activity) {
    super();
  }

  push(): void {
    this.api.putEngagement({
      contact_id: this.activity.contactId,
      body: this.activity.note,
      app_activity_id: this.activity.id,
    });
  }
}

// Pipedrive добавили копипастой «как Salesforce», потому что «так уже сделано»
abstract class PipedriveSync {
  protected api = new PipedriveApi();
  abstract push(): void;
}

class PipedriveContactSync extends PipedriveSync {
  constructor(private contact: Contact) {
    super();
  }

  push(): void {
    this.api.savePerson({
      email: this.contact.email,
      name: this.contact.fullName,
      app_id: this.contact.id,
    });
  }
}

class PipedriveDealSync extends PipedriveSync {
  constructor(private deal: Deal) {
    super();
  }

  push(): void {
    const status =
      this.deal.stage === "won"
        ? "won"
        : this.deal.stage === "lost"
          ? "lost"
          : "open";

    this.api.saveDeal({
      title: this.deal.title,
      value: this.deal.amountCents / 100,
      status,
      app_id: this.deal.id,
    });
  }
}

class PipedriveActivitySync extends PipedriveSync {
  constructor(private activity: Activity) {
    super();
  }

  push(): void {
    this.api.saveActivity({
      person_app_id: this.activity.contactId,
      note: this.activity.note,
      app_id: this.activity.id,
    });
  }
}

/**
 * Диспетчер интеграций. Выглядит «централизованно», но каждый новый
 * вендор × сущность = новая ветка. Плюс особые случаи начинают жить здесь.
 */
function syncToCrm(
  crm: "salesforce" | "hubspot" | "pipedrive",
  entity: "contact" | "deal" | "activity",
  payload: Contact | Deal | Activity,
): void {
  if (crm === "salesforce" && entity === "contact") {
    new SalesforceContactSync(payload as Contact).push();
    return;
  }
  if (crm === "salesforce" && entity === "deal") {
    new SalesforceDealSync(payload as Deal).push();
    return;
  }
  if (crm === "salesforce" && entity === "activity") {
    new SalesforceActivitySync(payload as Activity).push();
    return;
  }
  if (crm === "hubspot" && entity === "contact") {
    new HubSpotContactSync(payload as Contact).push();
    return;
  }
  if (crm === "hubspot" && entity === "deal") {
    new HubSpotDealSync(payload as Deal).push();
    return;
  }
  if (crm === "hubspot" && entity === "activity") {
    new HubSpotActivitySync(payload as Activity).push();
    return;
  }
  if (crm === "pipedrive" && entity === "contact") {
    new PipedriveContactSync(payload as Contact).push();
    return;
  }
  if (crm === "pipedrive" && entity === "deal") {
    new PipedriveDealSync(payload as Deal).push();
    return;
  }
  if (crm === "pipedrive" && entity === "activity") {
    new PipedriveActivitySync(payload as Activity).push();
    return;
  }
  throw new Error(`unsupported ${crm}/${entity}`);
}

// ─── как этим пользуются сейчас ──────────────────────────────────────────────

function demoAsIs(): void {
  syncToCrm("salesforce", "contact", {
    id: "c1",
    email: "a@x.io",
    fullName: "Ada",
  });
  syncToCrm("hubspot", "deal", {
    id: "d1",
    title: "Acme",
    amountCents: 9900,
    stage: "won",
  });
  syncToCrm("pipedrive", "activity", {
    id: "a1",
    contactId: "c1",
    note: "Called",
  });
}

demoAsIs();

/**
 * ТИКЕТЫ ИЗ БЭКЛОГА (оценка «до» → рефакторинг → оценка «после»)
 *
 * T1. Добавить CRM «Close.com» для Contact + Deal + Activity.
 *     Сколько новых классов / веток сегодня? Сколько должно стать после?
 *
 * T2. Во ВСЕХ CRM для Deal stage=======lead» слать amount=0 (бизнес-правило).
 *     Где правишь сейчас? Где хочешь править один раз?
 *
 * T3. Salesforce переезжает на новый Bulk API клиент (другой класс вместо
 *     SalesforceApi). Сущности те же. Что должно остаться нетронутым?
 *
 * Дополнительно подумай (не обязательно выделять в код):
 *   - ретраи / rate-limit — это та же природа изменения, что CRM и сущность?
 *   - или это сквозная политика, которую опасно делать «третьей осью ради осей»?
 *
 * Рефакторь этот файл. Не сверяйся с task1 как с калькой: домен другой,
 * правильная нарезка может отличаться. Потом — ответ 15 в questionnaire.md.
 */
