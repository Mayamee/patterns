/**
 * РЕШЕНИЕ: та же кофейня через паттерн Bridge
 *
 * Две оси больше не перемножаются:
 *   Abstraction  = DrinkOrder  (+ Эспрессо / Капучино / Раф)
 *   Implementation = Handoff   (+ стойка / зал / самовывоз / курьер)
 *
 * Связь — композиция: заказ ДЕРЖИТ способ выдачи.
 * Новый напиток → +1 класс DrinkOrder. Новый канал → +1 класс Handoff.
 * Любая пара собирается на кассе, без «КапучиноСамовывоз».
 *
 * Бытовая картинка к opsctl-solution.ts: бариста ≠ курьер.
 */

// ═══════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION — «как / куда отдаём»
// Растёт отдельно: приложение, постамат, робот-разносчик…
// ═══════════════════════════════════════════════════════════════════════════

interface Handoff {
  readonly label: string;
  give(drink: string): void;
}

class CounterHandoff implements Handoff {
  readonly label = "стойка";

  give(drink: string): void {
    console.log(`отдать у стойки: ${drink}`);
  }
}

class TableHandoff implements Handoff {
  readonly label = "зал";

  give(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class PickupHandoff implements Handoff {
  readonly label = "самовывоз";

  give(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class CourierHandoff implements Handoff {
  readonly label = "курьер";

  give(drink: string): void {
    // РЕШЕНИЕ: логика курьера живёт ОДИН раз — не в каждом *Delivery-классе напитка.
    console.log(`передать курьеру: ${drink}`);
  }
}

// ═══════════════════════════════════════════════════════════════════════════
// ABSTRACTION — «что готовим»
// Растёт отдельно: латте, матча, сезонное меню…
// Про выдачу знает только интерфейс Handoff — не конкретный канал.
// ═══════════════════════════════════════════════════════════════════════════

abstract class DrinkOrder {
  // МОСТ: абстракция держит реализацию
  constructor(protected handoff: Handoff) {}

  abstract brew(): string;

  fulfill(): void {
    const drink = this.brew();
    this.handoff.give(drink); // делегируем выдачу — не ветвимся по каналам
    console.log(`[ok] ${drink} → ${this.handoff.label}`);
  }
}

class EspressoOrder extends DrinkOrder {
  brew(): string {
    return "эспрессо";
  }
}

class CappuccinoOrder extends DrinkOrder {
  brew(): string {
    // РЕШЕНИЕ: рецепт в одном месте. Пенка меняется здесь — все каналы получают обновление.
    return "эспрессо + молоко + пенка";
  }
}

class RafOrder extends DrinkOrder {
  brew(): string {
    return "эспрессо + сливки + ваниль";
  }
}

// ─── касса: собираем любую пару ──────────────────────────────────────────────

type DrinkKind = "espresso" | "cappuccino" | "raf";
type ChannelKind = "counter" | "table" | "pickup" | "delivery";

function makeHandoff(channel: ChannelKind): Handoff {
  switch (channel) {
    case "counter":
      return new CounterHandoff();
    case "table":
      return new TableHandoff();
    case "pickup":
      return new PickupHandoff();
    case "delivery":
      return new CourierHandoff();
  }
}

function makeOrder(drink: DrinkKind, handoff: Handoff): DrinkOrder {
  switch (drink) {
    case "espresso":
      return new EspressoOrder(handoff);
    case "cappuccino":
      return new CappuccinoOrder(handoff);
    case "raf":
      return new RafOrder(handoff);
  }
}

function demo(): void {
  // Было: искать CappuccinoToTable / RafDelivery в матрице классов.
  // Стало: склеить две оси на кассе — 3 + 4 класса вместо 12.
  makeOrder("cappuccino", makeHandoff("table")).fulfill();
  makeOrder("raf", makeHandoff("delivery")).fulfill();
  makeOrder("espresso", makeHandoff("pickup")).fulfill();

  // Новый канал «приложение» = один класс Handoff.
  // Новый напиток «латте» = один класс DrinkOrder.
  // Матрицу классов трогать не нужно.
}

demo();
