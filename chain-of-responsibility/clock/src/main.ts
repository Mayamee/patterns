import { makeClockView } from "./ClockView";

export type Handler<TCtx> = (ctx: TCtx) => boolean;

export const makeChain = <TContext>(
  ...handlers: Handler<TContext>[]
): Handler<TContext> => {
  return (ctx) => {
    for (const handler of handlers) {
      if (handler(ctx)) {
        return true;
      }
    }
    return false;
  };
};

const ctx = { timestamp: Date.now() };

/**
 * ClockWatch генерирует событие каждую секунду
 * На основе этого события он генерирует контекст в который складывает текущее время в виде timestamp
 * Это событие передается в цепочку обработчиков
 * Список обработчиков:
 * Корректор таймзоны - корректирует время в зависимости от id таймзоны
 * Будильник - проверяет не пора ли сработать будильнику (работает только по часам)
 * Секундная стрелка - двигает секундную стрелку
 * Минутная стрелка - двигает минутную стрелку (вычисляет угол поворота)
 * Часовая стрелка - двигает часовую стрелку
 * Показатель текущего дня недели - показывает текущий день недели
 */

// Тупое решение в лоб без паттернов

const rootElement = document.getElementById("app");

if (!rootElement) {
  throw new Error("No root element");
}

const clockView = makeClockView(rootElement);
