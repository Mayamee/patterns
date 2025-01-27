import {
  IGroup,
  IGroupController,
  IGroupFactory,
  IUniqIdGenerator,
  IUser,
} from "./types";

export class UniqIdGenerator implements IUniqIdGenerator {
  private id: number = 0;

  public generateId(): string {
    return String(this.id++);
  }
}

export class Group implements IGroup {
  private members: Set<IUser> = new Set();
  private admins: Set<IUser> = new Set();

  constructor(
    public name: string,
    private readonly owner: IUser,
    public readonly groupId: string
  ) {
    this.members.add(owner);
    this.admins.add(owner);
  }

  public onDestroy(): void {
    this.members.forEach((member) => {
      member.onGroupDeleted(this.groupId);
    });
  }

  public setName(name: string, issuer: IUser): boolean {
    if (this.checkIsOwner(issuer) && this.checkIsAdmin(issuer)) {
      this.name = name;

      return true;
    }

    return false;
  }

  public addMember(user: IUser, issuer: IUser): boolean {
    if (!this.checkIsAdmin(issuer) && !this.checkIsOwner(issuer)) {
      console.info(`User ${issuer.name} can't add a member to the group`);
      return false;
    }

    this.members.add(user);
    user.onAddMemberToGroup(this.groupId);
    this.members.forEach((member) => {
      member.onGroupMessage(
        `${user.name} was added to the group ${this.groupId}`,
        this.groupId
      );
    });

    return true;
  }

  public checkIsMember(user: IUser): boolean {
    return this.members.has(user);
  }

  public checkIsOwner(user: IUser): boolean {
    return this.owner === user;
  }

  private checkIsAdmin(user: IUser): boolean {
    return this.admins.has(user);
  }

  private isMember(user: IUser): boolean {
    return this.members.has(user);
  }

  public addAdmin(user: IUser, issuer: IUser): void {
    if (!this.checkIsOwner(issuer)) {
      console.info(`User ${issuer.name} is not an owner of the group`);

      return;
    }

    this.admins.add(user);
  }

  public removeMember(user: IUser, issuer: IUser): boolean {
    if (!this.isMember(user)) {
      console.info(
        `User ${user.name} is not a member of the group ${this.name}`
      );

      return false;
    }

    if (this.checkIsOwner(user)) {
      console.info(`Owner ${user.name} can't be removed from the group`);

      return false;
    }

    const isIssuerTryingToRemoveHimself = issuer === user;

    if (isIssuerTryingToRemoveHimself) {
      console.info(`User ${issuer.name} leave from the group ${this.name}`);

      this.kickUserFromGroup(user);
      return true;
    }

    if (this.checkIsOwner(issuer)) {
      this.kickUserFromGroup(user);

      return true;
    }

    if (this.checkIsAdmin(issuer) && this.checkIsAdmin(user)) {
      console.info(`Admin ${issuer.name} can't remove another admin`);

      return false;
    }

    if (this.checkIsAdmin(issuer) && !this.checkIsAdmin(user)) {
      this.kickUserFromGroup(user);

      return true;
    }

    return false;
  }

  private kickUserFromGroup(user: IUser) {
    user.onKickFromGroup(this.groupId);
    this.members.delete(user);
    this.admins.delete(user);
    this.sendMessage(
      `${user.name} was kicked from the group ${this.groupId}`,
      this.owner
    );
  }

  public sendMessage(message: string, sender: IUser): boolean {
    if (!this.isMember(sender)) {
      console.info(`User ${sender.name} is not a member of the group`);

      return false;
    }

    this.members.forEach((member) => {
      member.onGroupMessage(message, this.groupId, sender);
    });

    return true;
  }
}

export class GroupFactory implements IGroupFactory {
  constructor(private readonly uniqIdGenerator: IUniqIdGenerator) {}

  public makeGroup(name: string, owner: IUser): IGroup {
    const uniqId = this.uniqIdGenerator.generateId();

    return new Group(name, owner, uniqId);
  }
}

export class GroupController implements IGroupController {
  private readonly groups: Map<string, IGroup> = new Map();

  constructor(private readonly groupFactory: IGroupFactory) {}

  public getGroupsByUser(user: IUser): IGroup[] {
    return Array.from(this.groups.values()).filter((group) =>
      group.checkIsMember(user)
    );
  }

  public getGroupById(groupId: string): IGroup | null {
    return this.groups.get(groupId) ?? null;
  }

  public createGroup(name: string, owner: IUser): IGroup {
    const group = this.groupFactory.makeGroup(name, owner);

    this.groups.set(group.groupId, group);

    return group;
  }

  public addMemberToGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): boolean {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group ${groupId} doesn't exist`);

      return false;
    }

    return group.addMember(user, issuer);
  }

  public removeMemberFromGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): boolean {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group ${groupId} doesn't exist`);

      return false;
    }

    return group.removeMember(user, issuer);
  }

  public sendMessageToGroup(
    groupId: string,
    message: string,
    sender: IUser
  ): boolean {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group ${groupId} doesn't exist`);

      return false;
    }

    return group.sendMessage(message, sender);
  }

  public setGroupName(groupId: string, name: string, issuer: IUser): boolean {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group ${groupId} doesn't exist`);

      return false;
    }

    return group.setName(name, issuer);
  }

  public deleteGroupById(groupId: string, issuer: IUser): boolean {
    const group = this.groups.get(groupId);

    if (!group) {
      console.info(`Group with id ${groupId} doesn't exist`);

      return false;
    }

    const isIssuerOwner = group.checkIsOwner(issuer);

    if (!isIssuerOwner) {
      console.info(`User ${issuer.name} is not an owner of the group`);
      return false;
    }

    group.onDestroy();
    this.groups.delete(groupId);

    return true;
  }
}
