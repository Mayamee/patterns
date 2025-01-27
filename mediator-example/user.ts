import { IMessenger, IUser } from "./types";

export class User implements IUser {
  private groupIds: Set<string> = new Set();

  constructor(public name: string, private readonly messenger: IMessenger) {}

  public sendMessage(message: string, target: IUser): void {
    this.messenger.sendMessage(message, this, target);
  }

  public onMessage(message: string, sender: IUser): void {
    console.log(
      `${this.name} received message from ${sender.name}: ${message}`
    );
  }

  public sendGroupMessage(message: string, groupId: string): void {
    this.messenger.sendGroupMessage(message, groupId, this);
  }

  public onGroupMessage(
    message: string,
    groupId: string,
    sender: IUser
  ): void {
    if (!this.groupIds.has(groupId)) {
      console.info(`User ${this.name} is not a member of the group ${groupId}`);

      return;
    }

    console.log(
      `${this.name} received group ${groupId} message from ${sender.name}: ${message}`
    );
  }

  public createGroup(name: string): string {
    console.log(`${this.name} created group ${name}`);

    const groupId = this.messenger.createGroup(name, this);

    this.groupIds.add(groupId);

    //? INFO костыль для теста
    return groupId;
  }

  public deleteGroup(groupId: string): void {
    // Можно вынести в unregisterGroup
    if (!this.groupIds.has(groupId)) {
      console.info(`User ${this.name} is not a member of the group ${groupId}`);

      return;
    }

    this.messenger.deleteGroup(groupId, this);
  }

  // unregisterGroup
  public onGroupDeleted(groupId: string): void {
    console.info(`User ${this.name} unregistered from group ${groupId}`);

    this.groupIds.delete(groupId);
  }

  public inviteToGroup(groupId: string, user: IUser): void {
    this.messenger.addMemberToGroup(groupId, user, this);
  }

  public onAddMemberToGroup(groupId: string): void {
    console.log(`${this.name} received group invite: ${groupId}`);

    this.groupIds.add(groupId);
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
