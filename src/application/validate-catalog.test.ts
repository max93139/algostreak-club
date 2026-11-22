import { describe, expect, it } from "vitest";
import type { CatalogSource, RawChallenge, RawSchedule } from "./catalog-source.ts";
import { validateCatalog } from "./validate-catalog.ts";

const SOURCE_URL = "https://github.com/exercism/problem-specifications/tree/main/exercises/two-sum";

const validMetadata = {
  id: "two-sum",
  title: "Two Sum",
  difficulty: "easy",
  topics: ["arrays"],
  timeLimitMs: 500,
  stressSize: 100_000,
  source: "exercism",
  sourceUrl: SOURCE_URL,
  license: "MIT",
};

const validChallenge: RawChallenge = {
  directoryName: "two-sum",
  location: "challenges/two-sum",
  metadataLocation: "challenges/two-sum/metadata.json",
  metadata: { kind: "parsed", value: validMetadata },
  files: ["statement.md", "public.test.ts", "stress.test.ts", "starter/solution.ts"],
};

function inMemorySource(
  challenges: readonly RawChallenge[],
  schedules: readonly RawSchedule[] = [],
  attribution: string | undefined = `- ${SOURCE_URL}`,
): CatalogSource {
  return {
    listChallenges: () => Promise.resolve(challenges),
    listSchedules: () => Promise.resolve(schedules),
    readAttribution: () => Promise.resolve({ location: "ATTRIBUTION.md", text: attribution }),
  };
}

describe("validateCatalog", () => {
  it("returns no issues for a valid catalog", async () => {
    const schedule: RawSchedule = {
      fileName: "2026.json",
      location: "schedule/2026.json",
      content: { kind: "parsed", value: [{ date: "2026-12-01", challengeId: "two-sum" }] },
    };
    await expect(validateCatalog(inMemorySource([validChallenge], [schedule]))).resolves.toEqual([]);
  });

  it("returns no issues for an empty catalog", async () => {
    await expect(validateCatalog(inMemorySource([], [], undefined))).resolves.toEqual([]);
  });

  it.each(["source", "sourceUrl", "license"])("rejects metadata with empty %s", async (field) => {
    const challenge: RawChallenge = {
      ...validChallenge,
      metadata: { kind: "parsed", value: { ...validMetadata, [field]: "" } },
    };
    const issues = await validateCatalog(inMemorySource([challenge]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("challenges/two-sum/metadata.json");
    expect(issues[0]?.message).toMatch(new RegExp(`^${field}: `));
  });

  it("reports unreadable metadata", async () => {
    const challenge: RawChallenge = {
      ...validChallenge,
      metadata: { kind: "invalid", reason: "file is missing" },
    };
    await expect(validateCatalog(inMemorySource([challenge]))).resolves.toEqual([
      { path: "challenges/two-sum/metadata.json", message: "file is missing" },
    ]);
  });

  it("rejects a schedule file not named after a year", async () => {
    const schedule: RawSchedule = { fileName: "december.json", location: "schedule/december.json", content: { kind: "parsed", value: [] } };
    await expect(validateCatalog(inMemorySource([], [schedule]))).resolves.toEqual([
      { path: "schedule/december.json", message: "schedule file must be named <YYYY>.json" },
    ]);
  });

  it("rejects a schedule that is not an array of entries", async () => {
    const schedule: RawSchedule = {
      fileName: "2026.json",
      location: "schedule/2026.json",
      content: { kind: "parsed", value: { "2026-12-01": "two-sum" } },
    };
    const issues = await validateCatalog(inMemorySource([], [schedule]));
    expect(issues).toHaveLength(1);
    expect(issues[0]?.path).toBe("schedule/2026.json");
  });

  it("reports a schedule entry that points to a challenge with invalid metadata", async () => {
    const challenge: RawChallenge = {
      ...validChallenge,
      metadata: { kind: "parsed", value: { ...validMetadata, difficulty: "expert" } },
    };
    const schedule: RawSchedule = {
      fileName: "2026.json",
      location: "schedule/2026.json",
      content: { kind: "parsed", value: [{ date: "2026-12-01", challengeId: "two-sum" }] },
    };
    const issues = await validateCatalog(inMemorySource([challenge], [schedule]));
    expect(issues.map((issue) => issue.path)).toEqual(["challenges/two-sum/metadata.json", "schedule/2026.json"]);
  });
});
