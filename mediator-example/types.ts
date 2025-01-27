export interface IUser {
  name: string;
  deleteGroup(groupId: string): void;
  onGroupDeleted(groupId: string): void;
  onMessage(message: string, sender: IUser): void;
  onGroupMessage(message: string, groupId: string, sender?: IUser): void;
  onAddMemberToGroup(groupId: string): void;
  onKickFromGroup(groupId: string): void;
}

export interface IMessenger {
  sendMessage(message: string, sender: IUser, target: IUser): void;
  sendGroupMessage(groupId: string, message: string, sender: IUser): void;
  addUser(user: IUser): void;
  createGroup(name: string, owner: IUser): string;
  deleteGroup(groupId: string, issuer: IUser): boolean;
  renameGroup(groupId: string, name: string, issuer: IUser): void;
  addMemberToGroup(groupId: string, user: IUser, issuer: IUser): void;
  kickFromGroup(groupId: string, user: IUser, issuer: IUser): void;
  getGroupsByUser(user: IUser): IGroup[];
}

export interface IGroup {
  name: string;
  groupId: string;
  checkIsOwner(user: IUser): boolean;
  checkIsMember(user: IUser): boolean;
  setName(name: string, issuer: IUser): boolean;
  addMember(user: IUser, issuer: IUser): boolean;
  removeMember(user: IUser, issuer: IUser): boolean;
  sendMessage(message: string, sender: IUser): boolean;
  onDestroy(): void;
}

export interface IGroupController {
  createGroup(name: string, owner: IUser): IGroup;
  getGroupById(groupId: string): IGroup | null;
  getGroupsByUser(user: IUser): IGroup[];
  setGroupName(groupId: string, name: string, issuer: IUser): boolean;
  addMemberToGroup(groupId: string, user: IUser, issuer: IUser): boolean;
  deleteGroupById(groupId: string, issuer: IUser): boolean;
  removeMemberFromGroup(groupId: string, user: IUser, issuer: IUser): boolean;
  sendMessageToGroup(groupId: string, message: string, sender: IUser): boolean;
}

export interface IGroupFactory {
  makeGroup(name: string, owner: IUser): IGroup;
}

export interface IUniqIdGenerator {
  generateId(): string;
}
