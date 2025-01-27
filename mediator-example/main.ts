import { GroupFactory, UniqIdGenerator } from "./group";
import { Telegram } from "./mediator";
import { User } from "./user";

// Создаем медиатор
const telegram = new Telegram(new GroupFactory(new UniqIdGenerator()));

// Пользователи берут в руки телефон, называют как то себя и используют telegram
const mark = new User("Mark", telegram);
const semen = new User("Semen", telegram);
const nick = new User("Nick", telegram);

// Регистрируются в мессенджере
telegram.addUser(mark);
telegram.addUser(semen);
telegram.addUser(nick);

// Марк отправляет прямое сообщение Семёну
mark.sendMessage("Hello, Semen", semen);
// Марк создает группу
const markGroupId = mark.createGroup("Cool group");
// Марк приглашает в группу Семёна
mark.inviteToGroup(markGroupId, semen);

// Марк пишет в группу
mark.sendGroupMessage("Hello, Semen", markGroupId);
// Семён отвечает Марку
semen.sendGroupMessage("Hello, Mark", markGroupId);
// Ник пытается отправить сообщение, но ничего не получается, звонит марку и говорит пригласи
nick.sendGroupMessage("Hello, Mark", markGroupId);
// Марк приглашает Ника в группу
mark.inviteToGroup(markGroupId, nick);
// Ник радуется такой щедрости и пишет
nick.sendGroupMessage("Hello, Everybody!", markGroupId);
// Ник становится злой и решает удалить Марка из его группы
nick.kickFromGroup(markGroupId, mark);
// Марк видит и злится на Ника, и кикает его в ответ
mark.sendGroupMessage("I'll kick you, Nick", markGroupId);
mark.kickFromGroup(markGroupId, nick);
// Ник пытается написать но уже тщетно
nick.sendGroupMessage("How was it happen?", markGroupId);


/* Старый вариант использования,
ссылку на требуемый класс можно передавать различными способами,
сеттингом отдельным, сеттингом непосредственно в момент вызова и через конструктор,
главное связать, еще нюанс если делать отдельный метод для сеттинга это проверки на существования ссылки на объект в поле.
*/
// Указания пользователям включить месссенджер telegram
// const markGroupId = mark.createGroup("Cool group", telegram);
// const semenGroupId = semen.createGroup("Cool group", telegram);
// const nickGroupId = nick.createGroup("Cool group", telegram);

// mark.inviteToGroup(markGroupId, semen, telegram);
// mark.inviteToGroup(markGroupId, nick, telegram);

// semen.inviteToGroup(semenGroupId, mark, telegram);
// semen.inviteToGroup(semenGroupId, nick, telegram);

// nick.inviteToGroup(nickGroupId, mark, telegram);
// nick.inviteToGroup(nickGroupId, semen, telegram);

// mark.sendGroupMessage("Hello, Semen", markGroupId, telegram);
// semen.sendGroupMessage("Hello, Mark", semenGroupId, telegram);
// nick.sendGroupMessage("Hello, Mark", nickGroupId, telegram);

// mark.renameGroup(markGroupId, "Super cool group", telegram);

// mark.deleteGroup(markGroupId, telegram);

// mark.sendGroupMessage("Hello, Semen", markGroupId, telegram);
