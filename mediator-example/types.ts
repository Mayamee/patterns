export interface IUser {
  name: string;
  deleteGroup(groupId: string): void;
  onGroupDeleted(groupId: string): void;
  onMessage(message: string, sender: IUser): void;
  onGroupMessage(message: string, groupId: string, sender: IUser): void;
  onAddMemberToGroup(groupId: string): void;
  onKickFromGroup(groupId: string): void;
}

export interface IMessenger {
  sendMessage(message: string, sender: IUser, target: IUser): void;
  sendGroupMessage(message: string, groupId: string, sender: IUser): void;
  addUser(user: IUser): void;
  createGroup(name: string, owner: IUser): string;
  deleteGroup(groupId: string, issuer: IUser): void;
  renameGroup(groupId: string, name: string, issuer: IUser): void;
  addMemberToGroup(groupId: string, user: IUser, issuer: IUser): void;
  kickFromGroup(groupId: string, user: IUser, issuer: IUser): void;
}

export interface IGroup {
  name: string;
  groupId: string;
  checkIsOwner(user: IUser): boolean;
  setName(name: string, issuer: IUser): boolean;
  addMember(user: IUser, issuer: IUser): boolean;
  removeMember(user: IUser, issuer: IUser): boolean;
  sendMessage(message: string, sender: IUser): void;
}

export interface IGroupFactory {
  makeGroup(name: string, owner: IUser): IGroup;
}

export interface IUniqIdGenerator {
  generateId(): string;
}
