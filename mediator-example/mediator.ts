import {
  IMessenger,
  IUser,
  IGroupService,
  IGroup,
  OperationStatus,
} from "./types";

export class Telegram implements IMessenger {
  private users: Set<IUser> = new Set();

  constructor(private readonly groupService: IGroupService) {}

  public addUser(user: IUser): void {
    this.users.add(user);
  }

  public createGroup(name: string, issuer: IUser): string {
    const group = this.groupService.createGroup(name, issuer);

    return group.groupId;
  }

  public addMemberToGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): OperationStatus {
    return this.groupService.addMemberToGroup(groupId, user, issuer);
  }

  public deleteGroup(groupId: string, issuer: IUser): OperationStatus {
    return this.groupService.deleteGroupById(groupId, issuer);
  }

  public sendMessage(message: string, sender: IUser, target: IUser): void {
    if (!this.users.has(target)) {
      console.info(`User ${target.name} is not registered in the messenger`);

      return;
    }

    const moderatedMessage = this.moderateMessage(message);

    target.onMessage(moderatedMessage, sender);
  }

  public sendGroupMessage(
    groupId: string,
    message: string,
    sender: IUser
  ): void {
    const moderatedMessage = this.moderateMessage(message);

    this.groupService.sendMessageToGroup(groupId, moderatedMessage, sender);
  }

  public renameGroup(
    groupId: string,
    name: string,
    issuer: IUser
  ): OperationStatus {
    return this.groupService.setGroupName(groupId, name, issuer);
  }

  public kickFromGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): OperationStatus {
    return this.groupService.removeMemberFromGroup(groupId, user, issuer);
  }

  public getGroupsByUser(user: IUser): IGroup[] {
    return this.groupService.getGroupsByUser(user);
  }

  private moderateMessage(message: string): string {
    if (
      ["xxx", "make", "me", "slap", "move"].some((word) => message === word)
    ) {
      return "Message is not allowed";
    }

    return message;
  }
}
