---
tags: [javascript, async, patterns, factory, frontend]
aliases: [Асинхронные паттерны, Замыкания и асинхронность]
---

# 🧰 Подходы к асинхронности в JavaScript

> Подборка из 5 архитектурных подходов к управлению асинхронными процессами, реализованных через функциональные замыкания, с аналогиями и примерами из реальной разработки.

---

## 🐎 Контроль гонки (Race Condition Controller)

**Суть:** только последний вызов имеет значение, все предыдущие игнорируются.

**Аналогия:** начала бежать лошадь, и когда на поле появляется новая, та, что уже бежит, дисквалифицируется. Она продолжит бежать, но не будет учитываться.

**Где применяется:** автокомплит, динамическая фильтрация, live search.

**Нюансы:** запрос будет выполняться в фоне, но не возымеет эффекта, что может сказаться на производительности.

```ts
function createRacingRequest() {
  let currentToken = 0;

  return async function (fn) {
    const token = ++currentToken;
    const result = await fn();
    return token === currentToken ? result : undefined;
  };
}

// Пример:
const raceRequest = createRacingRequest();
await raceRequest(() => fetchData());
```

---

## 🗃️ Контейнеры запросов (Query Containers / Кеш по параметрам)

**Суть:** создается контейнер (ключ) на основе параметров, в который складывается результат асинхронной операции.

**Аналогия:** лошади с разными номерами бегут в свои боксы. Победитель — каждая в своём классе. Если запустить несколько с одним и тем же номером — они могут начать конкурировать (состояние гонки).

**Где применяется:** кеширование списков, пагинация, реактивные фильтры.

**Нюансы:** каждый новый ключ инициирует новый запрос. Возможны гонки между одинаковыми запросами.

```ts
function createQueryCache() {
  const cache = new Map();

  return function (key, fn) {
    if (!cache.has(key)) {
      const promise = fn();
      cache.set(key, promise);
    }
    return cache.get(key);
  };
}

// Пример:
const getQuery = createQueryCache();
const data = await getQuery("user:1", () => fetchUser(1));
```

---

## 💣 AbortController — отменяемые запросы и подписка на событие

**Суть:** можно отменить любой асинхронный процесс и оповестить всех слушателей через `AbortSignal`.

**Аналогия:** лошадь с детонатором на спине. При запуске новой — старая взрывается. Новая деактивирует детонатор, только если добежала первой.

**Где применяется:** отмена при демонтировании компонента, отмена загрузки при переключении параметров.

**Нюансы:** в библиотеках типа axios нужно ловить специфичную ошибку `httpAbortedError`.

```ts
function withAbortable(fn) {
  return (signal, ...args) => {
    return new Promise((resolve, reject) => {
      if (signal.aborted) return reject(new Error("Aborted"));

      const onAbort = () => reject(new Error("Aborted"));
      signal.addEventListener("abort", onAbort);

      fn(...args)
        .then(resolve)
        .catch(reject)
        .finally(() => {
          signal.removeEventListener("abort", onAbort);
        });
    });
  };
}

// Пример:
const controller = new AbortController();
const fetchWithAbort = withAbortable(fetchData);
fetchWithAbort(controller.signal, ...args);
```

---

## 🔒 Механизм блокировки (Lock / Mutex)

**Суть:** если один запрос запущен — остальные ждут завершения или отбрасываются.

**Аналогия:** лошадь на треке одна, ворота закрыты. Остальные ждут или не выходят.

**Где применяется:** действия с debounce, запрет на повторную отправку формы.

**Нюансы:** при необходимости сброса блокировки вручную — нужно предусмотреть соответствующий интерфейс.

```ts
function createLockedRequest() {
  let locked = false;

  return async function (fn) {
    if (locked) return;
    locked = true;
    try {
      await fn();
    } finally {
      locked = false;
    }
  };
}

// Пример:
const lockedFetch = createLockedRequest();
await lockedFetch(() => fetchData());
```

---

## 🧵 Цепочка промисов (Promise Chain)

**Суть:** все асинхронные вызовы идут строго последовательно, даже если они вызваны параллельно.

**Аналогия:** лошади идут друг за другом. Следующая может стартовать только после завершения предыдущей.

**Где применяется:** мастера, шаги с гарантированной последовательностью, очередь на серверные вызовы.

```ts
function createPromiseChain() {
  let chain = Promise.resolve();

  return function (fn) {
    chain = chain.then(fn).catch(console.error);
    return chain;
  };
}

// Пример:
const enqueue = createPromiseChain();
enqueue(() => fetchStep1());
enqueue(() => fetchStep2());
```

---

## ✅ Сводная таблица

| Подход           | Фабрика функции         | Гарантии                                    | Где применим     | Аналогия                             |
| ---------------- | ----------------------- | ------------------------------------------- | ---------------- | ------------------------------------ |
| Race Condition   | `createRacingRequest()` | Учитывается только последний запрос         | UI/бизнес-логика | Новая лошадь дисквалифицирует старую |
| Query Containers | `createQueryCache()`    | Кеш по параметрам, переиспользование        | UI/бизнес-логика | Каждая лошадь в свой бокс            |
| Abort Controller | `withAbortable(fn)`     | Отмена через сигнал, уведомление слушателей | UI/бизнес-логика | Лошади с детонатором                 |
| Lock             | `createLockedRequest()` | Запрет повторных вызовов                    | UI/бизнес-логика | Ворота закрыты — ждём                |
| Promise Chain    | `createPromiseChain()`  | Строгая последовательность выполнения       | Бизнес-логика    | Одна за другой                       |
