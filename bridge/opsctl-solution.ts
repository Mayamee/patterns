/**
 * РЕШЕНИЕ: тот же opsctl через паттерн Bridge
 *
 * Две оси больше не перемножаются:
 *   Abstraction  = ExportJob (+ уточнения Logs / Metrics / Configs)
 *   Implementation = DeliveryChannel (+ File / Stdout / Http / Ssh)
 *
 * Связь — композиция: задание экспорта ДЕРЖИТ канал доставки.
 * Новая ось A → +1 класс ExportJob. Новая ось B → +1 класс Channel.
 * Комбинации собираются в рантайме из флагов CLI, без матрицы классов.
 *
 * Почему это именно Bridge, а не Strategy:
 * - Strategy подменила бы ОДИН алгоритм у стабильного контекста
 *   (например, только сжатие: gzip/zstd);
 * - здесь РАСТУТ ДВЕ иерархии, и клиенту нужна любая пара из них.
 */

// ─── Общие типы CLI ──────────────────────────────────────────────────────────

type DumpKind = "logs" | "metrics" | "configs";
type ChannelKind = "file" | "stdout" | "http" | "ssh";

interface CliFlags {
  dump: DumpKind;
  channel: ChannelKind;
  /** путь файла / URL webhook / user@host:/path */
  target: string;
  sinceMinutes: number;
}

interface DiagnosticPayload {
  kind: DumpKind;
  collectedAt: string;
  host: string;
  body: string;
}

// ═══════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION — «как / куда доставляем»
// Иерархия может расти сама по себе: S3, gRPC, syslog…
// ═══════════════════════════════════════════════════════════════════════════

interface DeliveryChannel {
  readonly kind: ChannelKind;
  send(payload: DiagnosticPayload, target: string): void;
}

class FileDeliveryChannel implements DeliveryChannel {
  readonly kind = "file" as const;

  send(payload: DiagnosticPayload, target: string): void {
    // fs.writeFileSync(target, payload.body)
    console.log(`write file ${target}, bytes=${payload.body.length}`);
  }
}

class StdoutDeliveryChannel implements DeliveryChannel {
  readonly kind = "stdout" as const;

  send(payload: DiagnosticPayload, _target: string): void {
    // удобно для pipe: opsctl dump metrics --channel stdout | jq
    process.stdout.write(payload.body + "\n");
  }
}

class HttpDeliveryChannel implements DeliveryChannel {
  readonly kind = "http" as const;

  send(payload: DiagnosticPayload, target: string): void {
    // fetch(target, { method: "POST", body: JSON.stringify(payload) })
    // Логика HTTP живёт ЗДЕСЬ один раз — не в каждом *ToHttpExport
    console.log(`POST ${target} kind=${payload.kind}`);
  }
}

class SshDeliveryChannel implements DeliveryChannel {
  readonly kind = "ssh" as const;

