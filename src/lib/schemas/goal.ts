import { z } from "zod";

export const GOAL_STATUSES = ["not_started", "in_progress", "done"] as const;
export type GoalStatus = (typeof GOAL_STATUSES)[number];

const title = z.string().trim().min(1, "Title is required").max(200);

// Accepts a Date, an ISO date ("2026-12-15") or an ISO datetime with offset.
// No coercion: null, numbers and free-form strings are rejected.
const targetDate = z
  .union([z.date(), z.iso.date(), z.iso.datetime({ offset: true })])
  .transform((value) => (value instanceof Date ? value : new Date(value)))
  .pipe(z.date({ error: "Target date must be a valid date" }));

// Blank descriptions are stored as null.
const description = z
  .string()
  .trim()
  .max(2000)
  .transform((value) => (value === "" ? null : value))
  .nullable();

const progress = z.number().int().min(0).max(100);
const status = z.enum(GOAL_STATUSES);

/** Input for creating a goal. Unknown keys (e.g. ownerId) are stripped. */
export const goalCreateSchema = z.object({
  title,
  targetDate,
  description: description.optional(),
  progress: progress.optional(),
  status: status.optional(),
});

/** Partial update; at least one known field must be present. */
export const goalUpdateSchema = goalCreateSchema
  .partial()
  .refine((value) => Object.keys(value).length > 0, { message: "Nothing to update" });

export const goalIdSchema = z.cuid();

export type GoalCreateInput = z.input<typeof goalCreateSchema>;
export type GoalCreate = z.output<typeof goalCreateSchema>;
export type GoalUpdateInput = z.input<typeof goalUpdateSchema>;
export type GoalUpdate = z.output<typeof goalUpdateSchema>;
