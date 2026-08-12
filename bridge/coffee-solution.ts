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

// ─── Общие типы ──────────────────────────────────────────────────────────────

type DrinkKind = "espresso" | "cappuccino" | "raf";
type ChannelKind = "counter" | "table" | "pickup" | "delivery";

// ═══════════════════════════════════════════════════════════════════════════
// IMPLEMENTATION — «как / куда отдаём»
// Растёт отдельно: приложение, постамат, робот-разносчик…
// ═══════════════════════════════════════════════════════════════════════════

interface Handoff {
  readonly kind: ChannelKind;
  give(drink: string): void;
}

class CounterHandoff implements Handoff {
  readonly kind = "counter" as const;

  give(drink: string): void {
    console.log(`отдать у стойки: ${drink}`);
  }
}

class TableHandoff implements Handoff {
  readonly kind = "table" as const;

  give(drink: string): void {
    console.log(`отнести в зал: ${drink}`);
  }
}

class PickupHandoff implements Handoff {
  readonly kind = "pickup" as const;

  give(drink: string): void {
    console.log(`пакет на полку самовывоза: ${drink}`);
  }
}

class DeliveryHandoff implements Handoff {
  readonly kind = "delivery" as const;

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
    console.log(`[ok] ${drink} → ${this.handoff.kind}`);
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

function createHandoff(kind: ChannelKind): Handoff {
  switch (kind) {
    case "counter":
      return new CounterHandoff();
    case "table":
      return new TableHandoff();
    case "pickup":
      return new PickupHandoff();
    case "delivery":
      return new DeliveryHandoff();
  }
}

function createOrder(kind: DrinkKind, handoff: Handoff): DrinkOrder {
  switch (kind) {
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
  createOrder("cappuccino", createHandoff("table")).fulfill();
  createOrder("raf", createHandoff("delivery")).fulfill();
  createOrder("espresso", createHandoff("pickup")).fulfill();

  // Новый канал «приложение» = один класс Handoff.
  // Новый напиток «латте» = один класс DrinkOrder.
  // Матрицу классов трогать не нужно.
}

demo();
