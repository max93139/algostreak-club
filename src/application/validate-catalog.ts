import type { z } from "zod";
import {
  checkAttribution,
  checkChallenge,
  checkSchedules,
  type Challenge,
  type Issue,
  type Schedule,
} from "../domain/catalog.ts";
import type { CatalogSource, RawChallenge, RawJson, RawSchedule } from "./catalog-source.ts";
import { metadataSchema, scheduleSchema } from "./schemas.ts";

const SCHEDULE_FILE_PATTERN = /^(\d{4})\.json$/;

type Parsed<T> = { readonly kind: "ok"; readonly value: T } | { readonly kind: "failed"; readonly issues: Issue[] };

/** Validates the whole challenge catalog and returns every problem found; an empty list means valid. */
export async function validateCatalog(source: CatalogSource): Promise<Issue[]> {
  const [rawChallenges, rawSchedules, attribution] = await Promise.all([
    source.listChallenges(),
    source.listSchedules(),
    source.readAttribution(),
  ]);

  const challenges = collect(rawChallenges.map(parseChallenge));
  const schedules = collect(rawSchedules.map(parseSchedule));

  return [
    ...challenges.issues,
    ...challenges.values.flatMap(checkChallenge),
    ...checkAttribution(challenges.values, attribution),
    ...schedules.issues,
    ...checkSchedules(schedules.values, challenges.values),
  ];
}

function collect<T>(results: readonly Parsed<T>[]): { values: T[]; issues: Issue[] } {
  const values: T[] = [];
  const issues: Issue[] = [];
  for (const result of results) {
    if (result.kind === "ok") {
      values.push(result.value);
    } else {
      issues.push(...result.issues);
    }
  }
  return { values, issues };
}

function parseChallenge(raw: RawChallenge): Parsed<Challenge> {
  const metadata = parseJson(raw.metadata, metadataSchema, raw.metadataLocation);
  if (metadata.kind === "failed") {
    return metadata;
  }
  return {
    kind: "ok",
    value: {
      directoryName: raw.directoryName,
      location: raw.location,
      metadata: metadata.value,
      files: new Set(raw.files),
    },
  };
}

function parseSchedule(raw: RawSchedule): Parsed<Schedule> {
  const path = raw.location;
  const year = SCHEDULE_FILE_PATTERN.exec(raw.fileName)?.[1];
  if (year === undefined) {
    return { kind: "failed", issues: [{ path, message: "schedule file must be named <YYYY>.json" }] };
  }
  const entries = parseJson(raw.content, scheduleSchema, path);
  if (entries.kind === "failed") {
    return entries;
  }
  return {
    kind: "ok",
    value: { fileName: raw.fileName, location: raw.location, year: Number(year), entries: entries.value },
  };
}

function parseJson<T>(raw: RawJson, schema: z.ZodType<T>, path: string): Parsed<T> {
  if (raw.kind === "invalid") {
    return { kind: "failed", issues: [{ path, message: raw.reason }] };
  }
  const result = schema.safeParse(raw.value);
  if (result.success) {
    return { kind: "ok", value: result.data };
  }
  return {
    kind: "failed",
    issues: result.error.issues.map((issue) => ({
      path,
      message: `${issue.path.map(String).join(".") || "(root)"}: ${issue.message}`,
    })),
  };
}
