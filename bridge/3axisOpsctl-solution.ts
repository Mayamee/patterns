/**
 * РЕШЕНИЕ: opsctl с ТРЕМЯ осями через композицию (Bridge + ещё одна иерархия)
 *
 * Оси больше не перемножаются в классах:
 *   1) Abstraction  = ExportJob      (+ Logs / Metrics / Configs)   — что снимаем
 *   2) Implementation = DeliveryChannel (+ File / Stdout / Http / Ssh) — куда шлём
 *   3) Ещё одна иерархия = PayloadCodec (+ Plain / Gzip / Archive)    — как упаковываем
 *
 * Классический Bridge связывает две иерархии. Третью ось тем же приёмом
 * «вклеиваем» композицией: задание экспорта ДЕРЖИТ и канал, и кодек.
 * (Иногда кодек кладут внутрь канала — тоже ок; важно, что оси не слиты наследованием.)
 *
 * Рост становится аддитивным:
 *   новый дамп   → +1 ExportJob
 *   новый канал  → +1 DeliveryChannel
 *   новый кодек  → +1 PayloadCodec
 * вместо + (размер_других_осей) классов на каждую новинку.
 *
 * Почему не «один Bridge на всё»:
 * - мост в учебнике — про пару Abstraction ↔ Implementation;
 * - три ортогональные оси = несколько независимых иерархий, склеенных ссылками;
 * - третья ось по роли часто похожа на Strategy (подмена алгоритма упаковки),
 *   и это нормально: Bridge и Strategy здесь соседствуют, а не конкурируют.
 */

// ─── Общие типы CLI ──────────────────────────────────────────────────────────

type DumpKind = "logs" | "metrics" | "configs";
type ChannelKind = "file" | "stdout" | "http" | "ssh";
type CodecKind = "plain" | "gzip" | "archive";

interface CliFlags {
  dump: DumpKind;
  channel: ChannelKind;
  codec: CodecKind;
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
// ОСЬ 3 — PayloadCodec: «как упаковываем»
// Растёт сама по себе: zstd, age-encrypt, multipart…
// Не знает ни journalctl, ни HTTP.
// ═══════════════════════════════════════════════════════════════════════════

interface PayloadCodec {
  readonly kind: CodecKind;
  /** тот же контракт, что pack() в problem: payload → то, что поедет в send */
  pack(payload: DiagnosticPayload): string;
}

class PlainCodec implements PayloadCodec {
  readonly kind = "plain" as const;

  pack(payload: DiagnosticPayload): string {
    return payload.body;
  }
}

class GzipCodec implements PayloadCodec {
  readonly kind = "gzip" as const;

  pack(payload: DiagnosticPayload): string {
    // zlib.gzipSync(...) — деталь ЭТОГО кодека, один раз
    return `gzip(${payload.body.length}B)`;
  }
}

class ArchiveCodec implements PayloadCodec {
  readonly kind = "archive" as const;

