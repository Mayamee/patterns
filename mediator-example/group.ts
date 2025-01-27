import {
  IGroup,
  IGroupService,
  IGroupFactory,
  IUniqIdGenerator,
  IUser,
  OperationStatus,
  IGroupMember,
} from "./types";

export class UniqIdGenerator implements IUniqIdGenerator {
  private id: number = 0;

  public generateId(): string {
    return String(this.id++);
  }
}

export class Group implements IGroup {
  private members: Set<IGroupMember> = new Set();
  private admins: Set<IGroupMember> = new Set();

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

  public setName(name: string, issuer: IGroupMember): OperationStatus {
    if (this.checkIsOwner(issuer) && this.checkIsAdmin(issuer)) {
      this.name = name;

      return {
        isSuccess: true,
        errorMessage: null,
      };
    }

    return {
      isSuccess: false,
      errorMessage: "You don't have permissions to change the group name",
    };
  }

  public addMember(user: IGroupMember, issuer: IGroupMember): OperationStatus {
    if (!this.checkIsAdmin(issuer) && !this.checkIsOwner(issuer)) {
      return {
        isSuccess: false,
        errorMessage: "You don't have permissions to add a member",
      };
    }

    this.members.add(user);
    user.onAddMemberToGroup(this.groupId);
    this.members.forEach((member) => {
      member.onGroupMessage(
        `${user.name} was added to the group ${this.groupId}`,
        this.groupId
      );
    });

    return {
      isSuccess: true,
      errorMessage: null,
    };
  }

  public checkIsMember(user: IGroupMember): boolean {
    return this.members.has(user);
  }

  public checkIsOwner(user: IGroupMember): boolean {
    return this.owner === user;
  }

  private checkIsAdmin(user: IGroupMember): boolean {
    return this.admins.has(user);
  }

  private isMember(user: IGroupMember): boolean {
    return this.members.has(user);
  }

  public addAdmin(user: IGroupMember, issuer: IGroupMember): OperationStatus {
    if (!this.checkIsOwner(issuer)) {
      return {
        isSuccess: false,
        errorMessage: "You don't have permissions to add an admin",
      };
    }

    this.admins.add(user);

    return {
      isSuccess: true,
      errorMessage: null,
    };
  }

  public removeMember(user: IGroupMember, issuer: IGroupMember): OperationStatus {
    if (!this.isMember(user)) {
      return {
        isSuccess: false,
        errorMessage: "User is not a member of the group",
      };
    }

    if (this.checkIsOwner(user)) {
      return {
        isSuccess: false,
        errorMessage: "Owner can't be removed from the group",
      };
    }

    const isIssuerTryingToRemoveHimself = issuer === user;

    if (isIssuerTryingToRemoveHimself) {
      this.kickUserFromGroup(user);
      return {
        isSuccess: true,
        errorMessage: null,
      };
    }

    if (this.checkIsOwner(issuer)) {
      this.kickUserFromGroup(user);

      return {
        isSuccess: true,
        errorMessage: null,
      };
    }

    if (this.checkIsAdmin(issuer) && this.checkIsAdmin(user)) {
      return {
        isSuccess: false,
        errorMessage: "Admin can't remove another admin",
      };
    }

    if (this.checkIsAdmin(issuer) && !this.checkIsAdmin(user)) {
      this.kickUserFromGroup(user);

      return {
        isSuccess: true,
        errorMessage: null,
      };
    }

    return {
      isSuccess: false,
      errorMessage: "You don't have permissions to remove a member",
    };
  }

  private kickUserFromGroup(user: IGroupMember) {
    user.onKickFromGroup(this.groupId);
    this.members.delete(user);
    this.admins.delete(user);
    this.sendMessage(
      `${user.name} was kicked from the group ${this.groupId}`,
      this.owner
    );
  }

  public sendMessage(message: string, sender: IGroupMember): OperationStatus {
    if (!this.isMember(sender)) {
      return {
        isSuccess: false,
        errorMessage: "You are not a member of the group",
      };
    }

    this.members.forEach((member) => {
      member.onGroupMessage(message, this.groupId, sender);
    });

    return {
      isSuccess: true,
      errorMessage: null,
    };
  }
}

export class GroupFactory implements IGroupFactory {
  constructor(private readonly uniqIdGenerator: IUniqIdGenerator) {}

  public makeGroup(name: string, owner: IUser): IGroup {
    const uniqId = this.uniqIdGenerator.generateId();

    return new Group(name, owner, uniqId);
  }
}

export class GroupService implements IGroupService {
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
  ): OperationStatus {
    const group = this.groups.get(groupId);

    if (!group) {
      return {
        isSuccess: false,
        errorMessage: "Group doesn't exist",
      };
    }

    return group.addMember(user, issuer);
  }

  public removeMemberFromGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): OperationStatus {
    const group = this.groups.get(groupId);

    if (!group) {
      return {
        isSuccess: false,
        errorMessage: "Group doesn't exist",
      };
    }

    return group.removeMember(user, issuer);
  }

  public sendMessageToGroup(
    groupId: string,
    message: string,
    sender: IUser
  ): OperationStatus {
    const group = this.groups.get(groupId);

    if (!group) {
      return {
        isSuccess: false,
        errorMessage: "Group doesn't exist",
      };
    }

    return group.sendMessage(message, sender);
  }

  public setGroupName(
    groupId: string,
    name: string,
    issuer: IUser
  ): OperationStatus {
    const group = this.groups.get(groupId);

    if (!group) {
      return {
        isSuccess: false,
        errorMessage: "Group doesn't exist",
      };
    }

    return group.setName(name, issuer);
  }

  public deleteGroupById(groupId: string, issuer: IUser): OperationStatus {
    const group = this.groups.get(groupId);

    if (!group) {
      return {
        isSuccess: false,
        errorMessage: "Group doesn't exist",
      };
    }

    const isIssuerOwner = group.checkIsOwner(issuer);

    if (!isIssuerOwner) {
      return {
        isSuccess: false,
        errorMessage: "You are not an owner of the group",
      };
    }

    group.onDestroy();
    this.groups.delete(groupId);

    return {
      isSuccess: true,
      errorMessage: null,
    };
  }
}
