import { describe, expect, it } from "vitest";
import { goalCreateSchema, goalIdSchema, goalUpdateSchema } from "./goal";

const valid = { title: "Finish thesis draft", targetDate: "2026-12-15" };

describe("goalCreateSchema", () => {
  it("accepts a title and an ISO date, returning a Date", () => {
    const goal = goalCreateSchema.parse(valid);
    expect(goal.title).toBe("Finish thesis draft");
    expect(goal.targetDate).toBeInstanceOf(Date);
    expect(goal.targetDate.toISOString()).toBe("2026-12-15T00:00:00.000Z");
  });

  it("accepts an ISO datetime and a Date object", () => {
    expect(goalCreateSchema.parse({ ...valid, targetDate: "2026-12-15T09:30:00Z" }).targetDate.toISOString()).toBe(
      "2026-12-15T09:30:00.000Z",
    );
    const date = new Date("2026-12-15T00:00:00Z");
    expect(goalCreateSchema.parse({ ...valid, targetDate: date }).targetDate).toEqual(date);
  });

  it("trims the title", () => {
    expect(goalCreateSchema.parse({ ...valid, title: "  Apply to jobs  " }).title).toBe("Apply to jobs");
  });

  it.each([undefined, "", "   "])("rejects a missing or blank title (%j)", (title) => {
    expect(goalCreateSchema.safeParse({ ...valid, title }).success).toBe(false);
  });

  it("rejects a title over 200 characters", () => {
    expect(goalCreateSchema.safeParse({ ...valid, title: "x".repeat(201) }).success).toBe(false);
  });

  it.each([undefined, "", "not a date", "2026-13-40", null, 0])("rejects an invalid target date (%j)", (targetDate) => {
    expect(goalCreateSchema.safeParse({ ...valid, targetDate }).success).toBe(false);
  });

  it("makes description optional, turns blank into null and caps it at 2000 characters", () => {
    expect(goalCreateSchema.parse(valid).description).toBeUndefined();
    expect(goalCreateSchema.parse({ ...valid, description: "  " }).description).toBeNull();
    expect(goalCreateSchema.parse({ ...valid, description: " notes " }).description).toBe("notes");
    expect(goalCreateSchema.safeParse({ ...valid, description: "x".repeat(2001) }).success).toBe(false);
  });

  it("accepts progress as an integer from 0 to 100", () => {
    expect(goalCreateSchema.parse({ ...valid, progress: 0 }).progress).toBe(0);
    expect(goalCreateSchema.parse({ ...valid, progress: 100 }).progress).toBe(100);
  });

  it.each([-1, 101, 12.5, "50"])("rejects invalid progress (%j)", (progress) => {
    expect(goalCreateSchema.safeParse({ ...valid, progress }).success).toBe(false);
  });

  it("accepts only known statuses", () => {
    for (const status of ["not_started", "in_progress", "done"]) {
      expect(goalCreateSchema.parse({ ...valid, status }).status).toBe(status);
    }
    expect(goalCreateSchema.safeParse({ ...valid, status: "archived" }).success).toBe(false);
  });

  it("strips unknown keys such as ownerId", () => {
    const goal = goalCreateSchema.parse({ ...valid, ownerId: "someone-else", id: "x" });
    expect(goal).not.toHaveProperty("ownerId");
    expect(goal).not.toHaveProperty("id");
  });
});

describe("goalUpdateSchema", () => {
  it("accepts a single field", () => {
    expect(goalUpdateSchema.parse({ progress: 40 })).toEqual({ progress: 40 });
  });

  it("validates the fields it is given", () => {
    expect(goalUpdateSchema.safeParse({ title: " " }).success).toBe(false);
    expect(goalUpdateSchema.safeParse({ targetDate: "nope" }).success).toBe(false);
  });

  it("allows clearing the description with null", () => {
    expect(goalUpdateSchema.parse({ description: null })).toEqual({ description: null });
  });

  it("rejects an empty update, including one with only unknown keys", () => {
    expect(goalUpdateSchema.safeParse({}).success).toBe(false);
    expect(goalUpdateSchema.safeParse({ ownerId: "x" }).success).toBe(false);
  });
});

describe("goalIdSchema", () => {
  it("accepts a cuid and rejects anything else", () => {
    expect(goalIdSchema.safeParse("cjld2cjxh0000qzrmn831i7rn").success).toBe(true);
    expect(goalIdSchema.safeParse("1; drop table").success).toBe(false);
    expect(goalIdSchema.safeParse("").success).toBe(false);
  });
});
