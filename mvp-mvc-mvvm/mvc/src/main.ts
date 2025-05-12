type Todo = {
  id: number;
  title: string;
  isCompleted: boolean;
};

class EventEmitter<TCallback extends (...args: any[]) => void> {
  private events: Record<string, Set<TCallback>> = {};

  public on(event: string, callback: TCallback) {
    if (!this.events[event]) {
      this.events[event] = new Set();
    }
    this.events[event].add(callback);
  }

  public emit(event: string, ...args: any[]) {
    if (!this.events[event]) {
      return;
    }
    this.events[event].forEach((callback) => {
      callback(...args);
    });
  }

  public off(event: string, callback: TCallback) {
    if (!this.events[event]) {
      return;
    }
    this.events[event].delete(callback);
  }
}
type EventEmitterFactory = <
  TCallback extends (...args: any[]) => void
>() => EventEmitter<TCallback>;

const eventEmitterFactory: EventEmitterFactory = () => new EventEmitter();

class Model {
  private todos: Todo[] = [];
  private eventEmitter: EventEmitter<() => void>;

  constructor(
    eventEmitterFactory: EventEmitterFactory,
    private readonly config: { limit: number }
  ) {
    this.eventEmitter = eventEmitterFactory();
  }

  public on(event: string, callback: () => void) {
    this.eventEmitter.on(event, callback);
  }

  public off(event: string, callback: () => void) {
    this.eventEmitter.off(event, callback);
  }

  public addTodo(title: string) {
    if (this.todos.length >= this.config.limit) {
      return false;
    }

    this.todos.push({
      id: Date.now(),
      title,
      isCompleted: false,
    });

    this.eventEmitter.emit("stateChanged");

    return true;
  }

  public removeTodo(id: number) {
    this.todos = this.todos.filter((todo) => todo.id !== id);

    this.eventEmitter.emit("stateChanged");
  }

  public toggleTodo(id: number) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );

    this.eventEmitter.emit("stateChanged");
  }

  public getTodos() {
    return this.todos;
  }

  public clearTodos() {
    this.todos = [];

    this.eventEmitter.emit("stateChanged");
  }

  public checkIsLimitReached() {
    return this.todos.length >= this.config.limit;
  }

  public getLimit() {
    return this.config.limit;
  }
}

class Controller {
  constructor(private readonly model: Model) {}

  public getTodos() {
    return this.model.getTodos();
  }

  public addTodo(title: string) {
    const result = this.model.addTodo(title);

    if (!result) {
      alert("Limit reached");
    }
  }

  public removeTodo(id: number) {
    this.model.removeTodo(id);
  }

  public toggleTodo(id: number) {
    this.model.toggleTodo(id);
  }

  public getLimit() {
    return this.model.getLimit();
  }

  public checkIsLimitReached() {
    return this.model.checkIsLimitReached();
  }
}

class StatisticView {
  private wrapper: Element;

  constructor(
    private readonly controller: Controller,
    private readonly model: Model
  ) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    this.model.on("stateChanged", this.render.bind(this));
  }

  private render() {
    this.wrapper.innerHTML = "";

    const incompleteTodosText = document.createElement("div");
    incompleteTodosText.innerText = `Incomplete todos (${
      this.controller.getTodos().filter((todo) => !todo.isCompleted).length
    })`;
    this.wrapper.appendChild(incompleteTodosText);

    const completedTodosText = document.createElement("div");
    completedTodosText.innerText = `Completed todos (${
      this.controller.getTodos().filter((todo) => todo.isCompleted).length
    })`;
    this.wrapper.appendChild(completedTodosText);

    const totalTodosText = document.createElement("div");
    totalTodosText.innerText = `Total todos (${
      this.controller.getTodos().length
    })`;
    this.wrapper.appendChild(totalTodosText);

    const todoLimit = document.createElement("div");
    todoLimit.innerText = `Todo limit (${this.controller.getLimit()})`;
    this.wrapper.appendChild(todoLimit);
  }
}

class AddTodoView {
  private wrapper: Element;

  constructor(
    private readonly controller: Controller,
    private readonly model: Model
  ) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    this.model.on("stateChanged", this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    const input = document.createElement("input");
    input.type = "text";
    const button = document.createElement("button");
    button.type = "button";

    button.disabled = this.controller.checkIsLimitReached();

    button.addEventListener("click", () => {
      this.controller.addTodo(input.value.trim());
      input.value = "";
    });

    button.innerText = `Add todo (${this.controller.getTodos().length})`;
    input.placeholder = "Add todo";

    this.wrapper.appendChild(input);
    this.wrapper.appendChild(button);
  }

  private clearContainer() {
    this.wrapper.innerHTML = "";
  }
}

class TodoView {
  private todoContainer: Element;

  constructor(
    private readonly controller: Controller,
    private readonly model: Model
  ) {
    const appContainer = document.querySelector("#app")!;
    const todoContainer = document.createElement("ul");
    this.todoContainer = todoContainer;
    this.render();

    appContainer.appendChild(todoContainer);

    this.model.on("stateChanged", this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    this.controller.getTodos().forEach((todo) => {
      const li = this.makeTodoElement(todo);
      this.todoContainer.appendChild(li);
    });
  }

  private clearContainer() {
    this.todoContainer.innerHTML = "";
  }

  private makeTodoElement(todo: Todo) {
    const li = document.createElement("li");

    li.innerHTML = `
      <input type="checkbox" ${todo.isCompleted ? "checked" : ""} />
      <span>${todo.title}</span>
      <button>x</button>
    `;

    const input = li.querySelector("input")!;
    const button = li.querySelector("button")!;

    input.addEventListener("change", () => {
      this.controller.toggleTodo(todo.id);
    });

    button.addEventListener("click", () => {
      this.controller.removeTodo(todo.id);
    });

    return li;
  }
}

//=== Init ===//
const model = new Model(eventEmitterFactory, { limit: 5 });
const controller = new Controller(model);
new TodoView(controller, model);
new AddTodoView(controller, model);
new StatisticView(controller, model);
//=== Init ===//

//=== REFS ===//
// https://habr.com/ru/articles/215605/
//=== REFS ===//

// Рассмотреть вариант с пагинацией