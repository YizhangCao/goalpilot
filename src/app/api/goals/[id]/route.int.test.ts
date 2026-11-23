import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { getCurrentOwnerId } from "@/server/auth";
import { createGoal } from "@/server/services/goals";
import { DELETE, PATCH } from "./route";

vi.mock("@/server/auth", () => ({ getCurrentOwnerId: vi.fn() }));
const asOwner = (id: string) => vi.mocked(getCurrentOwnerId).mockResolvedValue(id);

const ctx = (id: string) => ({ params: Promise.resolve({ id }) });
const MISSING_ID = "cjld2cjxh0000qzrmn831i7rn";

function patch(id: string, body: unknown) {
  return new Request(`http://localhost/api/goals/${id}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

function del(id: string) {
  return new Request(`http://localhost/api/goals/${id}`, { method: "DELETE" });
}

let goalId: string;

beforeEach(async () => {
  await db.goal.deleteMany();
  goalId = (await createGoal("alice", { title: "Apply to jobs", targetDate: "2026-12-20" })).id;
  asOwner("alice");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("PATCH /api/goals/[id]", () => {
  it("updates the owner's goal and returns 200", async () => {
    const res = await PATCH(patch(goalId, { progress: 50, status: "in_progress" }), ctx(goalId));

    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ id: goalId, progress: 50, status: "in_progress" });
  });

  it("returns 400 for invalid input", async () => {
    expect((await PATCH(patch(goalId, { progress: 101 }), ctx(goalId))).status).toBe(400);
    expect((await PATCH(patch(goalId, {}), ctx(goalId))).status).toBe(400);
    expect((await PATCH(patch(goalId, "{oops"), ctx(goalId))).status).toBe(400);
  });

  it("returns 400 for a malformed id", async () => {
    const res = await PATCH(patch("not-a-cuid!", { progress: 10 }), ctx("not-a-cuid!"));
    expect(res.status).toBe(400);
  });

  it("returns 404 for a missing goal", async () => {
    const res = await PATCH(patch(MISSING_ID, { progress: 10 }), ctx(MISSING_ID));
    expect(res.status).toBe(404);
  });

  it("returns 404 and changes nothing when another owner tries", async () => {
    asOwner("bob");

    const res = await PATCH(patch(goalId, { title: "Hijacked" }), ctx(goalId));

    expect(res.status).toBe(404);
    expect((await db.goal.findUniqueOrThrow({ where: { id: goalId } })).title).toBe("Apply to jobs");
  });
});

describe("DELETE /api/goals/[id]", () => {
  it("deletes the owner's goal and returns 204", async () => {
    const res = await DELETE(del(goalId), ctx(goalId));

    expect(res.status).toBe(204);
    expect(await db.goal.count()).toBe(0);
  });

  it("returns 400 for a malformed id", async () => {
    expect((await DELETE(del("bad id"), ctx("bad id"))).status).toBe(400);
  });

  it("returns 404 for a missing goal", async () => {
    expect((await DELETE(del(MISSING_ID), ctx(MISSING_ID))).status).toBe(404);
  });

  it("returns 404 and keeps the goal when another owner tries", async () => {
    asOwner("bob");

    expect((await DELETE(del(goalId), ctx(goalId))).status).toBe(404);
    expect(await db.goal.count()).toBe(1);
  });
});
