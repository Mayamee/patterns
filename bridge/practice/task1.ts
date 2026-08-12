/**
 * ЗАДАЧА 1 — отрефактори под Bridge
 *
 * Домен: система уведомлений в SaaS.
 *
 * Две независимые оси (сейчас склеены):
 *   1) ЧТО уведомляем  — Invite / PasswordReset / BillingAlert
 *   2) КУДА шлём      — Email / Sms / Slack / Push
 *
 * Сейчас: матрица классов + бог-диспетчер (тот же запах, что в coffee/opsctl-problem).
 *
 * Твоя цель:
 *   - выделить Abstraction (сценарий уведомления) и Implementation (канал доставки);
 *   - связать композицией;
 *   - собирать любую пару в рантайме без *ToEmail / *ToSlack гибридов;
 *   - добавить новый канал или новый тип уведомления должно стоить +1 класс, не +N.
 *
 * Подсказки смотри в ../coffee-solution.ts / ../opsctl-solution.ts — но домен другой,
 * не копируй имена слепо: сначала назови оси своими словами.
 *
 * Критерий готовности:
 *   createNotification("billing", createChannel("slack")).dispatch()
 *   работает без класса BillingAlertToSlack.
 */

// ─── типы ────────────────────────────────────────────────────────────────────

type NoticeKind = "invite" | "password-reset" | "billing";
type ChannelKind = "email" | "sms" | "slack" | "push";

interface User {
  id: string;
  email: string;
  phone: string;
  slackId: string;
  deviceToken: string;
}

interface NoticePayload {
  kind: NoticeKind;
  subject: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// A) КОМБИНАТОРНЫЙ ВЗРЫВ (фрагмент матрицы)
// 3 типа × 4 канала = 12 листовых классов. Ниже — часть, чтобы увидеть копипасту.
// ═══════════════════════════════════════════════════════════════════════════

abstract class Notification {
  abstract readonly label: string;
  abstract build(user: User): NoticePayload;
  abstract deliver(user: User, payload: NoticePayload): void;

  dispatch(user: User): void {
    const payload = this.build(user);
    this.deliver(user, payload);
    console.log(`[ok] ${this.label} → user=${user.id}`);
  }
}

class InviteToEmail extends Notification {
  readonly label = "invite→email";

  build(user: User): NoticePayload {
    return {
      kind: "invite",
      subject: "You're invited",
      body: `Join workspace, ${user.email}`,
    };
  }

  deliver(user: User, payload: NoticePayload): void {
    console.log(`SMTP to ${user.email}: ${payload.subject}`);
  }
}

class InviteToSms extends Notification {
  readonly label = "invite→sms";

  build(user: User): NoticePayload {
    // ПРОБЛЕМА: тот же текст приглашения скопирован
    return {
      kind: "invite",
      subject: "You're invited",
      body: `Join workspace, ${user.email}`,
    };
  }

  deliver(user: User, payload: NoticePayload): void {
    console.log(`SMS to ${user.phone}: ${payload.body}`);
  }
}

class InviteToSlack extends Notification {
  readonly label = "invite→slack";

  build(user: User): NoticePayload {
    return {
      kind: "invite",
      subject: "You're invited",
      body: `Join workspace, ${user.email}`,
    };
  }

  deliver(user: User, payload: NoticePayload): void {
    console.log(`Slack DM ${user.slackId}: ${payload.body}`);
  }
}

class PasswordResetToEmail extends Notification {
  readonly label = "password-reset→email";

  build(_user: User): NoticePayload {
    return {
      kind: "password-reset",
      subject: "Reset your password",
      body: "Click the link (expires in 15m)",
    };
  }

  deliver(user: User, payload: NoticePayload): void {
    // ПРОБЛЕМА: SMTP снова здесь — уже был в InviteToEmail
    console.log(`SMTP to ${user.email}: ${payload.subject}`);
  }
}

class BillingAlertToPush extends Notification {
  readonly label = "billing→push";

  build(_user: User): NoticePayload {
    return {
      kind: "billing",
      subject: "Payment failed",
      body: "Update card to avoid suspension",
    };
  }

  deliver(user: User, payload: NoticePayload): void {
    console.log(`PUSH ${user.deviceToken}: ${payload.subject}`);
  }
}

// …представь ещё InviteToPush, BillingToEmail, BillingToSms, … до 12 классов

// ═══════════════════════════════════════════════════════════════════════════
// B) БОГ-ДИСПЕТЧЕР — та же склейка осей, только в одном методе
// ═══════════════════════════════════════════════════════════════════════════

function godDispatch(kind: NoticeKind, channel: ChannelKind, user: User): void {
  let payload: NoticePayload;

  if (kind === "invite") {
    payload = {
      kind: "invite",
      subject: "You're invited",
      body: `Join workspace, ${user.email}`,
    };
  } else if (kind === "password-reset") {
    payload = {
      kind: "password-reset",
      subject: "Reset your password",
      body: "Click the link (expires in 15m)",
    };
  } else {
    payload = {
      kind: "billing",
      subject: "Payment failed",
      body: "Update card to avoid suspension",
    };
  }

  if (channel === "email") {
    console.log(`SMTP to ${user.email}: ${payload.subject}`);
  } else if (channel === "sms") {
    console.log(`SMS to ${user.phone}: ${payload.body}`);
  } else if (channel === "slack") {
    console.log(`Slack DM ${user.slackId}: ${payload.body}`);
  } else {
    console.log(`PUSH ${user.deviceToken}: ${payload.subject}`);
  }

  console.log(`[ok] god ${kind}→${channel}`);
}

// ─── демо «как есть» ─────────────────────────────────────────────────────────

function demoBroken(): void {
  const user: User = {
    id: "u-1",
    email: "a@corp.io",
    phone: "+1000",
    slackId: "U123",
    deviceToken: "tok",
  };

  new InviteToEmail().dispatch(user);
  new BillingAlertToPush().dispatch(user);
  godDispatch("password-reset", "sms", user);
}

demoBroken();

/**
 * TODO (твой рефакторинг ниже или вместо матрицы):
 *
 * 1. interface DeliveryChannel { send(user, payload): void }
 * 2. abstract class NoticeJob { constructor(channel); build(); dispatch() }
 * 3. InviteNotice / PasswordResetNotice / BillingNotice
 * 4. EmailChannel / SmsChannel / SlackChannel / PushChannel
 * 5. createChannel + createNotice — ветвление ТОЛЬКО внутри одной оси
 * 6. Покажи: тот же BillingNotice, другой канал — без нового класса
 *
 * Когда закончишь — ответь на вопрос 15 в questionnaire.md.
 */
