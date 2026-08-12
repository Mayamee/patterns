/**
 * ЗАДАЧА 2 — отрефактори и осознанно проведи границы
 *
 * Домен: генератор отчётов в аналитическом CLI / batch-job.
 *
 * Здесь уже ТРИ кандидата в оси (как в 3axisOpsctl), плюс ловушка:
 * не всё, что «можно выделить», обязано быть отдельной иерархией Bridge.
 *
 * Кандидаты:
 *   1) ЧТО считаем     — SalesReport / UsageReport / AuditReport
 *   2) КАК сериализуем — Json / Csv / Pdf   ← часто выглядит как Strategy
 *   3) КУДА пишем      — LocalFs / S3 / Stdout
 *
 * Сейчас всё свалено в гибридные классы и тройной god-switch.
 *
 * Твоя цель:
 *   - развязать оси так, чтобы рост был аддитивным;
 *   - явно решить: Json/Csv/Pdf — отдельная иерархия рядом с каналом,
 *     Strategy внутри job, или деталь канала? Обоснуй в комментарии;
 *   - сохранить бизнес-правило AuditReport: перед записью маскировать
 *     поля `email` / `ip` (аналог prepare/redaction в opsctl-solution);
 *   - не плодить абстракции «на будущее», если ось не растёт.
 *
 * Критерий готовности:
 *   - нет классов вида SalesCsvToS3Report;
 *   - добавление ParquetSerializer или AzureBlobSink = +1 класс;
 *   - в шапке файла (или рядом) — 5–10 строк: какие оси ты выделил и почему
 *     сериализацию положил именно туда.
 *
 * Опора: ../3axisOpsctl-solution.ts + раздел Bridge vs Strategy в ../README.md.
 */

// ─── типы ────────────────────────────────────────────────────────────────────

type ReportKind = "sales" | "usage" | "audit";
type FormatKind = "json" | "csv" | "pdf";
type SinkKind = "fs" | "s3" | "stdout";

interface ReportRow {
  id: string;
  email?: string;
  ip?: string;
  amount?: number;
  units?: number;
  action?: string;
}

interface ReportDocument {
  kind: ReportKind;
  title: string;
  rows: ReportRow[];
  generatedAt: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// A) ГИБРИДНЫЕ КЛАССЫ (кусок куба report × format × sink)
// Имена уже кричат: SalesCsvToS3, AuditJsonToFs, …
// ═══════════════════════════════════════════════════════════════════════════

abstract class ReportJob {
  abstract readonly label: string;
  abstract collect(): ReportDocument;
  abstract serialize(doc: ReportDocument): string;
  abstract write(serialized: string, target: string): void;

  run(target: string): void {
    const doc = this.collect();
    const bytes = this.serialize(doc);
    this.write(bytes, target);
    console.log(`[ok] ${this.label} → ${target}`);
  }
}

class SalesCsvToS3 extends ReportJob {
  readonly label = "sales|csv→s3";

  collect(): ReportDocument {
    return {
      kind: "sales",
      title: "Sales",
      generatedAt: new Date().toISOString(),
      rows: [
        { id: "o-1", amount: 120 },
        { id: "o-2", amount: 40 },
      ],
    };
  }

  serialize(doc: ReportDocument): string {
    // CSV логика — будет копироваться в SalesCsvToFs, UsageCsvToS3, …
    const header = "id,amount";
    const lines = doc.rows.map((r) => `${r.id},${r.amount ?? ""}`);
    return [header, ...lines].join("\n");
  }

  write(serialized: string, target: string): void {
    console.log(`s3 put ${target} (${serialized.length}B)`);
  }
}

class AuditJsonToFs extends ReportJob {
  readonly label = "audit|json→fs";

  collect(): ReportDocument {
    return {
      kind: "audit",
      title: "Audit",
      generatedAt: new Date().toISOString(),
      rows: [
        { id: "e-1", email: "a@x.io", ip: "10.0.0.1", action: "login" },
        { id: "e-2", email: "b@x.io", ip: "10.0.0.2", action: "export" },
      ],
    };
  }

