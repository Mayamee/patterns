const data = [1, 2, 3, 4];

const promises = data.map((item) => {
  if (item !== 4) {
    return Promise.resolve(item);
  } else {
    return Promise.reject(item);
  }
});

const main = async () => {
  try {
    /// --- some code --- ///
    // Тк нет await код упадет с ошибкой, если добавить await то код выполнится корректно но будет ждать выполнения всех промисов
    Promise.all(promises)
      .then((values) => {
        console.log("Ждем всех и вызываем только потом", values);
      })
      // --- Но если мы добавим catch то код выполнится корректно и не будет ждать выполнения всех промисов
      .catch(() => {});

    for (const promise of promises) {
      const value = await promise;
      console.log("success", value);
    }
  } catch (error) {
    console.error("error", error);
  }
};

main();
