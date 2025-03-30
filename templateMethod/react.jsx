import { useState } from "react";

function useListManager(initialList, sortFn, filterFn) {
  const [list, setList] = useState(initialList);

  const sortedList = sortFn ? [...list].sort(sortFn) : list;
  const filteredList = filterFn ? sortedList.filter(filterFn) : sortedList;

  return { list: filteredList, setList };
}

function UserList({ users }) {
  // Функция для сортировки по имени
  const sortByName = (a, b) => a.name.localeCompare(b.name);

  // Функция для фильтрации по email (например, только gmail)
  const filterByGmail = (user) => user.email.endsWith("@gmail.com");

  const { list } = useListManager(users, sortByName, filterByGmail);

  return (
    <ul>
      {list.map((user) => (
        <li key={user.id}>
          <strong>{user.name}</strong> - {user.email}
        </li>
      ))}
    </ul>
  );
}

function TaskList({ tasks }) {
  // Функция для сортировки по дате выполнения
  const sortByDueDate = (a, b) => new Date(a.dueDate) - new Date(b.dueDate);

  // Функция для фильтрации по статусу (например, только завершенные задачи)
  const filterByCompleted = (task) => task.completed;

  const { list } = useListManager(tasks, sortByDueDate, filterByCompleted);

  return (
    <ul>
      {list.map((task) => (
        <li key={task.id}>
          <strong>{task.title}</strong> - Due: {task.dueDate} (
          {task.completed ? "Completed" : "Pending"})
        </li>
      ))}
    </ul>
  );
}
