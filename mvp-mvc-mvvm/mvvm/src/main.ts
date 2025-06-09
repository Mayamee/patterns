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

class ViewModel {
  private eventEmitter: EventEmitter<() => void>;

  constructor(
    eventEmitterFactory: EventEmitterFactory,
    private readonly model: Model
  ) {
    this.eventEmitter = eventEmitterFactory();
  }

  public get todosLimit() {
    return 10;
  }

  public get todos() {
    return this.model.getTodos();
  }

  public get completedTodos() {
    return this.model.getTodos().filter((todo) => todo.isCompleted);
  }

  public get incompleteTodos() {
    return this.model.getTodos().filter((todo) => !todo.isCompleted);
  }

  public get todosCount() {
    return {
      completed: this.completedTodos.length,
      incomplete: this.incompleteTodos.length,
      total: this.model.getTodos().length,
    };
  }

  public get isLimitReached() {
    return this.model.getTodos().length >= this.todosLimit;
  }

  public addTodo(title: string) {
    this.model.addTodo(title);
    this.onDataChanged();
  }

  public removeTodo(id: number) {
    this.model.removeTodo(id);
    this.onDataChanged();
  }

  public toggleTodo(id: number) {
    this.model.toggleTodo(id);
    this.onDataChanged();
  }

  public subscribeToDataChanged(callback: () => void) {
    this.eventEmitter.on("dataChanged", callback);
  }

  public onDataChanged() {
    this.eventEmitter.emit("dataChanged");
  }
}

class StatisticView {
  private wrapper: Element;

  constructor(private readonly viewModel: ViewModel) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    // Подписываемся на события ViewModel о изменении данных
    this.viewModel.subscribeToDataChanged(this.render.bind(this));
  }

  private render() {
    this.wrapper.innerHTML = "";

    const incompleteTodosText = document.createElement("div");
    incompleteTodosText.innerText = `Incomplete todos (${this.viewModel.todosCount.incomplete})`;
    this.wrapper.appendChild(incompleteTodosText);

    const completedTodosText = document.createElement("div");
    completedTodosText.innerText = `Completed todos (${this.viewModel.todosCount.completed})`;
    this.wrapper.appendChild(completedTodosText);

    const totalTodosText = document.createElement("div");
    totalTodosText.innerText = `Total todos (${this.viewModel.todosCount.total})`;
    this.wrapper.appendChild(totalTodosText);

    const todoLimit = document.createElement("div");
    todoLimit.innerText = `Todo limit (${this.viewModel.todosLimit})`;
    this.wrapper.appendChild(todoLimit);
  }
}

class AddTodoView {
  private wrapper: Element;

  constructor(private readonly viewModel: ViewModel) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    this.viewModel.subscribeToDataChanged(this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    const input = document.createElement("input");
    input.type = "text";
    const button = document.createElement("button");
    button.type = "button";

    button.disabled = this.viewModel.isLimitReached;

    button.addEventListener("click", () => {
      this.viewModel.addTodo(input.value.trim());
      input.value = "";
    });

    button.innerText = `Add todo (${this.viewModel.todosCount.total})`;
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

  constructor(private readonly viewModel: ViewModel) {
    const appContainer = document.querySelector("#app")!;
    const todoContainer = document.createElement("ul");

    appContainer.appendChild(todoContainer);

    this.todoContainer = todoContainer;
    this.viewModel.subscribeToDataChanged(this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    this.viewModel.todos.forEach((todo) => {
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
      this.viewModel.toggleTodo(todo.id);
    });

    button.addEventListener("click", () => {
      this.viewModel.removeTodo(todo.id);
    });

    return li;
  }
}

//=== Init ===//
const model = new Model();
const viewModel = new ViewModel(eventEmitterFactory, model);
new TodoView(viewModel);
new AddTodoView(viewModel);
new StatisticView(viewModel);
//=== Init ===//
