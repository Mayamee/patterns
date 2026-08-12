/**
 * ПРОБЛЕМА: CLI-утилита opsctl без паттерна Bridge
 *
 * Сценарий: операционный CLI, который снимает диагностику с хоста и
 * доставляет её куда-то дальше. Две независимые оси изменений:
 *
 *   1) что снимаем  — логи / метрики / конфиги
 *   2) куда шлём   — файл / stdout / HTTP webhook / SSH
 *
 * Ниже показаны ДВА типичных тупика сразу:
 *   A) комбинаторный взрыв подклассов (произведение осей);
 *   B) «бог-диспетчер» с вложенными if по обеим осям.
 *
 * Добавить новый тип дампа или новый канал = трогать все комбинации.
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
// A) КОМБИНАТОРНЫЙ ВЗРЫВ НАСЛЕДОВАНИЯ
//
// Базовая идея «наследуем и уточняем» быстро превращается в матрицу классов:
//   3 дампа × 4 канала = 12 листовых классов.
// Добавили ContinuousProfilingDump — ещё +4 класса.
// Добавили S3Channel — ещё +3 (или +4) класса.
// ═══════════════════════════════════════════════════════════════════════════

abstract class DiagnosticExport {
  abstract readonly label: string;
  abstract collect(sinceMinutes: number): DiagnosticPayload;
  abstract send(payload: DiagnosticPayload, target: string): void;

  run(sinceMinutes: number, target: string): void {
    const payload = this.collect(sinceMinutes);
    this.send(payload, target);
    console.log(`[ok] ${this.label} → ${target}`);
  }
}

// --- ось «логи» × каждый канал ------------------------------------------------

class LogsToFileExport extends DiagnosticExport {
  readonly label = "logs→file";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  send(payload: DiagnosticPayload, target: string): void {
    // fs.writeFileSync(target, payload.body)
    console.log(`write file ${target}, bytes=${payload.body.length}`);
  }
}

class LogsToStdoutExport extends DiagnosticExport {
  readonly label = "logs→stdout";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  send(payload: DiagnosticPayload, _target: string): void {
    process.stdout.write(payload.body + "\n");
  }
}

class LogsToHttpExport extends DiagnosticExport {
  readonly label = "logs→http";

  collect(sinceMinutes: number): DiagnosticPayload {
    // Дублирование collect между LogsTo* — уже запах
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  send(payload: DiagnosticPayload, target: string): void {
    // fetch(target, { method: "POST", body: JSON.stringify(payload) })
    console.log(`POST ${target} kind=${payload.kind}`);
  }
}

class LogsToSshExport extends DiagnosticExport {
  readonly label = "logs→ssh";

  collect(sinceMinutes: number): DiagnosticPayload {
    return {
      kind: "logs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: `journalctl --since "${sinceMinutes} min ago"\n...`,
    };
  }

  send(payload: DiagnosticPayload, target: string): void {
    // ssh user@host "cat > /path" <<< payload
    console.log(`scp payload → ${target}`);
  }
}

// --- ось «метрики» × каждый канал --------------------------------------------

class MetricsToFileExport extends DiagnosticExport {
  readonly label = "metrics→file";

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

  send(payload: DiagnosticPayload, target: string): void {
    console.log(`write file ${target}, bytes=${payload.body.length}`);
  }
}

class MetricsToStdoutExport extends DiagnosticExport {
  readonly label = "metrics→stdout";

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

  send(payload: DiagnosticPayload, _target: string): void {
    process.stdout.write(payload.body + "\n");
  }
}

class MetricsToHttpExport extends DiagnosticExport {
  readonly label = "metrics→http";

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

  send(payload: DiagnosticPayload, target: string): void {
    console.log(`POST ${target} kind=${payload.kind}`);
  }
}

class MetricsToSshExport extends DiagnosticExport {
  readonly label = "metrics→ssh";

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

  send(payload: DiagnosticPayload, target: string): void {
    console.log(`scp payload → ${target}`);
  }
}

// --- ось «конфиги» × каждый канал --------------------------------------------
// (ещё 4 класса — для краткости оставлены заглушки-маркеры взрыва)

class ConfigsToFileExport extends DiagnosticExport {
  readonly label = "configs→file";
  collect(): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "nginx.conf + app.env redacted",
    };
  }
  send(payload: DiagnosticPayload, target: string): void {
    console.log(`write file ${target}, bytes=${payload.body.length}`);
  }
}

class ConfigsToStdoutExport extends DiagnosticExport {
  readonly label = "configs→stdout";
  collect(): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "nginx.conf + app.env redacted",
    };
  }
  send(payload: DiagnosticPayload, _target: string): void {
    process.stdout.write(payload.body + "\n");
  }
}

class ConfigsToHttpExport extends DiagnosticExport {
  readonly label = "configs→http";
  collect(): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "nginx.conf + app.env redacted",
    };
  }
  send(payload: DiagnosticPayload, target: string): void {
    console.log(`POST ${target} kind=${payload.kind}`);
  }
}

class ConfigsToSshExport extends DiagnosticExport {
  readonly label = "configs→ssh";
  collect(): DiagnosticPayload {
    return {
      kind: "configs",
      collectedAt: new Date().toISOString(),
      host: "api-1",
      body: "nginx.conf + app.env redacted",
    };
  }
  send(payload: DiagnosticPayload, target: string): void {
    console.log(`scp payload → ${target}`);
  }
}

/**
 * Фабрика по флагам CLI — сама по себе таблица 3×4.
 * Каждый новый DumpKind/ChannelKind = ещё одна ветка здесь И новый класс выше.
 */
