import {
  IMessenger,
  IUser,
  IGroupService,
  IGroup,
  OperationStatus,
  ILogger,
  LoggerContext,
} from "./types";

export class Logger implements ILogger {
  public log(message: string, ctx?: LoggerContext): void {
    const severity = ctx?.severity ?? "INFO";
    const additionalInfo = ctx?.additionalInfo ? ` ${ctx.additionalInfo} ` : "";
    const dateInfo = new Date().toISOString();

    console.log(`[${severity}]:${message}${additionalInfo}{${dateInfo}}`);
  }
}

export class Telegram implements IMessenger {
  private users: Set<IUser> = new Set();

  constructor(
    private readonly _groupService: IGroupService,
    private readonly _logger: ILogger
  ) {}

  public addUser(user: IUser): void {
    this.users.add(user);
  }

  public createGroup(name: string, issuer: IUser): string {
    const group = this._groupService.createGroup(name, issuer);

    return group.groupId;
  }

  public addMemberToGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): OperationStatus {
    return this._groupService.addMemberToGroup(groupId, user, issuer);
  }

  public deleteGroup(groupId: string, issuer: IUser): OperationStatus {
    return this._groupService.deleteGroupById(groupId, issuer);
  }

  public sendMessage(message: string, sender: IUser, target: IUser): void {
    if (!this.users.has(target)) {
      this._logger.log(
        `User ${target.name} is not registered in the messenger`
      );

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

    this._groupService.sendMessageToGroup(groupId, moderatedMessage, sender);
  }

  public renameGroup(
    groupId: string,
    name: string,
    issuer: IUser
  ): OperationStatus {
    const status = this._groupService.setGroupName(groupId, name, issuer);

    if (status.errorMessage) {
      this._logger.log(status.errorMessage, {
        severity: "ERROR",
        additionalInfo: JSON.stringify({
          groupId,
          issuerName: issuer.name,
          groupName: name,
        }),
      });
    }

    return status;
  }

  public kickFromGroup(
    groupId: string,
    user: IUser,
    issuer: IUser
  ): OperationStatus {
    const status = this._groupService.removeMemberFromGroup(
      groupId,
      user,
      issuer
    );

    if (status.errorMessage) {
      this._logger.log(status.errorMessage, {
        severity: "ERROR",
        additionalInfo: JSON.stringify({
          groupId,
          issuerName: issuer.name,
          userName: user.name,
        }),
      });
    }

    return status;
  }

  public getGroupsByUser(user: IUser): IGroup[] {
    return this._groupService.getGroupsByUser(user);
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
