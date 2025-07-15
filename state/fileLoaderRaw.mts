import fs from "node:fs/promises";
import path from "node:path";
import axios, { AxiosInstance } from "axios";
import { mkdirp } from "mkdirp";
const httpClient = axios.create();

const FILES_PATH = path.join(process.cwd(), "files");

mkdirp(FILES_PATH);