function createExportByInheritance(flags: CliFlags): DiagnosticExport {
  const key = `${flags.dump}:${flags.channel}` as const;

  switch (key) {
    case "logs:file":
      return new LogsToFileExport();
    case "logs:stdout":
      return new LogsToStdoutExport();
    case "logs:http":
      return new LogsToHttpExport();
    case "logs:ssh":
      return new LogsToSshExport();
    case "metrics:file":
      return new MetricsToFileExport();
    case "metrics:stdout":
      return new MetricsToStdoutExport();
    case "metrics:http":
      return new MetricsToHttpExport();
    case "metrics:ssh":
      return new MetricsToSshExport();
    case "configs:file":
      return new ConfigsToFileExport();
    case "configs:stdout":
      return new ConfigsToStdoutExport();
    case "configs:http":
      return new ConfigsToHttpExport();
    case "configs:ssh":
      return new ConfigsToSshExport();
    default: {
      const _exhaustive: never = key;
      throw new Error(`unsupported combo: ${_exhaustive}`);
    }
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// B) АЛЬТЕРНАТИВНЫЙ ТУПИК: ОДИН КЛАСС + ВЛОЖЕННЫЕ IF
//
// Классов мало, но метод run() становится точкой, куда возвращаются все.
// Две оси ветвления живут в одном месте → цикломатическая сложность растёт
// как произведение, плюс невозможно тестировать канал отдельно от сбора.
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

    // --- ось 2: куда доставляем ---------------------------------------------
    // В реальности сюда же полезут формат, ретраи, auth, dry-run…
    if (flags.channel === "file") {
      console.log(`write file ${flags.target}, bytes=${payload.body.length}`);
    } else if (flags.channel === "stdout") {
      process.stdout.write(payload.body + "\n");
    } else if (flags.channel === "http") {
      if (payload.kind === "configs") {
        // «особый случай» — уже смешали оси внутри ветки канала
        console.log(`POST ${flags.target} (configs redacted envelope)`);
      } else {
        console.log(`POST ${flags.target} kind=${payload.kind}`);
      }
    } else if (flags.channel === "ssh") {
      console.log(`scp payload → ${flags.target}`);
    } else {
      const _exhaustive: never = flags.channel;
      throw new Error(`unknown channel: ${_exhaustive}`);
    }

    console.log(`[ok] ${flags.dump} via ${flags.channel}`);
  }
}

// ─── Точка входа (имитация argv) ─────────────────────────────────────────────

function parseArgs(argv: string[]): CliFlags {
  // opsctl dump --type metrics --channel http --target https://collector/ingest --since 15
  return {
    dump: (argv[0] as DumpKind) ?? "logs",
    channel: (argv[1] as ChannelKind) ?? "file",
    target: argv[2] ?? "./out.diag",
    sinceMinutes: Number(argv[3] ?? 15),
  };
}

function main(): void {
  const flags = parseArgs(["metrics", "http", "https://collector.internal/ingest", "15"]);

  // Вариант A: выбираем один из 12 классов
  const byInheritance = createExportByInheritance(flags);
  byInheritance.run(flags.sinceMinutes, flags.target);

  // Вариант B: один метод со всеми if
  new OpsctlGodCommand().run(flags);
}

main();

/**
 * Итог боли:
 * - collect() скопирован между LogsToFile/LogsToHttp/... (ось дампа размножена каналами);
 * - send() скопирован между *ToFile (ось канала размножена дампами);
 * - фабрика и god-команда знают обе оси сразу;
 * - стоимость фичи «новый канал» = O(число дампов), и наоборот.
 *
 * Решение — в opsctl-solution.ts: развести оси композицией (Bridge).
 */
