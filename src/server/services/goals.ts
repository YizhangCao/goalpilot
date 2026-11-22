import "server-only";
import { z } from "zod";
import type { Goal } from "@/generated/prisma/client";
import { goalCreateSchema, goalIdSchema, goalUpdateSchema } from "@/lib/schemas/goal";
import { db } from "@/server/db";

export type { Goal };

// Every function takes the owner explicitly and scopes its query by it.
// A goal owned by someone else is indistinguishable from a missing one.
const ownerIdSchema = z.string().min(1);

export async function listGoals(ownerId: string): Promise<Goal[]> {
  const owner = ownerIdSchema.parse(ownerId);
  return db.goal.findMany({
    where: { ownerId: owner },
    orderBy: [{ targetDate: "asc" }, { createdAt: "asc" }],
  });
}

export async function createGoal(ownerId: string, input: unknown): Promise<Goal> {
  const owner = ownerIdSchema.parse(ownerId);
  const data = goalCreateSchema.parse(input);
  return db.goal.create({ data: { ...data, ownerId: owner } });
}

/** Returns the updated goal, or null if it doesn't exist for this owner. */
export async function updateGoal(ownerId: string, id: string, input: unknown): Promise<Goal | null> {
  const owner = ownerIdSchema.parse(ownerId);
  const data = goalUpdateSchema.parse(input);
  const goalId = goalIdSchema.safeParse(id);
  if (!goalId.success) return null;

  const { count } = await db.goal.updateMany({ where: { id: goalId.data, ownerId: owner }, data });
  if (count === 0) return null;
  return db.goal.findFirst({ where: { id: goalId.data, ownerId: owner } });
}

/** Returns true if a goal was deleted for this owner. */
export async function deleteGoal(ownerId: string, id: string): Promise<boolean> {
  const owner = ownerIdSchema.parse(ownerId);
  const goalId = goalIdSchema.safeParse(id);
  if (!goalId.success) return false;

  const { count } = await db.goal.deleteMany({ where: { id: goalId.data, ownerId: owner } });
  return count > 0;
}
