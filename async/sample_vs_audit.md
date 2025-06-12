# `sample` и `audit` — операторы контроля частоты событий

Оба оператора используются для управления потоком событий, особенно в высокочастотных источниках данных (например, события мыши, нажатия клавиш, вебсокеты и т.п.). Ниже описано, как они работают, в чём различие и как их реализовать на чистом JavaScript.

---

## 🧪 `sample`

### Как работает

Оператор `sample` берет **последнее значение** из потока событий, но эмитит его **только тогда, когда срабатывает другой триггер** — например, таймер.

Иными словами:

> «Бери последнее значение из источника, но передавай его наружу только по расписанию».

### Какую пользу даёт, применимость

- Контроль частоты обновлений: например, подписка на позицию мыши, но обработка 1 раз в секунду.
- Подходит для UI-оптимизаций, когда важно не терять данные, но не перегружать обработчики.

### Пример реализации

```ts
function sample(source, trigger, callback) {
  let latestValue;
  let hasValue = false;

  const sourceUnsub = source((value) => {
    latestValue = value;
    hasValue = true;
  });

  const triggerUnsub = trigger(() => {
    if (hasValue) {
      callback(latestValue);
      hasValue = false;
    }
  });

  return () => {
    sourceUnsub();
    triggerUnsub();
  };
}

// --- Пример использования ---
function source(emitter) {
  const id = setInterval(() => emitter(Date.now()), 500); // каждые 500ms
  return () => clearInterval(id);
}

function trigger(emitter) {
  const id = setInterval(() => emitter(), 2000); // каждые 2s
  return () => clearInterval(id);
}

sample(source, trigger, (val) => {
  console.log("[sample]", val);
});
```

---

## 🎯 `audit`

### Как работает

Оператор `audit` пропускает первое значение и **запускает таймер**. Все следующие значения во время таймера игнорируются, но **последнее сохраняется**. Когда таймер завершится — передаётся последнее сохранённое значение.

Иными словами:

> «Обработай только **последнее значение** после паузы в N миллисекунд».

### Какую пользу даёт, применимость

- Уменьшение количества срабатываний при «шумных» потоках.
- Подходит для случаев, где важно не потерять последнее событие, но не обрабатывать всё подряд (например, прокрутка, resize, сложные вычисления при перемещении мыши и т.п.).
- В отличие от `throttle`, всегда берёт последнее значение (не первое).

### Пример реализации

```ts
function audit(source, durationFn, callback) {
  let lastValue;
  let isThrottling = false;

  const sourceUnsub = source((value) => {
    lastValue = value;

    if (!isThrottling) {
      isThrottling = true;

      const stop = durationFn(() => {
        callback(lastValue);
        isThrottling = false;
      });
    }
  });

  return () => {
    sourceUnsub();
  };
}

// --- Пример использования ---
function source(emitter) {
  const id = setInterval(() => emitter(Date.now()), 500); // события каждые 500ms
  return () => clearInterval(id);
}

function durationFn(done) {
  const id = setTimeout(done, 3000); // 3 секунды
  return () => clearTimeout(id);
}

audit(source, durationFn, (val) => {
  console.log("[audit]", val);
});
```

---

## 🆚 Сравнение `sample` и `audit`

| Оператор | Когда эмитит                                | Что передаёт                    | Типичный кейс                 |
| -------- | ------------------------------------------- | ------------------------------- | ----------------------------- |
| sample   | По внешнему триггеру (таймер, клик)         | Последнее значение из источника | Обновление UI 1 раз в секунду |
| audit    | По завершении паузы (таймера) после события | Последнее значение за паузу     | Редкое обновление при resize  |

---

## 🧩 Дополнительно

- Оба оператора отлично реализуются через RxJS (`sample`, `audit`).
- В MobX, React и других фреймворках можно добиться схожего поведения с `reaction`, `autorun`, `throttle`, `debounce`.
