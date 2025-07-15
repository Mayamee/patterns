import fs from "node:fs/promises";
import path from "node:path";
import axios, { AxiosInstance } from "axios";
import { mkdirp } from "mkdirp";

const FILES_PATH = path.join(process.cwd(), "files");

mkdirp(FILES_PATH);

interface IFileState {
  load(): Promise<void>;
  save(): Promise<void>;
}

interface IFileStateCtx {
  setState(state: IFileState): void;
  getConfig(): Config;
  setFile(file: Blob): void;
  getFile(): Blob | null;
}

type Config = {
  url: string;
  basePath: string;
};

class File implements IFileStateCtx, IFileState {
  private state: IFileState;

  private file: Blob | null = null;

  constructor(
    private readonly _config: Config,
    private readonly _httpClient: AxiosInstance,
    private readonly _fs: typeof fs = fs
  ) {
    this.state = new IdleFile(this, this._httpClient);
  }

  public load() {
    return this.state.load();
  }

  public save() {
    return this.state.save();
  }

  public getConfig() {
    return this._config;
  }

  public getState() {
    return this.state;
  }

  public setState(state: IFileState) {
    this.state = state;
  }

  public getFile(): Blob | null {
    return this.file;
  }

  public setFile(file: Blob): void {
    this.file = file;
  }
}

class IdleFile implements IFileState {
  constructor(
    private readonly ctx: IFileStateCtx,
    private readonly _httpClient: AxiosInstance
  ) {}

  public async load() {
    const loadingState = new LoadingFile(this.ctx, this._httpClient);
    this.ctx.setState(loadingState);

    return loadingState.load();
  }
  public async save() {
    return await Promise.reject("File is Idle, please run load before saving");
  }
}

class LoadingFile implements IFileState {
  private isLoading: boolean = false;

  constructor(
    private readonly ctx: IFileStateCtx,
    private readonly _httpClient: AxiosInstance
  ) {}

  public async load() {
    if (this.isLoading) {
      console.log("File is already loading, wait for it to finish");

      return;
    }

    this.isLoading = true;

    const config = this.ctx.getConfig();

    try {
      const response = await this._httpClient.get<ArrayBuffer>(config.url, {
        responseType: "arraybuffer",
        headers: {
          "Content-Type": "application/json",
        },
      });

      this.ctx.setFile(
        new Blob([response.data], {
          type: "application/json",
        })
      );

      this.ctx.setState(new LoadedFile(this.ctx));
    } catch (error) {
      console.error(error);

      this.ctx.setState(new LoadingErrorFile(this.ctx, this._httpClient));
    }
  }

  public async save() {
    return await Promise.reject(
      "File is loading, please wait until loading finishes"
    );
  }
}

class LoadingErrorFile implements IFileState {
  constructor(
    private readonly ctx: IFileStateCtx,
    private readonly _httpClient: AxiosInstance
  ) {}

  public async load() {
    const loadingState = new LoadingFile(this.ctx, this._httpClient);

    this.ctx.setState(loadingState);

    return loadingState.load();
  }

  public async save() {
    return await Promise.reject(
      "File is loading, please wait until loading finishes"
    );
  }
}

class LoadedFile implements IFileState {
  constructor(private readonly ctx: IFileStateCtx) {}

  public async load() {
    return await Promise.reject(
      "File is already loaded, please run save if you want to save it"
    );
  }

  public async save() {
    const saveState = new SavingFile(this.ctx);

    this.ctx.setState(saveState);

    return saveState.save();
  }
}

class SavingFile implements IFileState {
  constructor(
    private readonly ctx: IFileStateCtx,
    private readonly _fs: typeof fs = fs
  ) {}

  private isSaving: boolean = false;

  public async load() {
    return await Promise.reject("File is loaded");
  }

  public async save() {
    if (this.isSaving) {
      console.log("File is already saving, wait for it to finish");

      return;
    }



    this.isSaving = true;

    const config = this.ctx.getConfig();

    try {
      const savedFileBlob = this.ctx.getFile();

      if (!savedFileBlob) {
        throw new Error("Inconsistent state change");
      }

      const contentToSave = Buffer.from(await savedFileBlob.arrayBuffer());

      await this._fs.writeFile(
        path.join(FILES_PATH, config.basePath),
        contentToSave
      );

      this.ctx.setState(new SavedFile());
    } catch (error) {
      console.error(error);

      this.ctx.setState(new SavingErrorFile(this.ctx, this._fs));
    }
  }
}

class SavingErrorFile implements IFileState {
  constructor(
    private readonly ctx: IFileStateCtx,
    private readonly _fs: typeof fs = fs
  ) {}

  public async load() {
    return await Promise.reject("File is already loaded");
  }

  public async save() {
    const saveState = new SavingFile(this.ctx, this._fs);
    this.ctx.setState(saveState);
    return saveState.save();
  }
}

class SavedFile implements IFileState {
  constructor() {}

  public async load() {
    return await Promise.reject("File is already loaded");
  }

  public async save() {
    return await Promise.reject("File is already saved");
  }
}

const httpClient = axios.create();

const file = new File(
  {
    url: "https://jsonplaceholder.typicode.com/posts/1",
    basePath: "test.json",
  },
  httpClient,
  fs
);

(async () => {
  try {
    await Promise.all([file.load(), file.load()]);
    await file.save();
  } catch (error) {
    console.error(error);
  }
})();
