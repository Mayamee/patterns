export type OperationStatus = {
  isSuccess: boolean;
  errorMessage: string | null;
};

export interface IGroupMember {
  name: string;
  deleteGroup(groupId: string): void;
  onGroupDeleted(groupId: string): void;
  onGroupMessage(message: string, groupId: string, sender?: IGroupMember): void;
  onAddMemberToGroup(groupId: string): void;
  onKickFromGroup(groupId: string): void;
}

export interface IUser extends IGroupMember {
  name: string;
  onMessage(message: string, sender: IUser): void;
}

export interface IMessenger {
  sendMessage(message: string, sender: IUser, target: IUser): void;
  sendGroupMessage(
    groupId: string,
    message: string,
    sender: IGroupMember
  ): void;
  addUser(user: IUser): void;
  createGroup(name: string, owner: IGroupMember): string;
  deleteGroup(groupId: string, issuer: IGroupMember): OperationStatus;
  renameGroup(
    groupId: string,
    name: string,
    issuer: IGroupMember
  ): OperationStatus;
  addMemberToGroup(
    groupId: string,
    user: IGroupMember,
    issuer: IGroupMember
  ): OperationStatus;
  kickFromGroup(
    groupId: string,
    user: IGroupMember,
    issuer: IGroupMember
  ): OperationStatus;
  getGroupsByUser(user: IGroupMember): IGroup[];
}

export interface IGroup {
  name: string;
  groupId: string;
  onDestroy(): void;
  checkIsOwner(user: IGroupMember): boolean;
  checkIsMember(user: IGroupMember): boolean;
  setName(name: string, issuer: IGroupMember): OperationStatus;
  addMember(user: IGroupMember, issuer: IGroupMember): OperationStatus;
  removeMember(user: IGroupMember, issuer: IGroupMember): OperationStatus;
  sendMessage(message: string, sender: IGroupMember): OperationStatus;
}

export interface IGroupService {
  createGroup(name: string, owner: IGroupMember): IGroup;
  getGroupById(groupId: string): IGroup | null;
  getGroupsByUser(user: IUser): IGroup[];
  setGroupName(
    groupId: string,
    name: string,
    issuer: IGroupMember
  ): OperationStatus;
  addMemberToGroup(
    groupId: string,
    user: IGroupMember,
    issuer: IGroupMember
  ): OperationStatus;
  deleteGroupById(groupId: string, issuer: IGroupMember): OperationStatus;
  removeMemberFromGroup(
    groupId: string,
    user: IGroupMember,
    issuer: IGroupMember
  ): OperationStatus;
  sendMessageToGroup(
    groupId: string,
    message: string,
    sender: IGroupMember
  ): OperationStatus;
}

export interface IGroupFactory {
  makeGroup(name: string, owner: IGroupMember): IGroup;
}

export interface IUniqIdGenerator {
  generateId(): string;
}

export type LoggerContext = {
  severity?: string;
  additionalInfo?: string;
};

export interface ILogger {
  log(message: string, ctx?: LoggerContext): void;
}