  serialize(doc: ReportDocument): string {
    // ПРОБЛЕМА: redaction свалена внутрь serialize вместе с JSON
    const redacted = {
      ...doc,
      rows: doc.rows.map((r) => ({
        ...r,
        email: r.email ? "[REDACTED]" : undefined,
        ip: r.ip ? "[REDACTED]" : undefined,
      })),
    };
    return JSON.stringify(redacted);
  }

  write(serialized: string, target: string): void {
    console.log(`write file ${target} (${serialized.length}B)`);
  }
}

class UsagePdfToStdout extends ReportJob {
  readonly label = "usage|pdf→stdout";

  collect(): ReportDocument {
    return {
      kind: "usage",
      title: "Usage",
      generatedAt: new Date().toISOString(),
      rows: [
        { id: "u-1", units: 10 },
        { id: "u-2", units: 3 },
      ],
    };
  }

  serialize(doc: ReportDocument): string {
    // «PDF» условно
    return `PDF<<${doc.title}; rows=${doc.rows.length}>>`;
  }

  write(serialized: string, _target: string): void {
    process.stdout.write(serialized + "\n");
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// B) БОГ С ТРОЙНЫМ ВЕТВЛЕНИЕМ
// Особый случай: audit + любой format — redaction зашит в середину метода.
// ═══════════════════════════════════════════════════════════════════════════

function godReport(
  kind: ReportKind,
  format: FormatKind,
  sink: SinkKind,
  target: string,
): void {
  let doc: ReportDocument;

  if (kind === "sales") {
    doc = {
      kind: "sales",
      title: "Sales",
      generatedAt: new Date().toISOString(),
      rows: [{ id: "o-1", amount: 120 }],
    };
  } else if (kind === "usage") {
    doc = {
      kind: "usage",
      title: "Usage",
      generatedAt: new Date().toISOString(),
      rows: [{ id: "u-1", units: 10 }],
    };
  } else {
    doc = {
      kind: "audit",
      title: "Audit",
      generatedAt: new Date().toISOString(),
      rows: [{ id: "e-1", email: "a@x.io", ip: "10.0.0.1", action: "login" }],
    };
  }

  // склейка политики с форматом
  if (kind === "audit") {
    doc = {
      ...doc,
      rows: doc.rows.map((r) => ({
        ...r,
        email: "[REDACTED]",
        ip: "[REDACTED]",
      })),
    };
  }

  let serialized: string;
  if (format === "json") {
    serialized = JSON.stringify(doc);
  } else if (format === "csv") {
    serialized = doc.rows.map((r) => Object.values(r).join(",")).join("\n");
  } else {
    serialized = `PDF<<${doc.title}>>`;
  }

  if (sink === "fs") {
    console.log(`write file ${target} (${serialized.length}B)`);
  } else if (sink === "s3") {
    console.log(`s3 put ${target} (${serialized.length}B)`);
  } else {
    process.stdout.write(serialized + "\n");
  }

  console.log(`[ok] god ${kind}|${format}→${sink}`);
}

// ─── демо «как есть» ─────────────────────────────────────────────────────────

function demoBroken(): void {
  new SalesCsvToS3().run("s3://bucket/sales.csv");
  new AuditJsonToFs().run("./audit.json");
  new UsagePdfToStdout().run("-");
  godReport("audit", "csv", "s3", "s3://bucket/audit.csv");
}

demoBroken();

/**
 * TODO — рефакторинг:
 *
 * Минимальный каркас (можешь изменить, если аргументируешь):
 *
 *   interface ReportSink { write(bytes: string, target: string): void }
 *   interface ReportFormat { serialize(doc: ReportDocument): string }  // или не interface?
 *   abstract class Report {
 *     constructor(protected format, protected sink) {}
 *     abstract collect(): ReportDocument;
 *     protected prepare(doc): ReportDocument { return doc }  // audit override
 *     run(target) { sink.write(format.serialize(prepare(collect())), target) }
 *   }
 *
 * Вопросы, на которые ответь комментарием в этом файле после решения:
 *   Q1. Format — Bridge-иерархия или Strategy? Почему?
 *   Q2. Почему redaction в prepare() у AuditReport, а не внутри JsonFormat?
 *   Q3. Что бы ты НЕ выделял, если PDF навсегда один и sink только fs?
 *
 * Затем допиши ответ 15 в questionnaire.md.
 */
