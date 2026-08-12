/**
 * ПРОБЛЕМА: CLI-утилита opsctl без паттерна Bridge — уже ТРИ оси
 *
 * Сценарий тот же, что в opsctl-problem.ts, но осей стало три:
 *
 *   1) что снимаем     — логи / метрики / конфиги
 *   2) куда шлём       — файл / stdout / HTTP / SSH
 *   3) как упаковываем — plain / gzip / archive (tar-like)
 *
 * Третья ось ортогональна первым двум: «упаковать gzip» не зависит от того,
 * логи это или метрики, и не зависит от того, уйдёт ли пакет в файл или в HTTP.
 *
 * Ниже — те же два тупика, только боль уже кубическая:
 *   A) комбинаторный взрыв подклассов (произведение ТРЁХ осей);
 *   B) «бог-диспетчер» с тройным ветвлением.
 *
 * Добавить новый дамп / канал / кодек = трогать все комбинации (или все ветки).
 */

// ─── Общие типы CLI ──────────────────────────────────────────────────────────

type DumpKind = "logs" | "metrics" | "configs";
type ChannelKind = "file" | "stdout" | "http" | "ssh";
/** третья ось: как готовим байты перед доставкой */
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
// A) КОМБИНАТОРНЫЙ ВЗРЫВ НАСЛЕДОВАНИЯ
//
// С двумя осями было: 3 дампа × 4 канала = 12 листовых классов.
// С тремя:          3 × 4 × 3 = 36 листовых классов.
//
// Имена уже кричат о проблеме: LogsPlainToHttp, MetricsGzipToSsh, …
// Добавили TracesDump → ещё +12 классов.
// Добавили S3Channel  → ещё +9.
// Добавили ZstdCodec  → ещё +12.
//
// Ниже — фрагмент матрицы (не все 36): хватает, чтобы увидеть копипасту
// collect / pack / send и понять масштаб.
// ═══════════════════════════════════════════════════════════════════════════

abstract class DiagnosticExport {
  abstract readonly label: string;
  abstract collect(sinceMinutes: number): DiagnosticPayload;
  /** ось кодека: превратить payload в «то, что поедет» */
  abstract pack(payload: DiagnosticPayload): string;
  abstract send(packed: string, target: string): void;

  run(sinceMinutes: number, target: string): void {
    const payload = this.collect(sinceMinutes);
    const packed = this.pack(payload);
    this.send(packed, target);
    console.log(`[ok] ${this.label} → ${target}`);
  }
}

// --- логи × plain × несколько каналов ----------------------------------------

class LogsPlainToFileExport extends DiagnosticExport {
  readonly label = "logs|plain→file";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  pack(payload: DiagnosticPayload): string {
    // plain: без обёртки
    return payload.body;
  }

  send(packed: string, target: string): void {
    console.log(`write file ${target}, bytes=${packed.length}`);
  }
}

class LogsPlainToHttpExport extends DiagnosticExport {
  readonly label = "logs|plain→http";

  collect(sinceMinutes: number): DiagnosticPayload {
    // Дублирование collect между Logs* — уже запах (как в 2-осевом примере)
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  pack(payload: DiagnosticPayload): string {
    // Тот же plain, что и в LogsPlainToFile — ещё одна копия
    return payload.body;
  }

  send(packed: string, target: string): void {
    console.log(`POST ${target} bytes=${packed.length}`);
  }
}

// --- логи × gzip × каналы ----------------------------------------------------

class LogsGzipToFileExport extends DiagnosticExport {
  readonly label = "logs|gzip→file";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  pack(payload: DiagnosticPayload): string {
    // «сжали» — заглушка; важно, что gzip-логика размножена по классам
    return `gzip(${payload.body.length}B)`;
  }

  send(packed: string, target: string): void {
    // send для file снова скопирован
    console.log(`write file ${target}, bytes=${packed.length}`);
  }
}

class LogsGzipToHttpExport extends DiagnosticExport {
  readonly label = "logs|gzip→http";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  pack(payload: DiagnosticPayload): string {
    return `gzip(${payload.body.length}B)`;
  }

  send(packed: string, target: string): void {
    console.log(`POST ${target} bytes=${packed.length}`);
  }
}

// --- метрики × archive × ssh (ещё один «угол» куба) ---------------------------

class MetricsArchiveToSshExport extends DiagnosticExport {
  readonly label = "metrics|archive→ssh";

  collect(sinceMinutes: number): DiagnosticPayload {
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

  pack(payload: DiagnosticPayload): string {
    // archive: «положили в tar» — снова заглушка оси кодека
    return `tar{kind=${payload.kind}, body=${payload.body.length}B}`;
  }

  send(packed: string, target: string): void {
    console.log(`scp packed → ${target} (${packed.length}B)`);
  }
}

// --- конфиги × gzip × stdout (и так далее… остальное воображаем) ------------

class ConfigsGzipToStdoutExport extends DiagnosticExport {
  readonly label = "configs|gzip→stdout";

  collect(_sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "nginx.conf + app.env redacted",
    };
  }

  pack(payload: DiagnosticPayload): string {
    return `gzip(${payload.body.length}B)`;
  }

