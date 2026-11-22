import type { Dirent } from "node:fs";
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";
import type { CatalogSource, RawChallenge, RawJson, RawSchedule } from "../application/catalog-source.ts";

const CHALLENGES_DIR = "challenges";
const SCHEDULE_DIR = "schedule";
const METADATA_FILE = "metadata.json";
const ATTRIBUTION_FILE = "ATTRIBUTION.md";

/** Reads the catalog from the repository layout: challenges/<id>/, schedule/<YYYY>.json, ATTRIBUTION.md. */
export class FsCatalogSource implements CatalogSource {
  readonly #rootDir: string;

  constructor(rootDir: string) {
    this.#rootDir = rootDir;
  }

  async listChallenges(): Promise<readonly RawChallenge[]> {
    const challengesDir = path.join(this.#rootDir, CHALLENGES_DIR);
    const names = await listEntries(challengesDir, (entry) => entry.isDirectory());
    return Promise.all(names.map((name) => readChallenge(path.join(challengesDir, name), name)));
  }

  async listSchedules(): Promise<readonly RawSchedule[]> {
    const scheduleDir = path.join(this.#rootDir, SCHEDULE_DIR);
    const names = await listEntries(scheduleDir, (entry) => entry.isFile() && entry.name.endsWith(".json"));
    return Promise.all(
      names.map(async (fileName) => ({ fileName, content: await readJson(path.join(scheduleDir, fileName)) })),
    );
  }

  async readAttribution(): Promise<string | undefined> {
    try {
      return await readFile(path.join(this.#rootDir, ATTRIBUTION_FILE), "utf8");
    } catch (error) {
      if (isMissingFile(error)) {
        return undefined;
      }
      throw error;
    }
  }
}

async function readChallenge(challengeDir: string, directoryName: string): Promise<RawChallenge> {
  const [metadata, files] = await Promise.all([
    readJson(path.join(challengeDir, METADATA_FILE)),
    listFilesRecursive(challengeDir),
  ]);
  return { directoryName, metadata, files };
}

async function listEntries(dir: string, keep: (entry: Dirent) => boolean): Promise<string[]> {
  try {
    const entries = await readdir(dir, { withFileTypes: true });
    return entries.filter(keep).map((entry) => entry.name).sort();
  } catch (error) {
    if (isMissingFile(error)) {
      return [];
    }
    throw error;
  }
}

async function listFilesRecursive(dir: string): Promise<string[]> {
  const entries = await readdir(dir, { recursive: true, withFileTypes: true });
  return entries
    .filter((entry) => entry.isFile())
    .map((entry) => path.relative(dir, path.join(entry.parentPath, entry.name)).split(path.sep).join("/"))
    .sort();
}

async function readJson(filePath: string): Promise<RawJson> {
  let text: string;
  try {
    text = await readFile(filePath, "utf8");
  } catch (error) {
    if (isMissingFile(error)) {
      return { kind: "invalid", reason: "file is missing" };
    }
    throw error;
  }
  try {
    const value: unknown = JSON.parse(text);
    return { kind: "parsed", value };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { kind: "invalid", reason: `invalid JSON: ${reason}` };
  }
}

function isMissingFile(error: unknown): boolean {
  return error instanceof Error && "code" in error && error.code === "ENOENT";
}
