import { IMessenger, IUser, IGroup, IGroupFactory } from "./types";

export class Telegram implements IMessenger {
  private users: Set<IUser> = new Set();

  private groups: Map<string, IGroup> = new Map();

  constructor(private readonly groupFactory: IGroupFactory) {}

  public addUser(user: IUser): void {
    this.users.add(user);
  }

  public createGroup(name: string, issuer: IUser): string {
    const group = this.groupFactory.makeGroup(name, issuer);

    this.groups.set(group.groupId, group);

    return group.groupId;
  }

  public addMemberToGroup(groupId: string, user: IUser, issuer: IUser): void {
    const groupInstance = this.groups.get(groupId);

    if (!groupInstance) {
      console.info(`Group ${groupId} doesn't exist`);
      return;
    }

    const isOperationSuccess = groupInstance.addMember(user, issuer);

    if (isOperationSuccess) {
      // Можно назвать receiveGroupInvite
      user.onAddMemberToGroup(groupInstance.groupId);
    }
  }

  public deleteGroup(groupId: string, issuer: IUser): void {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group with id ${groupId} doesn't exist`);

      return;
    }

    const isIssuerOwner = group.checkIsOwner(issuer);

    if (!isIssuerOwner) {
      console.info(`User ${issuer.name} is not an owner of the group`);
      return;
    }

    this.users.forEach((user) => {
      user.onGroupDeleted(groupId);
    });

    this.groups.delete(groupId);
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
    message: string,
    groupId: string,
    sender: IUser
  ): void {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group with id ${groupId} doesn't exist`);
      return;
    }

    const moderatedMessage = this.moderateMessage(message);

    group.sendMessage(moderatedMessage, sender);
  }

  public renameGroup(groupId: string, name: string, issuer: IUser): void {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group with id ${groupId} doesn't exist`);
      return;
    }

    const isRenameOperationSuccess = group.setName(name, issuer);

    if (isRenameOperationSuccess) {
      console.info(`Group ${groupId} renamed to ${name}`);
    } else {
      console.info(`User ${issuer.name} can't rename the group`);
    }
  }

  public kickFromGroup(groupId: string, user: IUser, issuer: IUser): void {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group with id ${groupId} doesn't exist`);
      return;
    }

    const isSuccess = group.removeMember(user, issuer);

    if (isSuccess) {
      user.onKickFromGroup(groupId);
      console.info(`User ${user.name} was kicked from the group ${group.name}`);
    } else {
      console.info(
        `User ${issuer.name} can't kick user ${user.name} from the group`
      );
    }
  }
}
