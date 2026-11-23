import { describe, expect, it } from "vitest";
import {
  checkAttribution,
  checkChallenge,
  checkSchedules,
  type Attribution,
  type Challenge,
  type ChallengeMetadata,
  type Schedule,
} from "./catalog.ts";

const ALL_REQUIRED_FILES = ["statement.md", "public.test.js", "stress.test.js", "starter/solution.js"];

function makeChallenge(
  overrides: Partial<ChallengeMetadata> = {},
  files: readonly string[] = ALL_REQUIRED_FILES,
): Challenge {
  const metadata: ChallengeMetadata = {
    id: "two-sum",
    title: "Two Sum",
    difficulty: "easy",
    topics: ["arrays", "hash-map"],
    timeLimitMs: 500,
    stressSize: 100_000,
    source: "exercism",
    sourceUrl: "https://github.com/exercism/problem-specifications/tree/main/exercises/two-sum",
    license: "MIT",
    ...overrides,
  };
  return { directoryName: metadata.id, location: `challenges/${metadata.id}`, metadata, files: new Set(files) };
}

function makeSchedule(fileName: string, entries: Schedule["entries"]): Schedule {
  return { fileName, location: `schedule/${fileName}`, year: Number(fileName.slice(0, 4)), entries };
}

function attributionOf(text: string | undefined): Attribution {
  return { location: "ATTRIBUTION.md", text };
}

describe("checkChallenge", () => {
  it("accepts a complete challenge", () => {
    expect(checkChallenge(makeChallenge())).toEqual([]);
  });

  it("rejects metadata id that differs from the directory name", () => {
    const challenge = { ...makeChallenge(), directoryName: "two-sum-v2", location: "challenges/two-sum-v2" };
    expect(checkChallenge(challenge)).toEqual([
      { path: "challenges/two-sum-v2", message: 'metadata id "two-sum" does not match the directory name' },
    ]);
  });

  it("reports every missing required file", () => {
    const issues = checkChallenge(makeChallenge({}, ["statement.md"]));
    expect(issues.map((issue) => issue.message)).toEqual([
      "missing public.test.js",
      "missing stress.test.js",
      "missing starter/solution.js",
    ]);
  });

  it("requires a LICENSE file for CC-BY-NC-SA-4.0 tasks", () => {
    const issues = checkChallenge(makeChallenge({ license: "CC-BY-NC-SA-4.0" }));
    expect(issues).toEqual([
      { path: "challenges/two-sum", message: "CC-BY-NC-SA-4.0 task must ship its own LICENSE file" },
    ]);
  });

  it("accepts a CC-BY-NC-SA-4.0 task that ships its LICENSE", () => {
    const challenge = makeChallenge({ license: "CC-BY-NC-SA-4.0" }, [...ALL_REQUIRED_FILES, "LICENSE"]);
    expect(checkChallenge(challenge)).toEqual([]);
  });
});

describe("checkAttribution", () => {
  it("requires borrowed tasks to be listed by source URL", () => {
    const challenge = makeChallenge();
    expect(checkAttribution([challenge], attributionOf("# Attribution\n"))).toEqual([
      {
        path: "ATTRIBUTION.md",
        message: `missing attribution for "two-sum" (${challenge.metadata.sourceUrl})`,
      },
    ]);
  });

  it("accepts a borrowed task whose source URL is listed", () => {
    const challenge = makeChallenge();
    const table = `| two-sum | ${challenge.metadata.sourceUrl} | MIT |`;
    expect(checkAttribution([challenge], attributionOf(table))).toEqual([]);
  });

  it("does not accept a longer URL that merely starts with the source URL", () => {
    const challenge = makeChallenge({ sourceUrl: "https://example.com/exercises/two-fer" });
    const table = "| two-fer-advanced | https://example.com/exercises/two-fer-advanced | MIT |";
    expect(checkAttribution([challenge], attributionOf(table))).toHaveLength(1);
  });

  it("does not require attribution for authored tasks, even without ATTRIBUTION.md", () => {
    expect(checkAttribution([makeChallenge({ source: "original" })], attributionOf(undefined))).toEqual([]);
  });
});

describe("checkSchedules", () => {
  const challenges = [makeChallenge(), makeChallenge({ id: "word-ladder", difficulty: "hard" })];

  it("accepts known junior-level challenges on valid dates", () => {
    const schedule = makeSchedule("2026.json", [
      { date: "2026-12-01", challengeId: "two-sum" },
      { date: "2026-12-02", challengeId: "two-sum" },
    ]);
    expect(checkSchedules([schedule], challenges)).toEqual([]);
  });

  it("rejects an unknown challenge id", () => {
    const schedule = makeSchedule("2026.json", [{ date: "2026-12-01", challengeId: "missing" }]);
    expect(checkSchedules([schedule], challenges)).toEqual([
      { path: "schedule/2026.json", message: '2026-12-01: unknown or invalid challenge "missing"' },
    ]);
  });

  it("rejects hard challenges in the MVP 0 schedule", () => {
    const schedule = makeSchedule("2026.json", [{ date: "2026-12-01", challengeId: "word-ladder" }]);
    expect(checkSchedules([schedule], challenges)).toEqual([
      {
        path: "schedule/2026.json",
        message: '2026-12-01: "word-ladder" is hard, MVP 0 allows junior-level tasks only',
      },
    ]);
  });

  it("rejects a date scheduled twice, including across files", () => {
    const first = makeSchedule("2026.json", [{ date: "2026-12-01", challengeId: "two-sum" }]);
    const second = makeSchedule("2027.json", [{ date: "2026-12-01", challengeId: "two-sum" }]);
    const issues = checkSchedules([first, second], challenges);
    expect(issues).toContainEqual({
      path: "schedule/2027.json",
      message: "2026-12-01 is already scheduled in schedule/2026.json",
    });
  });

  it("rejects a date outside the file's year", () => {
    const schedule = makeSchedule("2026.json", [{ date: "2027-01-01", challengeId: "two-sum" }]);
    expect(checkSchedules([schedule], challenges)).toEqual([
      { path: "schedule/2026.json", message: "2027-01-01 does not belong to 2026" },
    ]);
  });

  it.each(["2026-02-30", "2026-13-01", "26-12-01", "2026-12-1"])("rejects invalid date %s", (date) => {
    const schedule = makeSchedule("2026.json", [{ date, challengeId: "two-sum" }]);
    expect(checkSchedules([schedule], challenges)).toEqual([
      { path: "schedule/2026.json", message: `${date} is not a valid YYYY-MM-DD date` },
    ]);
  });
});
