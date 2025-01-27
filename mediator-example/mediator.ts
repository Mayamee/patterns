import { IMessenger, IUser, IGroupController, IGroup } from "./types";

export class Telegram implements IMessenger {
  private users: Set<IUser> = new Set();

  constructor(private readonly groupController: IGroupController) {}

  public addUser(user: IUser): void {
    this.users.add(user);
  }

  public createGroup(name: string, issuer: IUser): string {
    const group = this.groupController.createGroup(name, issuer);

    return group.groupId;
  }

  public addMemberToGroup(groupId: string, user: IUser, issuer: IUser): void {
    this.groupController.addMemberToGroup(groupId, user, issuer);
  }

  public deleteGroup(groupId: string, issuer: IUser): boolean {
    const isSuccess = this.groupController.deleteGroupById(groupId, issuer);

    return isSuccess;
  }

  public sendMessage(message: string, sender: IUser, target: IUser): void {
    if (!this.users.has(target)) {
      console.info(`User ${target.name} is not registered in the messenger`);

      return;
    }

    const moderatedMessage = this.moderateMessage(message);

    target.onMessage(moderatedMessage, sender);
  }

  private moderateMessage(message: string): string {
    if (
      ["xxx", "make", "me", "slap", "move"].some((word) => message === word)
    ) {
      return "Message is not allowed";
    }

    return message;
  }

  public sendGroupMessage(
    groupId: string,
    message: string,
    sender: IUser
  ): void {
    const moderatedMessage = this.moderateMessage(message);

    this.groupController.sendMessageToGroup(groupId, moderatedMessage, sender);
  }

  public renameGroup(groupId: string, name: string, issuer: IUser): void {
    const isRenameOperationSuccess = this.groupController.setGroupName(
      groupId,
      name,
      issuer
    );

    if (isRenameOperationSuccess) {
      console.info(`Group ${groupId} renamed to ${name}`);
    } else {
      console.info(`User ${issuer.name} can't rename the group`);
    }
  }

  public kickFromGroup(groupId: string, user: IUser, issuer: IUser): void {
    const isSuccess = this.groupController.removeMemberFromGroup(
      groupId,
      user,
      issuer
    );

    if (!isSuccess) {
      console.info(
        `User ${issuer.name} can't kick user ${user.name} from the group`
      );
    }
  }

  public getGroupsByUser(user: IUser): IGroup[] {
    return this.groupController.getGroupsByUser(user);
  }
}
