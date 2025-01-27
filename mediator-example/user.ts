import { IMessenger, IUser } from "./types";

export class User implements IUser {
  constructor(public name: string, private readonly messenger: IMessenger) {}

  public sendMessage(message: string, target: IUser): void {
    this.messenger.sendMessage(message, this, target);
  }

  public onMessage(message: string, sender: IUser): void {
    console.log(
      `${this.name} received message from ${sender.name}: ${message}`
    );
  }

  public sendGroupMessage(groupId: string, message: string): void {
    this.messenger.sendGroupMessage(groupId, message, this);
  }

  public onGroupMessage(message: string, groupId: string, sender?: IUser): void {
    const senderName = sender ? sender.name : "group-main-channel";

    console.log(
      `${this.name} received group ${groupId} message from [${senderName}]: ${message}`
    );
  }

  public createGroup(name: string): string {
    console.log(`${this.name} created group ${name}`);

    const groupId = this.messenger.createGroup(name, this);

    //? INFO костыль для теста
    return groupId;
  }

  public deleteGroup(groupId: string): void {
    this.messenger.deleteGroup(groupId, this);
  }

  // unregisterGroup
  public onGroupDeleted(groupId: string): void {
    console.info(`User ${this.name} unregistered from group ${groupId}`);
  }

  public inviteToGroup(groupId: string, user: IUser): void {
    this.messenger.addMemberToGroup(groupId, user, this);
  }

  // ??? boolean для пайплайна добавления???
  public onAddMemberToGroup(groupId: string): void {
    console.log(`${this.name} received group invite: ${groupId}`);
  }

  // TODO можно расширить до объекта, который передает весь контекст переименования
  public renameGroup(groupId: string, newName: string): void {
    this.messenger.renameGroup(groupId, newName, this);

    console.log(`${this.name} renamed group ${groupId} to ${newName}`);
  }

  public kickFromGroup(groupId: string, user: IUser): void {
    this.messenger.kickFromGroup(groupId, user, this);
  }

  public onKickFromGroup(groupId: string): void {
    this.onGroupDeleted(groupId);
    console.info(`User ${this.name} was kicked from group ${groupId}`);
  }
}
