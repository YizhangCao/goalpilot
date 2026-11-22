import { afterAll, beforeEach, describe, expect, it } from "vitest";
import { ZodError } from "zod";
import { db } from "@/server/db";
import { createGoal, deleteGoal, listGoals, updateGoal } from "./goals";

const ALICE = "owner-alice";
const BOB = "owner-bob";

beforeEach(async () => {
  await db.goal.deleteMany();
});

afterAll(async () => {
  await db.$disconnect();
});

describe("createGoal", () => {
  it("stores a goal for the owner with defaults", async () => {
    const goal = await createGoal(ALICE, { title: "  Ship MVP ", targetDate: "2026-12-20" });

    expect(goal).toMatchObject({
      ownerId: ALICE,
      title: "Ship MVP",
      description: null,
      progress: 0,
      status: "not_started",
    });
    expect(goal.targetDate.toISOString()).toBe("2026-12-20T00:00:00.000Z");
    expect(await db.goal.count()).toBe(1);
  });

  it("ignores an ownerId in the input", async () => {
    const goal = await createGoal(ALICE, {
      title: "Sneaky",
      targetDate: "2026-12-20",
      ownerId: BOB,
    } as never);
    expect(goal.ownerId).toBe(ALICE);
  });

  it("rejects invalid input without writing anything", async () => {
    await expect(createGoal(ALICE, { title: " ", targetDate: "2026-12-20" })).rejects.toBeInstanceOf(ZodError);
    await expect(createGoal(ALICE, { title: "Ok", targetDate: "soon" })).rejects.toBeInstanceOf(ZodError);
    expect(await db.goal.count()).toBe(0);
  });

  it("rejects an empty owner", async () => {
    await expect(createGoal("", { title: "Ok", targetDate: "2026-12-20" })).rejects.toThrow();
  });
});

describe("listGoals", () => {
  it("returns only the owner's goals, sorted by target date", async () => {
    await createGoal(ALICE, { title: "Later", targetDate: "2027-01-10" });
    await createGoal(ALICE, { title: "Sooner", targetDate: "2026-12-01" });
    await createGoal(BOB, { title: "Bob's", targetDate: "2026-11-30" });

    const goals = await listGoals(ALICE);
    expect(goals.map((g) => g.title)).toEqual(["Sooner", "Later"]);
  });

  it("returns an empty list for an owner with no goals", async () => {
    expect(await listGoals(BOB)).toEqual([]);
  });
});

describe("updateGoal", () => {
  it("updates the given fields and returns the goal", async () => {
    const goal = await createGoal(ALICE, { title: "Apply", targetDate: "2026-12-20" });

    const updated = await updateGoal(ALICE, goal.id, { progress: 60, status: "in_progress", description: "5 of 8" });

    expect(updated).toMatchObject({ id: goal.id, title: "Apply", progress: 60, status: "in_progress", description: "5 of 8" });
  });

  it("rejects invalid input", async () => {
    const goal = await createGoal(ALICE, { title: "Apply", targetDate: "2026-12-20" });
    await expect(updateGoal(ALICE, goal.id, { progress: 150 })).rejects.toBeInstanceOf(ZodError);
    await expect(updateGoal(ALICE, goal.id, {})).rejects.toBeInstanceOf(ZodError);
  });

  it("returns null for a missing goal", async () => {
    expect(await updateGoal(ALICE, "cjld2cjxh0000qzrmn831i7rn", { progress: 10 })).toBeNull();
  });

  it("does not let another owner update the goal", async () => {
    const goal = await createGoal(ALICE, { title: "Mine", targetDate: "2026-12-20" });

    expect(await updateGoal(BOB, goal.id, { title: "Hijacked" })).toBeNull();

    const row = await db.goal.findUniqueOrThrow({ where: { id: goal.id } });
    expect(row.title).toBe("Mine");
  });
});

describe("deleteGoal", () => {
  it("deletes the owner's goal", async () => {
    const goal = await createGoal(ALICE, { title: "Done with it", targetDate: "2026-12-20" });

    expect(await deleteGoal(ALICE, goal.id)).toBe(true);
    expect(await listGoals(ALICE)).toEqual([]);
  });

  it("returns false for a missing goal", async () => {
    expect(await deleteGoal(ALICE, "cjld2cjxh0000qzrmn831i7rn")).toBe(false);
  });

  it("does not let another owner delete the goal", async () => {
    const goal = await createGoal(ALICE, { title: "Mine", targetDate: "2026-12-20" });

    expect(await deleteGoal(BOB, goal.id)).toBe(false);
    expect(await db.goal.count()).toBe(1);
  });
});
