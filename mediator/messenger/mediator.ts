import {
  IMessenger,
  IUser,
  IGroupService,
  IGroup,
  OperationStatus,
  ILogger,
  LoggerContext,
  IModerator,
} from "./types";

export class Logger implements ILogger {
  private performLog(
    message: string,
    severity: string,
    ctx?: LoggerContext
  ): void {
    const additionalInfo = ctx?.additionalInfo ? ` ${ctx.additionalInfo} ` : "";
    const dateInfo = new Date().toISOString();

    console.log(`[${severity}]:${message}${additionalInfo}{${dateInfo}}`);
  }

  public log(message: string, ctx?: LoggerContext): void {
    this.performLog(message, "INFO", ctx);
  }

  public error(message: string, ctx?: LoggerContext): void {
    this.performLog(message, "ERROR", ctx);
  }

  public warning(message: string, ctx?: LoggerContext): void {
    this.performLog(message, "WARNING", ctx);
  }
}

export class Moderator implements IModerator {
  public moderateMessage(message: string): string {
    if (
      ["xxx", "make", "me", "slap", "move"].some((word) => message === word)
    ) {
      return "Message is not allowed";
    }

    return message;
  }
}

export class Telegram implements IMessenger {
  private users: Set<IUser> = new Set();

  constructor(
    private readonly _groupService: IGroupService,
    private readonly _logger: ILogger,
    private readonly _moderator: IModerator
  ) {}

  public addUser(user: IUser): void {
    if (this.users.has(user)) {
      this._logger.warning(
        `User ${user.name} already registered in the messenger`
      );

      return;
    }

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

    const moderatedMessage = this._moderator.moderateMessage(message);

    target.onMessage(moderatedMessage, sender);
  }

  public sendGroupMessage(
    groupId: string,
    message: string,
    sender: IUser
  ): void {
    const moderatedMessage = this._moderator.moderateMessage(message);

    this._groupService.sendMessageToGroup(groupId, moderatedMessage, sender);
  }

  public renameGroup(
    groupId: string,
    name: string,
    issuer: IUser
  ): OperationStatus {
    const status = this._groupService.setGroupName(groupId, name, issuer);

    if (status.errorMessage) {
      this._logger.error(status.errorMessage, {
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
      this._logger.error(status.errorMessage, {
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
}
