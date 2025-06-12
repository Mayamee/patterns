import { EventEmitter } from "./components";

type Todo = {
  id: number;
  title: string;
  isCompleted: boolean;
};

class Model extends EventEmitter<{
  dataChanged: () => void;
}> {
  private todos: Todo[] = [];

  public addTodo(title: string) {
    this.todos.push({
      id: Date.now(),
      title,
      isCompleted: false,
    });

    this.notify("dataChanged");
  }

  public removeTodo(id: number) {
    this.todos = this.todos.filter((todo) => todo.id !== id);

    this.notify("dataChanged");
  }

  public toggleTodo(id: number) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );

    this.notify("dataChanged");
  }

  public getTodos() {
    return this.todos;
  }

  public clearTodos() {
    this.todos = [];

    this.notify("dataChanged");
  }
}

class Presenter extends EventEmitter<{
  dataChanged: () => void;
}> {
  constructor(private readonly model: Model) {
    super();

    // Ретрансляция событий из модели, позволяет любым компонентам взаимодействовать с моделью и при этом потребители данного Presenter будут уведомлены
    this.model.on("dataChanged", this.notify.bind(this, "dataChanged"));
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
  }

  public removeTodo(id: number) {
    this.model.removeTodo(id);
  }

  public toggleTodo(id: number) {
    this.model.toggleTodo(id);
  }
}

class StatisticView {
  private wrapper: Element;

  constructor(private readonly presenter: Presenter) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    // Подписываемся на события presenter о изменении данных
    this.presenter.on("dataChanged", this.render.bind(this));
  }

  private render() {
    this.wrapper.innerHTML = "";

    const incompleteTodosText = document.createElement("div");
    incompleteTodosText.innerText = `Incomplete todos (${this.presenter.todosCount.incomplete})`;
    this.wrapper.appendChild(incompleteTodosText);

    const completedTodosText = document.createElement("div");
    completedTodosText.innerText = `Completed todos (${this.presenter.todosCount.completed})`;
    this.wrapper.appendChild(completedTodosText);

    const totalTodosText = document.createElement("div");
    totalTodosText.innerText = `Total todos (${this.presenter.todosCount.total})`;
    this.wrapper.appendChild(totalTodosText);

    const todoLimit = document.createElement("div");
    todoLimit.innerText = `Todo limit (${this.presenter.todosLimit})`;
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
    // Подписываемся на события presenter о изменении данных
    this.presenter.on("dataChanged", this.render.bind(this));
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

    button.innerText = `Add todo (${this.presenter.todosCount.total})`;
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
    // Подписываемся на события presenter о изменении данных
    this.presenter.on("dataChanged", this.render.bind(this));
  }

  private render() {
    this.clearContainer();
    this.presenter.todos.forEach((todo) => {
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
const model = new Model();
const presenter = new Presenter(model);
new TodoView(presenter);
new AddTodoView(presenter);
new StatisticView(presenter);
//=== Init ===//
