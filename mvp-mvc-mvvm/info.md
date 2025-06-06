### MVC

Зачем:
MVC нужен чтобы создавать независимые части приложения (писать независимые блоки кода, которые можно как угодно менять и улучшать, не затрагивая другие части приложения) для упрощения тестирования поддержки и разработки. Т.е для разделения ответственности.

Термины:

`Клиент` - это внешняя программная система, которая взаимодействует с приложением через View и Controller.

MVC - шаблон проектирования, который позволяет разделить приложение на три основных компонента:

`Model(M)` - Отвечает за выполнение бизнес логики и управлением данными внутри приложения.

`View(V)` - Клиентский интерфейс взаимодействия с приложением. Клиент может взаимодействовать с приложением через View, которая в свою очередь **может** взаимодействовать с Model напрямую или через Controller.

`Controller(C)` - отвечает за обработку запросов от View и клиентов и их взаимодействие с Model.

### 📘 MVC (Model-View-Controller) — Разбор и Практика

#### 🧩 1. Что такое MVC и какие задачи он помогает решать

**Model-View-Controller (MVC)** — это архитектурный шаблон, разделяющий приложение на три компонента, чтобы упростить поддержку, масштабирование и тестирование кода.

##### ✅ Улучшения при использовании MVC:

- **Разделение ответственности** между бизнес-логикой, отображением и обработкой ввода.
- **Повышение читаемости** и **понимания структуры** приложения.
- **Упрощённое тестирование** каждого компонента отдельно.
- **Гибкость интерфейса**: можно менять View без изменения логики приложения.

#### 🧱 2. Основные компоненты и зона ответственности

| Компонент      | Ответственность                                                                  |
| -------------- | -------------------------------------------------------------------------------- |
| **Model**      | Хранит состояние приложения и бизнес-логику. Отвечает за данные.                 |
| **View**       | Отображает данные пользователю. Слушает Model и обновляется при изменениях.      |
| **Controller** | Обрабатывает пользовательский ввод, управляет потоком данных между View и Model. |

##### 🎯 Ключевые роли:

- **Model** — источник истины.
- **View** — пассивный слушатель (если подписан на Model напрямую).
- **Controller** — координатор и посредник между View и Model.

#### 💡 3. Польза MVC

- **Легко масштабировать**: каждый компонент изолирован, можно развивать независимо.
- **Тестируемость**: легко писать юнит-тесты для модели и контроллера.
- **Гибкость UI**: можно подключить несколько разных View к одной Model.
- **Переиспользуемость**: Views можно делать переиспользуемыми и даже platform-agnostic.

#### ⚠️ 4. Вред и избыточность

MVC **может быть избыточным**, если:

- Приложение **очень маленькое** (например, форма с одной кнопкой).
- **Нет сложной логики или состояния**, которое нужно хранить и отслеживать.
- **Controller становится слишком толстым** (God Object) — из-за неправильного разделения.

Также, если View напрямую подписывается на Model:

- Повышается **связность (coupling)**.
- Становится **труднее** переиспользовать и мокать Model при тестировании View.

#### 🔁 5. Ключевое отличие от MVP

| Характеристика         | MVC                                              | MVP                                                        |
| ---------------------- | ------------------------------------------------ | ---------------------------------------------------------- |
| View знает о Model     | Да (подписывается напрямую на изменения)         | Нет (всё общение идёт через Presenter)                     |
| Controller / Presenter | Controller — посредник, но View ↔ Model напрямую | Presenter — полный посредник, View ничего не знает о Model |
| Тестируемость View     | Труднее: нужно мокать Model                      | Проще: достаточно замокать Presenter                       |
| Coupling               | Выше между View и Model                          | Ниже, связи направлены через Presenter                     |

Note: Services на бекеде это часть модели, они являются фасадом, с которым работает Controller.

### MVP (Model–View–Presenter)

#### 🧩 Основные термины

##### 1. Model (Модель)

- Хранит и управляет данными.
- Реализует бизнес-логику (например, добавление задач).
- Не зависит от View или Presenter.
- Может включать кеш, undo/redo, хранение в LocalStorage и пр.

##### 2. View (Представление)

- Отвечает только за отображение.
- Реагирует на действия пользователя (ввод, клик).
- Не содержит бизнес-логики.
- Подписывается на события от Presenter, не знает о модели.

##### 3. Presenter (Презентер)

- Посредник между View и Model.
- Получает команды от View, изменяет Model, затем инициирует обновление View.
- Может выполнять роли: медиатора, фасада, observer'а, контроллера.
- Может использовать иерархию презентеров в сложных приложениях.

---

#### ✅ Польза MVP

##### 1. Четкое разделение ответственности (SRP)

- Компоненты легко понимать, поддерживать и переиспользовать.

##### 2. Повышенная тестируемость

- Presenter и Model можно легко покрыть unit-тестами.
- UI можно мокать или не трогать вовсе при тестировании логики.

##### 3. Масштабируемость

- Возможность внедрять новые фичи без переписывания существующих.
- Presenter можно делить, объединять, выносить в отдельные слои.

##### 4. Ослабление связности (Low Coupling)

- View не знает о других View.
- Связь между View и Model полностью абстрагирована через Presenter.

