import type { Attribution } from "../domain/catalog.ts";

export type RawJson =
  | { readonly kind: "parsed"; readonly value: unknown }
  | { readonly kind: "invalid"; readonly reason: string };

export interface RawChallenge {
  readonly directoryName: string;
  readonly location: string;
  readonly metadataLocation: string;
  readonly metadata: RawJson;
  /** Paths relative to the challenge directory, with `/` separators. */
  readonly files: readonly string[];
}

export interface RawSchedule {
  readonly fileName: string;
  readonly location: string;
  readonly content: RawJson;
}

/** Port through which the catalog use case reads challenges, schedules and attribution. */
export interface CatalogSource {
  listChallenges(): Promise<readonly RawChallenge[]>;
  listSchedules(): Promise<readonly RawSchedule[]>;
  readAttribution(): Promise<Attribution>;
}
