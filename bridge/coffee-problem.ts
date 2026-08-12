/**
 * ПРОБЛЕМА: кофейня без паттерна Bridge
 *
 * Две независимые оси (из README):
 *   1) что готовим  — эспрессо / капучино / раф
 *   2) как отдаём   — у стойки / в зал / самовывоз / курьер
 *
 * Ниже — классическая ошибка: склеить обе оси в одну иерархию.
 * Получается матрица классов «напиток × канал», а не две отдельные
 * ответственности (рецепт и выдача).
 *
 * Читать как бытовую аналогию к opsctl-problem.ts.
 */

// ─── Общие типы ──────────────────────────────────────────────────────────────

type DrinkKind = "espresso" | "cappuccino" | "raf";
type ChannelKind = "counter" | "table" | "pickup" | "delivery";

// ═══════════════════════════════════════════════════════════════════════════
// КОМБИНАТОРНЫЙ ВЗРЫВ
//
// 3 напитка × 4 канала = 12 классов уже сейчас.
// Новый напиток (латте) → ещё 4 класса.
// Новый канал («в приложение») → ещё 3 класса.
// Рецепт капучино скопирован в каждый *Капучино* — меняешь молоко один раз?
// Нет: правишь во всех четырёх классах канала.
// ═══════════════════════════════════════════════════════════════════════════

abstract class DrinkOrder {
  abstract readonly label: string;
  /** приготовить напиток */
  abstract brew(): string;
  /** отдать клиенту */
  abstract give(drink: string): void;

  fulfill(): void {
    const drink = this.brew();
    this.give(drink);
    console.log(`[ok] ${this.label}`);
  }
}

// --- капучино × каждый канал -------------------------------------------------

class CappuccinoAtCounter extends DrinkOrder {
  readonly label = "капучино → стойка";

  brew(): string {
    // ПРОБЛЕМА: рецепт капучино живёт здесь…
    return "эспрессо + молоко + пенка";
  }

  give(drink: string): void {
    // …а логика «отдать у стойки» — тоже здесь. Две оси в одном классе.
    console.log(`отдать у стойки: ${drink}`);
  }
}

class CappuccinoToTable extends DrinkOrder {
  readonly label = "капучино → зал";

  brew(): string {
    // ПРОБЛЕМА: тот же рецепт скопирован. Изменили пенку — ищи все копии.
    return "эспрессо + молоко + пенка";
  }

  give(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class CappuccinoPickup extends DrinkOrder {
  readonly label = "капучино → самовывоз";

  brew(): string {
    return "эспрессо + молоко + пенка"; // снова копия
  }

  give(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class CappuccinoDelivery extends DrinkOrder {
  readonly label = "капучино → курьер";

  brew(): string {
    return "эспрессо + молоко + пенка"; // и ещё раз
  }

  give(drink: string): void {
    console.log(`передать курьеру: ${drink}`);
  }
}

// --- раф × каждый канал ------------------------------------------------------

class RafAtCounter extends DrinkOrder {
  readonly label = "раф → стойка";

  brew(): string {
    return "эспрессо + сливки + ваниль";
  }

  give(drink: string): void {
    // ПРОБЛЕМА: give у стойки уже был в CappuccinoAtCounter.
    console.log(`отдать у стойки: ${drink}`);
  }
}

class RafToTable extends DrinkOrder {
  readonly label = "раф → зал";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // копия рецепта рафа
  }

  give(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class RafPickup extends DrinkOrder {
  readonly label = "раф → самовывоз";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // снова
  }

  give(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class RafDelivery extends DrinkOrder {
  readonly label = "раф → курьер";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // и ещё раз
  }

  give(drink: string): void {
    // ПРОБЛЕМА: логика курьера уже была в CappuccinoDelivery.
    // Новый напиток = снова писать give для курьера.
    console.log(`передать курьеру: ${drink}`);
  }
}

// --- эспрессо × каждый канал -------------------------------------------------

class EspressoAtCounter extends DrinkOrder {
  readonly label = "эспрессо → стойка";

  brew(): string {
    return "эспрессо";
  }

  give(drink: string): void {
    console.log(`отдать у стойки: ${drink}`);
  }
}

class EspressoToTable extends DrinkOrder {
  readonly label = "эспрессо → зал";

  brew(): string {
    return "эспрессо"; // копия
  }

  give(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class EspressoPickup extends DrinkOrder {
  readonly label = "эспрессо → самовывоз";

  brew(): string {
    return "эспрессо"; // снова
  }

  give(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class EspressoDelivery extends DrinkOrder {
  readonly label = "эспрессо → курьер";

  brew(): string {
    return "эспрессо"; // и ещё раз
  }

  give(drink: string): void {
    console.log(`передать курьеру: ${drink}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// АЛЬТЕРНАТИВНЫЙ ТУПИК: один класс + вложенные if
//
// Классов мало, но обе оси свалены в ветвления.
// Добавили канал «приложение» — правим switch по каналу.
// Добавили латте — правим switch по напитку.
// Легко забыть комбинацию (латте + курьер) и получить дыру в рантайме.
// ═══════════════════════════════════════════════════════════════════════════

class GodOrderDesk {
  fulfill(drink: DrinkKind, channel: ChannelKind): void {
    let cup: string;

    // ось A
    switch (drink) {
      case "espresso":
        cup = "эспрессо";
        break;
      case "cappuccino":
        cup = "эспрессо + молоко + пенка";
        break;
      case "raf":
        cup = "эспрессо + сливки + ваниль";
        break;
    }

    // ось B — рядом, в том же методе
    switch (channel) {
      case "counter":
        console.log(`отдать у стойки: ${cup}`);
        break;
      case "table":
        console.log(`отнести в зал: ${cup}`);
        break;
      case "pickup":
        console.log(`пакет на полку самовывоза: ${cup}`);
        break;
      case "delivery":
        console.log(`передать курьеру: ${cup}`);
        break;
    }

    // ПРОБЛЕМА: обе оси в одном месте. Рост = правка этого же метода снова и снова.
  }
}

// ─── клиент видит боль ───────────────────────────────────────────────────────

function demo(): void {
  // Хочешь «капучино в зал» — ищешь именно CappuccinoToTable,
  // а не собираешь «капучино» + «зал» из двух независимых кусков.
  // Все 12 комбинаций — отдельные классы:
  new EspressoAtCounter().fulfill();
  new EspressoToTable().fulfill();
  new EspressoPickup().fulfill();
  new EspressoDelivery().fulfill();
  new CappuccinoAtCounter().fulfill();
  new CappuccinoToTable().fulfill();
  new CappuccinoPickup().fulfill();
  new CappuccinoDelivery().fulfill();
  new RafAtCounter().fulfill();
  new RafToTable().fulfill();
  new RafPickup().fulfill();
  new RafDelivery().fulfill();

  new GodOrderDesk().fulfill("espresso", "pickup");
}

demo();
