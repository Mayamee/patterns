import { IGroup, IGroupFactory, IUniqIdGenerator, IUser } from "./types";

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

    return true;
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

      this.members.delete(issuer);
      this.admins.delete(issuer);
      return true;
    }

    if (this.checkIsOwner(issuer)) {
      this.members.delete(user);
      this.admins.delete(user);

      return true;
    }

    if (this.checkIsAdmin(issuer) && this.checkIsAdmin(user)) {
      console.info(`Admin ${issuer.name} can't remove another admin`);

      return false;
    }

    if (this.checkIsAdmin(issuer) && !this.checkIsAdmin(user)) {
      this.members.delete(user);

      return true;
    }

    return false;
  }

  public sendMessage(message: string, sender: IUser): void {
    if (!this.isMember(sender)) {
      console.info(`User ${sender.name} is not a member of the group`);

      return;
    }

    this.members.forEach((member) => {
      member.onGroupMessage(message, this.groupId, sender);
    });
  }
}

export class GroupFactory implements IGroupFactory {
  constructor(private readonly uniqIdGenerator: IUniqIdGenerator) {}

  public makeGroup(name: string, owner: IUser): IGroup {
    const uniqId = this.uniqIdGenerator.generateId();

    return new Group(name, owner, uniqId);
  }
}
