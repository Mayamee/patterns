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

// ═══════════════════════════════════════════════════════════════════════════
// КОМБИНАТОРНЫЙ ВЗРЫВ
//
// 3 напитка × 4 канала = 12 классов уже сейчас.
// Новый напиток (латте) → ещё 4 класса.
// Новый канал («в приложение») → ещё 3 класса.
// Рецепт капучино скопирован в каждый *Капучино* — меняешь молоко один раз?
// Нет: правишь во всех четырёх классах канала.
// ═══════════════════════════════════════════════════════════════════════════

abstract class Order {
  abstract readonly label: string;
  /** приготовить напиток */
  abstract brew(): string;
  /** отдать клиенту */
  abstract handOff(drink: string): void;

  fulfill(): void {
    const drink = this.brew();
    this.handOff(drink);
    console.log(`[ok] ${this.label}`);
  }
}

// --- капучино × каждый канал -------------------------------------------------

class CappuccinoAtCounter extends Order {
  readonly label = "капучино → стойка";

  brew(): string {
    // ПРОБЛЕМА: рецепт капучино живёт здесь…
    return "эспрессо + молоко + пенка";
  }

  handOff(drink: string): void {
    // …а логика «отдать у стойки» — тоже здесь. Две оси в одном классе.
    console.log(`отдать у стойки: ${drink}`);
  }
}

class CappuccinoToTable extends Order {
  readonly label = "капучино → зал";

  brew(): string {
    // ПРОБЛЕМА: тот же рецепт скопирован. Изменили пенку — ищи все копии.
    return "эспрессо + молоко + пенка";
  }

  handOff(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class CappuccinoPickup extends Order {
  readonly label = "капучино → самовывоз";

  brew(): string {
    return "эспрессо + молоко + пенка"; // снова копия
  }

  handOff(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class CappuccinoDelivery extends Order {
  readonly label = "капучино → курьер";

  brew(): string {
    return "эспрессо + молоко + пенка"; // и ещё раз
  }

  handOff(drink: string): void {
    console.log(`передать курьеру: ${drink}`);
  }
}

// --- раф × каждый канал ------------------------------------------------------

class RafAtCounter extends Order {
  readonly label = "раф → стойка";

  brew(): string {
    return "эспрессо + сливки + ваниль";
  }

  handOff(drink: string): void {
    // ПРОБЛЕМА: handOff у стойки уже был в CappuccinoAtCounter.
    console.log(`отдать у стойки: ${drink}`);
  }
}

class RafToTable extends Order {
  readonly label = "раф → зал";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // копия рецепта рафа
  }

  handOff(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class RafPickup extends Order {
  readonly label = "раф → самовывоз";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // снова
  }

  handOff(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class RafDelivery extends Order {
  readonly label = "раф → курьер";

  brew(): string {
    return "эспрессо + сливки + ваниль"; // и ещё раз
  }

  handOff(drink: string): void {
    // ПРОБЛЕМА: логика курьера уже была в CappuccinoDelivery.
    // Новый напиток = снова писать handOff для курьера.
    console.log(`передать курьеру: ${drink}`);
  }
}

// --- эспрессо × каждый канал -------------------------------------------------

class EspressoAtCounter extends Order {
  readonly label = "эспрессо → стойка";

  brew(): string {
    return "эспрессо";
  }

  handOff(drink: string): void {
    console.log(`отдать у стойки: ${drink}`);
  }
}

class EspressoToTable extends Order {
  readonly label = "эспрессо → зал";

  brew(): string {
    return "эспрессо"; // копия
  }

  handOff(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class EspressoPickup extends Order {
  readonly label = "эспрессо → самовывоз";

  brew(): string {
    return "эспрессо"; // снова
  }

  handOff(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class EspressoDelivery extends Order {
  readonly label = "эспрессо → курьер";

  brew(): string {
    return "эспрессо"; // и ещё раз
  }

  handOff(drink: string): void {
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

type Drink = "espresso" | "cappuccino" | "raf";
type Channel = "counter" | "table" | "pickup" | "delivery";

class GodOrderDesk {
  fulfill(drink: Drink, channel: Channel): void {
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
        console.log(`пакет на полку: ${cup}`);
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