  send(packed: string, _target: string): void {
    process.stdout.write(packed + "\n");
  }
}

/**
 * Фабрика по флагам — уже таблица 3×4×3.
 * На практике сюда не влезают все case'ы; ниже — только то, что объявили выше,
 * плюс явный сигнал: «остальные 30+ комбинаций тоже ждут своих классов».
 */
function createExportByInheritance(flags: CliFlags): DiagnosticExport {
  const key = `${flags.dump}:${flags.codec}:${flags.channel}` as const;

  switch (key) {
    case "logs:plain:file":
      return new LogsPlainToFileExport();
    case "logs:plain:http":
      return new LogsPlainToHttpExport();
    case "logs:gzip:file":
      return new LogsGzipToFileExport();
    case "logs:gzip:http":
      return new LogsGzipToHttpExport();
    case "metrics:archive:ssh":
      return new MetricsArchiveToSshExport();
    case "configs:gzip:stdout":
      return new ConfigsGzipToStdoutExport();
    default:
      // Именно это и больно: «нет класса под комбинацию» — дыра в рантайме,
      // а не ошибка компиляции по одной оси.
      throw new Error(
        `нет класса для ${key} (из ~36 комбинаций реализован лишь фрагмент)`,
      );
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// B) АЛЬТЕРНАТИВНЫЙ ТУПИК: ОДИН КЛАСС + ТРОЙНЫЕ ВЕТВЛЕНИЯ
//
// Классов мало, но run() знает ВСЕ три оси.
// Цикломатическая сложность растёт как произведение.
// Тестировать кодек отдельно от сбора / канала почти нельзя:
// всё свалено в один метод.
// «Особый случай» легко смешает оси (gzip+http+configs в одной ветке).
// ═══════════════════════════════════════════════════════════════════════════

class OpsctlGodCommand {
  run(flags: CliFlags): void {
    let payload: DiagnosticPayload;

    // --- ось 1: что собираем -------------------------------------------------
    if (flags.dump === "logs") {
      payload = {
        kind: "logs",
        collectedAt: new Date().toISOString(),
        host: "api-1",
        body: `journalctl --since "${flags.sinceMinutes} min ago"\n...`,
      };
    } else if (flags.dump === "metrics") {
      payload = {
        kind: "metrics",
        collectedAt: new Date().toISOString(),
        host: "api-1",
        body: JSON.stringify({
          windowMin: flags.sinceMinutes,
          cpuPct: 63.2,
          rssMb: 512,
        }),
      };
    } else if (flags.dump === "configs") {
      payload = {
        kind: "configs",
        collectedAt: new Date().toISOString(),
        host: "api-1",
        body: "nginx.conf + app.env redacted",
      };
    } else {
      const _exhaustive: never = flags.dump;
      throw new Error(`unknown dump: ${_exhaustive}`);
    }

    // --- ось 3: как упаковываем ---------------------------------------------
    let packed: string;
    if (flags.codec === "plain") {
      packed = payload.body;
    } else if (flags.codec === "gzip") {
      packed = `gzip(${payload.body.length}B)`;
    } else if (flags.codec === "archive") {
      packed = `tar{kind=${payload.kind}, body=${payload.body.length}B}`;
    } else {
      const _exhaustive: never = flags.codec;
      throw new Error(`unknown codec: ${_exhaustive}`);
    }

    // --- ось 2: куда доставляем ---------------------------------------------
    // В реальности сюда же полезут ретраи, auth, Content-Encoding…
    // и снова появятся «особые случаи» на пересечении осей.
    if (flags.channel === "file") {
      console.log(`write file ${flags.target}, bytes=${packed.length}`);
    } else if (flags.channel === "stdout") {
      process.stdout.write(packed + "\n");
    } else if (flags.channel === "http") {
      if (flags.codec === "gzip" && payload.kind === "configs") {
        // смешали три оси в одной ветке — классика god-команды
        console.log(`POST ${flags.target} (gzip configs envelope)`);
      } else {
        console.log(`POST ${flags.target} bytes=${packed.length}`);
      }
    } else if (flags.channel === "ssh") {
      console.log(`scp packed → ${flags.target} (${packed.length}B)`);
    } else {
      const _exhaustive: never = flags.channel;
      throw new Error(`unknown channel: ${_exhaustive}`);
    }

    console.log(`[ok] ${flags.dump} | ${flags.codec} via ${flags.channel}`);
  }
}

// ─── Точка входа (имитация argv) ─────────────────────────────────────────────

function parseArgs(argv: string[]): CliFlags {
  // opsctl dump --type metrics --codec gzip --channel http --target URL --since 15
  return {
    dump: (argv[0] as DumpKind) ?? "logs",
    codec: (argv[1] as CodecKind) ?? "plain",
    channel: (argv[2] as ChannelKind) ?? "file",
    target: argv[3] ?? "./out.diag",
    sinceMinutes: Number(argv[4] ?? 15),
  };
}

function main(): void {
  const flags = parseArgs([
    "metrics",
    "archive",
    "ssh",
    "ops@bastion:/var/inbox/api-1.metrics.tgz",
    "15",
  ]);

  // Вариант A: один из ~36 классов (если он вообще написан)
  const byInheritance = createExportByInheritance(flags);
  byInheritance.run(flags.sinceMinutes, flags.target);

  // Вариант B: один метод со всеми if по трём осям
  new OpsctlGodCommand().run({
    ...flags,
    dump: "configs",
    codec: "gzip",
    channel: "http",
    target: "https://collector.internal/ingest",
  });
}

main();

/**
 * Итог боли (усиленный относительно 2 осей):
 * - collect / pack / send копируются по «срезам» куба;
 * - фабрика и god-команда знают все три оси сразу;
 * - стоимость фичи «новый кодек» = O(дампы × каналы), и аналогично для других осей;
 * - дыры в матрице («забыли MetricsPlainToStdout») ловятся только в рантайме.
 *
 * Решение — в 3axisOpsctl-solution.ts: три независимые иерархии + композиция.
 */
