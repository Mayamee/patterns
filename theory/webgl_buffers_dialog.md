# WebGL Буферы и Атрибуты — Подробный разбор диалога

> А если я хочу несколько буферов использовать одновременно для отрисовки, получается только один буфер могу?

## Ответ и разбор

### 1. Сколько буферов можно создать?

- Можно создать **сколько угодно** буферов (`gl.createBuffer()`).
- Ограничение только памятью GPU.

### 2. Сколько буферов можно привязать одновременно?

- Для каждой категории binding point (например, `ARRAY_BUFFER`, `ELEMENT_ARRAY_BUFFER`) может быть активен только **один буфер за раз**.
- Но категорий несколько:
  - `ARRAY_BUFFER` — данные вершин,
  - `ELEMENT_ARRAY_BUFFER` — индексы,
  - `UNIFORM_BUFFER` (в WebGL2),
  - и др.

### 3. Несколько массивов атрибутов

Можно:

- Создать несколько буферов (`positionBuffer`, `colorBuffer`, `normalBuffer`).
- Привязать их поочерёдно и вызвать `vertexAttribPointer` для разных атрибутов.
  В момент вызова `vertexAttribPointer` WebGL «запоминает», какой буфер был активен.

Пример:

```js
// Позиции
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

// Цвета
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aColor);
```

Теперь `a_Position` читает данные из `positionBuffer`, а `a_Color` — из `colorBuffer`.

### 4. Почему это важно?

Если бы реально можно было использовать только один буфер, то:

- нельзя было бы хранить позиции и цвета раздельно,
- нельзя было бы делать interleaved варианты,
- нельзя было бы реализовать сложные меши.

---

> Ну то есть я могу буферы отдельно наполнять, но наполнять их нужно только через специальную привязочную точку, потом когда я вызову drawArrays, то шейдер сможет взять данные в любом случае даже если буфер конкретный уже не активен?

## Ответ и разбор

### 1. Заполнение буфера

Буфер можно наполнить только через `bindBuffer(target, buffer)`.
После этого `bufferData` или `bufferSubData` кладут данные в память GPU именно этого буфера.

### 2. Привязка к атрибуту

Когда вызывается:

```js
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
```

WebGL запоминает:

- какой буфер был активен в `ARRAY_BUFFER`,
- как читать данные (stride, offset).

### 3. Что делает drawArrays?

При `gl.drawArrays`:

- WebGL **не смотрит на текущий `ARRAY_BUFFER`**,
- GPU идёт по всем включённым атрибутам и берёт данные из того буфера, с которым они связаны.

### 4. Вывод

- Буфер можно отвязать (`gl.bindBuffer(gl.ARRAY_BUFFER, null)`) и связь всё равно останется.
- Шейдер берёт данные не из «активного» буфера, а из того, что был привязан во время `vertexAttribPointer`.
- Чтобы сменить источник, нужно снова `bindBuffer` + `vertexAttribPointer`.

---

## Вопрос Дмитрия

> Ну то есть если я в шейдер захочу передать 2 буфера, получается я их заранее свяжу с атрибутами и наполню данными, потом когда буду вызывать drawArrays шейдер сможет все данные взять не важно какой буфер активный сейчас?

## Ответ и разбор

Да, это так.

Пример (позиции + цвета):

```js
// Позиции
gl.bindBuffer(gl.ARRAY_BUFFER, positionBuffer);
gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
gl.vertexAttribPointer(aPosition, 3, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aPosition);

// Цвета
gl.bindBuffer(gl.ARRAY_BUFFER, colorBuffer);
gl.bufferData(gl.ARRAY_BUFFER, colors, gl.STATIC_DRAW);
gl.vertexAttribPointer(aColor, 4, gl.FLOAT, false, 0, 0);
gl.enableVertexAttribArray(aColor);

// Рисуем
gl.drawArrays(gl.TRIANGLES, 0, vertexCount);
```

- `a_Position` будет читать из `positionBuffer`,
- `a_Color` будет читать из `colorBuffer`,
- текущая привязка `ARRAY_BUFFER` не имеет значения при вызове `drawArrays`.

---

## Итоговое понимание

- Буферы создаются и наполняются через привязки.
- `vertexAttribPointer` связывает **атрибут ↔ буфер** навсегда (до переопределения).
- Во время отрисовки данные читаются именно из этих связей, а не из «текущего bind-а».
- Это позволяет работать с несколькими буферами параллельно.
