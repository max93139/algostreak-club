import { z } from "zod";
import { Difficulty } from "../domain/catalog.ts";

const challengeIdSchema = z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "must be kebab-case");
const nonEmptyText = z.string().trim().min(1);

export const metadataSchema = z.object({
  id: challengeIdSchema,
  title: nonEmptyText,
  difficulty: z.enum(Difficulty),
  topics: z.array(nonEmptyText).min(1),
  timeLimitMs: z.int().positive(),
  stressSize: z.int().positive(),
  source: nonEmptyText,
  sourceUrl: z.url(),
  license: nonEmptyText,
});

export const scheduleSchema = z.array(
  z.object({
    date: z.string(),
    challengeId: challengeIdSchema,
  }),
);
