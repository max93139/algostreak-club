export const Difficulty = { Easy: "easy", Medium: "medium", Hard: "hard" } as const;
export type Difficulty = (typeof Difficulty)[keyof typeof Difficulty];

/** `source` value for tasks written by the club; they need no attribution. */
export const AUTHORED_SOURCE = "original";

/** License that must ship with its own LICENSE file because ShareAlike forbids relicensing under MIT. */
export const NON_COMMERCIAL_LICENSE = "CC-BY-NC-SA-4.0";

export const CHALLENGE_LICENSE_FILE = "LICENSE";

export const REQUIRED_CHALLENGE_FILES = [
  "statement.md",
  "public.test.ts",
  "stress.test.ts",
  "starter/solution.ts",
] as const;

/** MVP 0 runs junior-level tasks only. */
export const MVP0_ALLOWED_DIFFICULTIES: ReadonlySet<Difficulty> = new Set([
  Difficulty.Easy,
  Difficulty.Medium,
]);

export interface ChallengeMetadata {
  readonly id: string;
  readonly title: string;
  readonly difficulty: Difficulty;
  readonly topics: readonly string[];
  readonly timeLimitMs: number;
  readonly stressSize: number;
  readonly source: string;
  readonly sourceUrl: string;
  readonly license: string;
}

export interface Challenge {
  readonly directoryName: string;
  readonly metadata: ChallengeMetadata;
  /** Paths relative to the challenge directory, with `/` separators. */
  readonly files: ReadonlySet<string>;
}

export interface ScheduleEntry {
  readonly date: string;
  readonly challengeId: string;
}

export interface Schedule {
  readonly fileName: string;
  readonly year: number;
  readonly entries: readonly ScheduleEntry[];
}

export interface Issue {
  readonly path: string;
  readonly message: string;
}

const CALENDAR_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

/** Checks the rules a single challenge directory must satisfy on its own. */
export function checkChallenge(challenge: Challenge): Issue[] {
  const path = `challenges/${challenge.directoryName}`;
  const { metadata, files } = challenge;
  const issues: Issue[] = [];

  if (metadata.id !== challenge.directoryName) {
    issues.push({ path, message: `metadata id "${metadata.id}" does not match the directory name` });
  }
  for (const file of REQUIRED_CHALLENGE_FILES) {
    if (!files.has(file)) {
      issues.push({ path, message: `missing ${file}` });
    }
  }
  if (metadata.license === NON_COMMERCIAL_LICENSE && !files.has(CHALLENGE_LICENSE_FILE)) {
    issues.push({ path, message: `${NON_COMMERCIAL_LICENSE} task must ship its own ${CHALLENGE_LICENSE_FILE} file` });
  }
  return issues;
}

/** Checks that every borrowed task is listed in ATTRIBUTION.md by its source URL. */
export function checkAttribution(challenges: readonly Challenge[], attribution: string | undefined): Issue[] {
  const text = attribution ?? "";
  return challenges
    .filter(({ metadata }) => metadata.source !== AUTHORED_SOURCE && !text.includes(metadata.sourceUrl))
    .map(({ metadata }) => ({
      path: "ATTRIBUTION.md",
      message: `missing attribution for "${metadata.id}" (${metadata.sourceUrl})`,
    }));
}

/** Checks dates, references and difficulty across all schedule files. */
export function checkSchedules(schedules: readonly Schedule[], challenges: readonly Challenge[]): Issue[] {
  const metadataById = new Map(challenges.map(({ metadata }) => [metadata.id, metadata]));
  const scheduledIn = new Map<string, string>();
  const issues: Issue[] = [];

  for (const schedule of schedules) {
    const path = `schedule/${schedule.fileName}`;
    for (const entry of schedule.entries) {
      issues.push(...checkScheduleEntry(entry, schedule.year, path, metadataById));
      const previousFile = scheduledIn.get(entry.date);
      if (previousFile === undefined) {
        scheduledIn.set(entry.date, schedule.fileName);
      } else {
        issues.push({ path, message: `${entry.date} is already scheduled in schedule/${previousFile}` });
      }
    }
  }
  return issues;
}

function checkScheduleEntry(
  entry: ScheduleEntry,
  year: number,
  path: string,
  metadataById: ReadonlyMap<string, ChallengeMetadata>,
): Issue[] {
  const issues: Issue[] = [];
  if (!isCalendarDate(entry.date)) {
    issues.push({ path, message: `${entry.date} is not a valid YYYY-MM-DD date` });
  } else if (!entry.date.startsWith(`${String(year)}-`)) {
    issues.push({ path, message: `${entry.date} does not belong to ${String(year)}` });
  }

  const metadata = metadataById.get(entry.challengeId);
  if (metadata === undefined) {
    issues.push({ path, message: `${entry.date}: unknown or invalid challenge "${entry.challengeId}"` });
  } else if (!MVP0_ALLOWED_DIFFICULTIES.has(metadata.difficulty)) {
    issues.push({ path, message: `${entry.date}: "${entry.challengeId}" is ${metadata.difficulty}, MVP 0 allows junior-level tasks only` });
  }
  return issues;
}

/** Rejects shape-valid but impossible dates such as 2026-02-30 by round-tripping through UTC. */
function isCalendarDate(value: string): boolean {
  if (!CALENDAR_DATE_PATTERN.test(value)) {
    return false;
  }
  const timestamp = Date.parse(`${value}T00:00:00Z`);
  return !Number.isNaN(timestamp) && new Date(timestamp).toISOString().slice(0, value.length) === value;
}