  pack(payload: DiagnosticPayload): string {
    // tar/zip: имя файла внутри архива может зависеть от kind — это ок для кодека
    return `tar{kind=${payload.kind}, body=${payload.body.length}B}`;
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ОСЬ 2 — DeliveryChannel: «куда / как доставляем»
// Implementation из классического Bridge. Не знает, как собрали дамп.
// ═══════════════════════════════════════════════════════════════════════════

interface DeliveryChannel {
  readonly kind: ChannelKind;
  send(packed: string, target: string): void;
}

class FileDeliveryChannel implements DeliveryChannel {
  readonly kind = "file" as const;

  send(packed: string, target: string): void {
    console.log(`write file ${target}, bytes=${packed.length}`);
  }
}

class StdoutDeliveryChannel implements DeliveryChannel {
  readonly kind = "stdout" as const;

  send(packed: string, _target: string): void {
    process.stdout.write(packed + "\n");
  }
}

class HttpDeliveryChannel implements DeliveryChannel {
  readonly kind = "http" as const;

  send(packed: string, target: string): void {
    // Content-Encoding и т.п. — деталь канала (или договорённость с кодеком снаружи)
    console.log(`POST ${target} bytes=${packed.length}`);
  }
}

class SshDeliveryChannel implements DeliveryChannel {
  readonly kind = "ssh" as const;

  send(packed: string, target: string): void {
    console.log(`scp packed → ${target} (${packed.length}B)`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ОСЬ 1 — ExportJob: «что снимаем»
// Abstraction: бизнес-сценарий дампа. Держит кодек и канал (два моста/ссылки).
// ═══════════════════════════════════════════════════════════════════════════

abstract class ExportJob {
  constructor(
    protected channel: DeliveryChannel,
    protected codec: PayloadCodec,
  ) {}

  setChannel(channel: DeliveryChannel): void {
    this.channel = channel;
  }

  setCodec(codec: PayloadCodec): void {
    this.codec = codec;
  }

  /** Высокоуровневый сценарий: collect → prepare → pack → send */
  run(sinceMinutes: number, target: string): void {
    const payload = this.collect(sinceMinutes);
    const prepared = this.prepare(payload);
    const packed = this.codec.pack(prepared);
    this.channel.send(packed, target);
    console.log(
      `[ok] ${this.kind} | ${this.codec.kind} via ${this.channel.kind}`,
    );
  }

  abstract readonly kind: DumpKind;
  protected abstract collect(sinceMinutes: number): DiagnosticPayload;

  /** Хук уточнённой абстракции (политика до упаковки), кодек об этом не знает */
  protected prepare(payload: DiagnosticPayload): DiagnosticPayload {
    return payload;
  }
}

class LogsExportJob extends ExportJob {
  readonly kind = "logs" as const;

  protected collect(sinceMinutes: number): DiagnosticPayload {
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
    return {
      ...payload,
      body: payload.body.replace(/postgres:\/\/\S+/g, "postgres://[REDACTED]"),
    };
  }
}

// ─── Сборка из флагов: сумма осей, не произведение ───────────────────────────

function createCodec(kind: CodecKind): PayloadCodec {
  switch (kind) {
    case "plain":
      return new PlainCodec();
    case "gzip":
      return new GzipCodec();
    case "archive":
      return new ArchiveCodec();
    default: {
      const _exhaustive: never = kind;
      throw new Error(`unknown codec: ${_exhaustive}`);
    }
  }
}

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

function createExportJob(
  dump: DumpKind,
  channel: DeliveryChannel,
  codec: PayloadCodec,
): ExportJob {
  switch (dump) {
    case "logs":
      return new LogsExportJob(channel, codec);
    case "metrics":
      return new MetricsExportJob(channel, codec);
    case "configs":
      return new ConfigsExportJob(channel, codec);
    default: {
      const _exhaustive: never = dump;
      throw new Error(`unknown dump: ${_exhaustive}`);
    }
  }
}

/**
 * Фабрика дешёвая именно потому, что ветвление — внутри ОДНОЙ оси за раз:
 *   3 + 4 + 3 веток, а не 36 case'ов «дамп:кодек:канал».
 * Новый ZstdCodec не трогает createChannel / createExportJob.
 */
function wireFromFlags(flags: CliFlags): ExportJob {
  return createExportJob(
    flags.dump,
    createChannel(flags.channel),
    createCodec(flags.codec),
  );
}

// ─── Демонстрация ────────────────────────────────────────────────────────────

function main(): void {
  // opsctl dump --type metrics --codec archive --channel ssh --target ... --since 15
  const flags: CliFlags = {
    dump: "metrics",
    codec: "archive",
    channel: "ssh",
    target: "ops@bastion:/var/inbox/api-1.metrics.tgz",
    sinceMinutes: 15,
  };

  const job = wireFromFlags(flags);
  job.run(flags.sinceMinutes, flags.target);

  // Та же абстракция и кодек, другой канал — без MetricsArchiveToStdoutExport
  job.setChannel(new StdoutDeliveryChannel());
  job.run(flags.sinceMinutes, "-");

  // Та же абстракция и канал, другой кодек — без нового гибридного класса
  job.setCodec(new GzipCodec());
  job.setChannel(new HttpDeliveryChannel());
  job.run(flags.sinceMinutes, "https://collector.internal/ingest");

  // Другая абстракция + уже существующие кодек и канал
  const configs = new ConfigsExportJob(new FileDeliveryChannel(), new PlainCodec());
  configs.run(0, "./api-1.configs");
}

main();

/**
 * Что стало явно видно:
 * 1) collect / pack / send живут каждый в своей иерархии — без копипасты по кубу;
 * 2) оси расширяются аддитивно (A+B+C), а не мультипликативно (A×B×C);
 * 3) CLI склеивает тройку в рантайме, а не выбирает гибридный класс;
 * 4) setChannel / setCodec — переключение осей у уже созданного задания.
 *
 * Связь с 2-осевым opsctl-solution.ts:
 *   там мост ExportJob → DeliveryChannel;
 *   здесь к нему добавлена ещё одна ортогональная иерархия PayloadCodec.
 *
 * Сравнение со Strategy:
 *   PayloadCodec сам по себе очень похож на Strategy («как упаковать»).
 *   Bridge-часть — в том, что ExportJob и DeliveryChannel тоже растут семействами
 *   и собираются в любую пару/тройку, а не «стабильный контекст + один алгоритм».
 */