  send(payload: DiagnosticPayload, target: string): void {
    // ssh/scp; парсинг user@host:/path — деталь ЭТОГО канала
    console.log(`scp payload → ${target}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ABSTRACTION — «что снимаем»
// Знает бизнес-смысл дампа, не знает деталей HTTP/SSH/файлов.
// ═══════════════════════════════════════════════════════════════════════════

abstract class ExportJob {
  /**
   * Мост: абстракция держит реализацию.
   * Канал можно даже сменить на лету (dry-run → stdout, prod → http).
   */
  constructor(protected channel: DeliveryChannel) {}

  setChannel(channel: DeliveryChannel): void {
    this.channel = channel;
  }

  /** Шаблон высокоуровневого сценария: collect → optionally transform → deliver */
  run(sinceMinutes: number, target: string): void {
    const payload = this.collect(sinceMinutes);
    const prepared = this.prepare(payload);
    this.channel.send(prepared, target);
    console.log(`[ok] ${this.kind} via ${this.channel.kind}`);
  }

  abstract readonly kind: DumpKind;
  protected abstract collect(sinceMinutes: number): DiagnosticPayload;

  /** Хук уточнённой абстракции: например, редaction конфигов перед отправкой */
  protected prepare(payload: DiagnosticPayload): DiagnosticPayload {
    return payload;
  }
}

class LogsExportJob extends ExportJob {
  readonly kind = "logs" as const;

  protected collect(sinceMinutes: number): DiagnosticPayload {
    // Вся специфика сбора логов — один раз, без копипасты на каждый канал
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }
}

class MetricsExportJob extends ExportJob {
  readonly kind = "metrics" as const;

  protected collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "metrics",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: JSON.stringify({
        windowMin: sinceMinutes,
        cpuPct: 63.2,
        rssMb: 512,
      }),
    };
  }
}

class ConfigsExportJob extends ExportJob {
  readonly kind = "configs" as const;

  protected collect(_sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "server_name api;\nDATABASE_URL=postgres://***\n",
    };
  }

  protected override prepare(payload: DiagnosticPayload): DiagnosticPayload {
    // Уточнённая абстракция добавляет политику, канал об этом не знает
    return {
      ...payload,
      body: payload.body.replace(/postgres:\/\/\S+/g, "postgres://[REDACTED]"),
    };
  }
}

// ─── Сборка из флагов: сумма осей, не произведение ───────────────────────────

function createChannel(kind: ChannelKind): DeliveryChannel {
  switch (kind) {
    case "file":
      return new FileDeliveryChannel();
    case "stdout":
      return new StdoutDeliveryChannel();
    case "http":
      return new HttpDeliveryChannel();
    case "ssh":
      return new SshDeliveryChannel();
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown channel: ${_exhaustive}`);
    }
  }
}

function createExportJob(dump: DumpKind, channel: DeliveryChannel): ExportJob {
  switch (dump) {
    case "logs":
      return new LogsExportJob(channel);
    case "metrics":
      return new MetricsExportJob(channel);
    case "configs":
      return new ConfigsExportJob(channel);
    default: {
      const _exhaustive: never = dump;
      throw new Error(`unknown dump: ${_exhaustive}`);
    }
  }
}

/**
 * Почему фабрика теперь дешёвая:
 * - ветвление только внутри ОДНОЙ оси (4 + 3 веток, не 12);
 * - добавление S3Channel не трогает createExportJob;
 * - добавление TracesExportJob не трогает createChannel.
 */
function wireFromFlags(flags: CliFlags): ExportJob {
  return createExportJob(flags.dump, createChannel(flags.channel));
}

// ─── Демонстрация ────────────────────────────────────────────────────────────

function main(): void {
  // opsctl dump --type metrics --channel http --target https://collector/ingest --since 15
  const flags: CliFlags = {
    dump: "metrics",
    channel: "http",
    target: "https://collector.internal/ingest",
    sinceMinutes: 15,
  };

  const job = wireFromFlags(flags);
  job.run(flags.sinceMinutes, flags.target);

  // Та же абстракция, другая реализация — без нового класса MetricsToStdoutExport
  job.setChannel(new StdoutDeliveryChannel());
  job.run(flags.sinceMinutes, "-");

  // Другая абстракция + уже существующий канал
  const configsOverSsh = new ConfigsExportJob(new SshDeliveryChannel());
  configsOverSsh.run(0, "ops@bastion:/var/inbox/api-1.configs");
}

main();

/**
 * Что стало явно видно:
 * 1) collect() больше не копируется на каждый канал;
 * 2) send() больше не копируется на каждый тип дампа;
 * 3) оси расширяются аддитивно (A+B), а не мультипликативно (A×B);
 * 4) клиент/CLI склеивает пару, а не выбирает гибридный класс.
 *
 * Сравнение со Strategy (на этой же утилите):
 *   Strategy — «сжать payload gzip или zstd» внутри одного ExportJob/Channel.
 *   Bridge  — «любой ExportJob с любым DeliveryChannel».
 */
