import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { FsCatalogSource } from "./fs-catalog-source.ts";

let rootDir: string;

async function writeRepoFile(relativePath: string, content: string): Promise<void> {
  const filePath = path.join(rootDir, relativePath);
  await mkdir(path.dirname(filePath), { recursive: true });
  await writeFile(filePath, content);
}

beforeEach(async () => {
  rootDir = await mkdtemp(path.join(tmpdir(), "algostreak-catalog-"));
});

afterEach(async () => {
  await rm(rootDir, { recursive: true, force: true });
});

describe("FsCatalogSource", () => {
  it("returns empty results when the catalog directories do not exist", async () => {
    const source = new FsCatalogSource(rootDir);
    await expect(source.listChallenges()).resolves.toEqual([]);
    await expect(source.listSchedules()).resolves.toEqual([]);
    await expect(source.readAttribution()).resolves.toBeUndefined();
  });

  it("lists challenge directories with nested files and parsed metadata", async () => {
    await writeRepoFile("challenges/two-sum/metadata.json", '{"id":"two-sum"}');
    await writeRepoFile("challenges/two-sum/starter/solution.ts", "export {};");
    await writeRepoFile("challenges/README.md", "# Challenges");

    const challenges = await new FsCatalogSource(rootDir).listChallenges();

    expect(challenges).toEqual([
      {
        directoryName: "two-sum",
        metadata: { kind: "parsed", value: { id: "two-sum" } },
        files: ["metadata.json", "starter/solution.ts"],
      },
    ]);
  });

  it("reports missing and malformed JSON instead of throwing", async () => {
    await writeRepoFile("challenges/no-metadata/statement.md", "# Task");
    await writeRepoFile("schedule/2026.json", "[{");

    const source = new FsCatalogSource(rootDir);
    const [challenges, schedules] = await Promise.all([source.listChallenges(), source.listSchedules()]);

    expect(challenges[0]?.metadata).toEqual({ kind: "invalid", reason: "file is missing" });
    expect(schedules[0]?.fileName).toBe("2026.json");
    expect(schedules[0]?.content.kind).toBe("invalid");
  });

  it("reads only .json files from the schedule directory", async () => {
    await writeRepoFile("schedule/2026.json", "[]");
    await writeRepoFile("schedule/notes.md", "draft");

    const schedules = await new FsCatalogSource(rootDir).listSchedules();

    expect(schedules).toEqual([{ fileName: "2026.json", content: { kind: "parsed", value: [] } }]);
  });

  it("reads ATTRIBUTION.md", async () => {
    await writeRepoFile("ATTRIBUTION.md", "# Attribution");
    await expect(new FsCatalogSource(rootDir).readAttribution()).resolves.toBe("# Attribution");
  });
});
