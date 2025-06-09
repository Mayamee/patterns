![alt text](docs/3a38f65895eec8816ccacb3388de200a.png)

### MVVM

#### Термин

MVVM - это архитектурный паттерн, который предлагает разделение логики UI интерфейса на 3 составные части

`Model` - компонент системы который отвечает за данные и бизнес-логику с этими данными.

`View` - компонент системы который отвечает за отображение интерфейса.

`ViewModel` - компонент системы который является представителем данных модели к View, реализует UI логику и подготавливает данные для отображения из Model во View.

**Связь View ↔ ViewModel**

- View получает заготовленные данные из ViewModel и отображает их на экране.

- Также существует двухсторонний биндинг данных между View и ViewModel:

View подписывается на события изменения данных ViewModel, тем самым имея всегда свежее отображение, также View может влиять на данные через ViewModel, но регламент обновления данных и UI логика находится уже на стороне ViewModel.

**Связь ViewModel ↔ Model**

- ViewModel подписывается на события изменения данных в Model, использует эти события для генерации собственных, которые потом уходят в UI по двухстороннему биндингу данных.

- ViewModel получает данные из Model и готовит их для отображения в View.

- Также ViewModel может менять данные в Model.

### Refs

- [skillbox](https://skillbox.ru/media/code/mvvm_proektirovanie_prilozheniy_dlya_windows/?utm_source=media&utm_medium=link&utm_campaign=all_all_media_links_links_articles_all_all_skillbox)
- [habr-1](https://habr.com/ru/articles/338518/)
- [habr-2](https://habr.com/ru/articles/215605/)
- [wiki](https://en.wikipedia.org/wiki/Model%E2%80%93view%E2%80%93viewmodel)