#### ⚠️ Когда MVP может быть вреден

##### 1. Избыточен для простых UI

- Маленькое приложение, простая форма — нет смысла городить MVP.

##### 2. Усложнение архитектуры

- Увеличивается количество сущностей и слоев.
- Требует дисциплины в коде и хорошего понимания архитектурных принципов.

##### 3. Риск создать "бог-объект"

- Если Presenter перегружен логикой, он может стать трудно управляемым. Но его можно декомпозировать.

#### 🍽️ Аналогия паттерна MVP — Ресторан

##### Компоненты:

###### 👨‍🍳 Model (Повар)

- Знает рецепты и готовит еду.
- Не взаимодействует напрямую с клиентами.
- Отвечает за бизнес-логику и данные.

###### 🧑‍🏫 Presenter (Официант)

- Принимает заказ от клиента.
- Передаёт его на кухню (в Model).
- Возвращает результат клиенту.
- Знает, как обрабатывать заказы и управлять потоком данных, но сам не готовит.

###### 🪑 View (Клиент)

- Видит меню, делает выбор, ест еду.
- Не знает, как работает кухня или кто повар.
- Взаимодействует только с официантом (Presenter).

---

##### Сравнение с паттерном MVP:

| Ресторанная роль | MVP Компонент | Описание                                  |
| ---------------- | ------------- | ----------------------------------------- |
| Клиент           | View          | Видит результат, инициирует действия      |
| Официант         | Presenter     | Посредник между View и Model              |
| Повар            | Model         | Обрабатывает бизнес-логику, хранит данные |

---

##### Почему аналогия работает:

- View (Клиент) не знает, как устроена Model (Кухня/Повар).
- Все взаимодействие идёт через Presenter (Официант).
- Это снижает связанность и повышает читаемость, поддержку и тестируемость системы.

### MVVM (Model–View–ViewModel)

#### 1. Термины MVVM

- **Model** — модель, отвечает за данные, бизнес-логику и работу с хранилищем (например, API, БД).
- **View** — представление, визуальный слой UI. Это то, что видит пользователь.
- **ViewModel** — посредник между моделью и представлением. Инкапсулирует состояние и поведение UI, предоставляет данные для View и обрабатывает пользовательские действия.

---

#### 2. Зоны ответственности

##### ✅ Model

- Содержит бизнес-логику.
- Отвечает за работу с источниками данных (API, БД, файловая система).
- Не знает о ViewModel или View.

##### ✅ View

- Отображает данные, приходящие из ViewModel.
- Отправляет пользовательские действия (например, клики) во ViewModel.
- Может быть декларативной (например, JSX, XML, HTML).

##### ✅ ViewModel

- Слушает модель и трансформирует данные для представления.
- Хранит состояние UI (например, какие кнопки активны, что отображается).
- Реагирует на действия пользователя, вызывая методы модели.
- Может использовать observable/реактивные свойства (например, MobX, Knockout, RxJS).

---

#### 3. Плюсы и минусы MVVM

##### ➕ Плюсы:

- **Двусторонний биндинг** позволяет автоматически синхронизировать состояние между View и ViewModel.
- **Высокая тестируемость**: ViewModel можно тестировать независимо от View.
- **Меньшая связность** между слоями: View не зависит от модели напрямую.
- **Удобно в декларативных UI-фреймворках** (React, Vue, Angular, SwiftUI).

##### ➖ Минусы:

- **Сложность дебага при обилии биндингов**: особенно в случае "магии" автосинхронизации.
- **Переусложнение** для простых UI или небольших приложений.
- **Реактивность требует дисциплины**: неосторожное управление состоянием может привести к лишним перерендериваниям или багам.

---

#### 4. Роль биндингов и автообновление View

- Биндинг — это связь между данными и представлением.
- **Один-ко-многим** или **двусторонний биндинг** (two-way binding):
  - Пример: `input` связан с полем в ViewModel, изменение в любом месте обновит оба слоя.
- В MVVM **биндинг — центральный механизм**, который:
  - уменьшает необходимость в boilerplate-коде;
  - упрощает поддержку интерфейса;
  - обеспечивает **автоматическое обновление UI** при изменении данных;
  - может быть реализован вручную (через `observer`, `computed`) или средствами фреймворков.

---

#### 5. Отличия от MVC и MVP

| Особенность           | MVC                       | MVP                       | MVVM                                  |
| --------------------- | ------------------------- | ------------------------- | ------------------------------------- |
| Посредник             | Controller                | Presenter                 | ViewModel                             |
| View знает о...       | Controller, Model                | Presenter                 | ViewModel                             |
| Кто обновляет View    | Сам View или Controller   | Presenter вручную         | ViewModel автоматически через биндинг |
| Связь View ↔ Logic    | View ↔ Controller ↔ Model | View → Presenter ↔ Model  | View ←→ ViewModel ↔ Model             |
| Уровень автоматизации | Низкий                    | Средний (ручная передача) | Высокий (двусторонний биндинг)        |
| Тестируемость         | Средняя                   | Хорошая                   | Очень хорошая                         |
| Подходит для          | Web-контроллеров          | Desktop, Android          | Декларативных UI                      |
