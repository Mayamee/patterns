type AuthCtx = {
  username: string;
  password: string;
};

type AuthResponse = {
  token: string;
};

class MudAuthService {
  // 🤢 Много условий, много ответственности, постоянно приходится возвращаться к этому методу
  // и добавлять новые условия, что приводит к его разрастанию и усложнению
  public auth(authCtx: AuthCtx, type: string) {
    if (type === "facebook") {
      console.log("facebook auth", { authCtx });
      // more code here...
    } else if (type === "google") {
      console.log("google auth", { authCtx });
      // more code here...
    } else if (type === "twitter") {
      console.log("twitter auth", { authCtx });
      // more code here...
    } else {
      console.log("default auth", { authCtx });
      // more code here...
    }
  }
}

interface IAuthStrategy {
  auth(authCtx: AuthCtx): AuthResponse;
  logout: () => void;
}

class FacebookAuthStrategy implements IAuthStrategy {
  public auth(authCtx: AuthCtx) {
    console.log("facebook auth", { authCtx });
    // more code here...

    return { token: "facebook_token" };
  }

  public logout() {
    console.log("facebook logout");
  }
}

class GoogleAuthStrategy implements IAuthStrategy {
  public auth(authCtx: AuthCtx) {
    console.log("google auth", { authCtx });
    // more code here...

    return { token: "google_token" };
  }

  public logout() {
    console.log("google logout");
  }
}

class TwitterAuthStrategy implements IAuthStrategy {
  public auth(authCtx: AuthCtx) {
    console.log("twitter auth", { authCtx });
    // more code here...

    return { token: "twitter_token" };
  }

  public logout() {
    console.log("twitter logout");
  }
}

class DefaultAuthStrategy implements IAuthStrategy {
  public auth(authCtx: AuthCtx) {
    console.log("default auth", { authCtx });
    // more code here...

    return {
      token: "default_token",
    };
  }

  public logout() {
    console.log("default logout");
  }
}

// "Стратегия" это не обязательно класс
// Можно использовать функцию или объект
type LogStrategy = (message: string) => void;

const logToConsole: LogStrategy = (message) => {
  console.log(message);
};

const logToFile: LogStrategy = (message) => {
  console.log("log to file", { message });
};

const logToHttp: LogStrategy = (message) => {
  console.log("log to http", { message });
};

class AuthService {
  private authStrategy: IAuthStrategy;
  private logStrategy: LogStrategy;

  constructor(authStrategy: IAuthStrategy, logStrategy: LogStrategy) {
    this.authStrategy = authStrategy;
    this.logStrategy = logStrategy;
  }

  // 👍 Можно менять стратегию на ходу
  public changeAuthStrategy(authStrategy: IAuthStrategy) {
    this.authStrategy = authStrategy;
  }

  public changeLogStrategy(logStrategy: LogStrategy) {
    this.logStrategy = logStrategy;
  }

  // Вся логика делегируется внешнему алгоритму, при этом ему доступен контекст вызова,
  // из объекта вся вариативная логика уходит и делегируется специальной сущности "Стратегия"
  public auth(authCtx: AuthCtx) {
    const authRes = this.authStrategy.auth(authCtx);

    this.logStrategy(
      `User ${authCtx.username} logged in and obtained token: ${authRes.token}`
    );
  }

  public logout() {
    this.authStrategy.logout();

    this.logStrategy("User logged out");
  }
}
