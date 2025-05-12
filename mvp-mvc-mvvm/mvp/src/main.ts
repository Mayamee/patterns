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

  public addTodo(title: string) {
    this.todos.push({
      id: Date.now(),
      title,
      isCompleted: false,
    });
  }

  public removeTodo(id: number) {
    this.todos = this.todos.filter((todo) => todo.id !== id);
  }

  public toggleTodo(id: number) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );
  }

  public getTodos() {
    return this.todos;
  }

  public clearTodos() {
    this.todos = [];
  }
}

class Presenter {
  private eventEmitter: EventEmitter<() => void>;

  private config: { limit: number };

  constructor(
    private readonly model: Model,
    eventEmitterFactory: EventEmitterFactory,
    config: { limit: number }
  ) {
    this.eventEmitter = eventEmitterFactory();
    this.config = config;
  }

  public get isLimitReached() {
    return this.model.getTodos().length >= this.config.limit;
  }

  public on(event: string, callback: () => void) {
    this.eventEmitter.on(event, callback);
  }

  private emit(event: string) {
    this.eventEmitter.emit(event);
  }

  public off(event: string, callback: () => void) {
    this.eventEmitter.off(event, callback);
  }

  public addTodo(title: string) {
    this.model.addTodo(title);
    this.emit("render");
  }

  public removeTodo(id: number) {
    this.model.removeTodo(id);
    this.emit("render");
  }

  public toggleTodo(id: number) {
    this.model.toggleTodo(id);
    this.emit("render");
  }

  public getTodos() {
    return this.model.getTodos();
  }

  public getConfig() {
    return this.config;
  }
}

class StatisticView {
  private wrapper: Element;

  constructor(private readonly presenter: Presenter) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    this.presenter.on("render", this.render.bind(this));
  }

  private render() {
    this.wrapper.innerHTML = "";

    const incompleteTodosText = document.createElement("div");
    incompleteTodosText.innerText = `Incomplete todos (${
      this.presenter.getTodos().filter((todo) => !todo.isCompleted).length
    })`;
    this.wrapper.appendChild(incompleteTodosText);

    const completedTodosText = document.createElement("div");
    completedTodosText.innerText = `Completed todos (${
      this.presenter.getTodos().filter((todo) => todo.isCompleted).length
    })`;
    this.wrapper.appendChild(completedTodosText);

    const totalTodosText = document.createElement("div");
    totalTodosText.innerText = `Total todos (${
      this.presenter.getTodos().length
    })`;
    this.wrapper.appendChild(totalTodosText);

    const todoLimit = document.createElement("div");
    todoLimit.innerText = `Todo limit (${this.presenter.getConfig().limit})`;
    this.wrapper.appendChild(todoLimit);
  }
}

class AddTodoView {
  private wrapper: Element;

  constructor(private readonly presenter: Presenter) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    this.presenter.on("render", this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    const input = document.createElement("input");
    input.type = "text";
    const button = document.createElement("button");
    button.type = "button";

    button.disabled = this.presenter.isLimitReached;

    button.addEventListener("click", () => {
      this.presenter.addTodo(input.value.trim());
      input.value = "";
    });

    button.innerText = `Add todo (${presenter.getTodos().length})`;
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

  constructor(private readonly presenter: Presenter) {
    const appContainer = document.querySelector("#app")!;
    const todoContainer = document.createElement("ul");

    appContainer.appendChild(todoContainer);

    this.todoContainer = todoContainer;
    this.presenter.on("render", this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    this.presenter.getTodos().forEach((todo) => {
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
      this.presenter.toggleTodo(todo.id);
    });

    button.addEventListener("click", () => {
      this.presenter.removeTodo(todo.id);
    });

    return li;
  }
}

//=== Init ===//
const presenter = new Presenter(new Model(), eventEmitterFactory, {
  limit: 5,
});
new TodoView(presenter);
new AddTodoView(presenter);
new StatisticView(presenter);
//=== Init ===//
