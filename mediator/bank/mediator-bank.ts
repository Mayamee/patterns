interface IUser {
  getName: () => string;
  getLogin: () => string;
  getAccessCode: () => string;
}

interface IBankMediator {
  createAccount(user: IUser): void;

  applyForLoan(user: IUser): void;
}

interface IAccessChecker {
  checkAccess(user: IUser): boolean;
}

interface IAccountChecker {
  checkAccount(user: IUser): boolean;
}

interface ILoginChecker {
  checkLogin(user: IUser): boolean;
}

interface IBankCore {
  createAccount(user: IUser): void;

  applyForLoan(user: IUser): void;
}

class AccessChecker implements IAccessChecker {
  private readonly validAccessCode = "123";

  public checkAccess(user: IUser): boolean {
    return user.getAccessCode() === this.validAccessCode;
  }
}

class AccountChecker implements IAccountChecker {
  private readonly validAccountNameRegex = /^[0-9]{10}$/;

  public checkAccount(user: IUser): boolean {
    return this.validAccountNameRegex.test(user.getName());
  }
}

class LoginChecker implements ILoginChecker {
  public checkLogin(user: IUser): boolean {
    return user.getLogin() === "admin";
  }
}

class BankCore {}

class BadUser implements IUser {
  constructor(
    private name: string,
    private accessCode: string,
    private login: string,
    // Наблюдаем большое количество связей
    private readonly _accountChecker: IAccountChecker,
    private readonly _accessChecker: IAccessChecker,
    private readonly _loginChecker: ILoginChecker
  ) {}

  public getAccessCode() {
    return this.accessCode;
  }

  public getName() {
    return this.name;
  }

  public getLogin() {
    return this.login;
  }

  createAccount(): void {
    if (!this._accountChecker.checkAccount(this)) {
      console.log("Ошибка создания аккаунта");
      return;
    }

    if (!this._accessChecker.checkAccess(this)) {
      console.log("Ошибка доступа");
      return;
    }

    if (!this._loginChecker.checkLogin(this)) {
      console.log("Ошибка логина");
      return;
    }

    console.log("логика дальнейшая");
  }

  applyForLoan(): void {
    console.log(`Loan request for ${this.getName()} is sent`);
  }
}

class User implements IUser {
  constructor(
    private name: string,
    private accessCode: string,
    private login: string,
    private readonly mediator: IBankMediator
  ) {}

  public getAccessCode() {
    return this.accessCode;
  }

  public getName() {
    return this.name;
  }
  public getLogin() {
    return this.login;
  }

  createAccount(): void {
    this.mediator.createAccount(this);
  }

  applyForLoan(): void {
    this.mediator.applyForLoan(this);
  }
}

class BankMediator implements IBankMediator {
  constructor(
    private readonly _accessChecker: IAccessChecker,
    private readonly _accountChecker: IAccountChecker,
    private readonly _loginChecker: ILoginChecker
  ) {}

  createAccount(user: IUser): void {
    if (!this._accountChecker.checkAccount(user)) {
      console.log("Ошибка создания аккаунта");
      return;
    }

    if (!this._accessChecker.checkAccess(user)) {
      console.log("Ошибка доступа");
      return;
    }

    if (!this._loginChecker.checkLogin(user)) {
      console.log("Ошибка логина");
      return;
    }

    console.log(`Account for ${user.getName()} is created`);
  }

  applyForLoan(user: IUser): void {
    console.log(`Loan request for ${user.getName()} is sent`);
  }
}
