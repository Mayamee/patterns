/**
 * MVVM — это архитектура с односторонней реактивной связью:
 *
 * 1. ViewModel не знает о View вообще:
 *    - никакой ссылки, даже слабой;
 *    - никаких callback'ов, интерфейсов и подписок на View;
 *    - ViewModel — полностью изолированный слой бизнес-логики.
 *
 * 2. View знает о ViewModel:
 *    - View подписывается на состояние, опубликованное ViewModel;
 *    - ViewModel — источник состояния, View — потребитель и визуальный слой.
 *
 * 3. Ключевая суть MVVM:
 *    - View ↔ подписка → ViewModel.state (реактивно или вручную);
 *    - ViewModel → Model (работает с бизнес-логикой, репозиториями, API);
 *    - ViewModel ←X→ View (никакой связи назад!)
 *
 * 4. MVP отличается тем, что:
 *    - View знает о Presenter и вызывает его методы;
 *    - Presenter знает (через интерфейс) о View и напрямую управляет её поведением.
 *
 * Итог: MVVM — декларативная архитектура, где инициатор изменений — ViewModel (изменил состояние),
 * а View реагирует на эти изменения, подписавшись на данные (реактивно).
 */

import { autorun, makeAutoObservable } from "mobx";
import { EventEmitter } from "./components";

type Todo = {
  id: number;
  title: string;
  isCompleted: boolean;
};

class Model extends EventEmitter<{
  dataChanged: (todos: Todo[]) => void;
}> {
  private todos: Todo[] = [];

  public addTodo(title: string) {
    this.todos.push({
      id: Date.now(),
      title,
      isCompleted: false,
    });

    this.notify("dataChanged", this.todos);
  }

  public removeTodo(id: number) {
    this.todos = this.todos.filter((todo) => todo.id !== id);

    this.notify("dataChanged", this.todos);
  }

  public toggleTodo(id: number) {
    this.todos = this.todos.map((todo) =>
      todo.id === id ? { ...todo, isCompleted: !todo.isCompleted } : todo
    );

    this.notify("dataChanged", this.todos);
  }

  public getTodos() {
    return this.todos;
  }

  public clearTodos() {
    this.todos = [];

    this.notify("dataChanged", this.todos);
  }
}

class ViewModel {
  private todosInner: Todo[];

  constructor(private readonly model: Model) {
    this.todosInner = this.model.getTodos();

    this.model.on("dataChanged", (todos) => {
      this.todosInner = todos;
    });

    makeAutoObservable(
      this,
      {},
      {
        autoBind: true,
      }
    );
  }

  public get todosLimit() {
    return 10;
  }

  public get todos() {
    return this.todosInner;
  }

  public get completedTodos() {
    return this.todosInner.filter((todo) => todo.isCompleted);
  }

  public get incompleteTodos() {
    return this.todosInner.filter((todo) => !todo.isCompleted);
  }

  public get todosCount() {
    return {
      completed: this.completedTodos.length,
      incomplete: this.incompleteTodos.length,
      total: this.todosInner.length,
    };
  }

  public get isLimitReached() {
    return this.todosInner.length >= this.todosLimit;
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

  constructor(private readonly viewModel: ViewModel) {
    const appContainer = document.querySelector("#app")!;
    this.wrapper = document.createElement("div");
    this.render();
    appContainer.appendChild(this.wrapper);
    // Подписываемся на данные ViewModel (биндинг)
    autorun(this.render.bind(this));
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
    // Подписываемся на данные ViewModel (биндинг)
    autorun(this.render.bind(this));
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
    // Подписываемся на данные ViewModel (биндинг)
    autorun(this.render.bind(this));
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
const viewModel = new ViewModel(model);
new TodoView(viewModel);
new AddTodoView(viewModel);
new StatisticView(viewModel);
//=== Init ===//
