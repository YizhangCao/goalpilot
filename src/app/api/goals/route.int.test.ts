import { afterAll, beforeEach, describe, expect, it, vi } from "vitest";
import { db } from "@/server/db";
import { getCurrentOwnerId } from "@/server/auth";
import { GET, POST } from "./route";

vi.mock("@/server/auth", () => ({ getCurrentOwnerId: vi.fn() }));
const asOwner = (id: string) => vi.mocked(getCurrentOwnerId).mockResolvedValue(id);

function post(body: unknown) {
  return new Request("http://localhost/api/goals", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: typeof body === "string" ? body : JSON.stringify(body),
  });
}

beforeEach(async () => {
  await db.goal.deleteMany();
  asOwner("alice");
});

afterAll(async () => {
  await db.$disconnect();
});

describe("POST /api/goals", () => {
  it("creates a goal for the current owner and returns 201", async () => {
    const res = await POST(post({ title: "Ship MVP", targetDate: "2026-12-20", ownerId: "bob" }));

    expect(res.status).toBe(201);
    const goal = await res.json();
    expect(goal).toMatchObject({ title: "Ship MVP", ownerId: "alice", targetDate: "2026-12-20T00:00:00.000Z" });
  });

  it("returns 400 with field errors for invalid input", async () => {
    const res = await POST(post({ title: "", targetDate: "soon" }));

    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toBe("Invalid input");
    expect(Object.keys(body.fields)).toEqual(expect.arrayContaining(["title", "targetDate"]));
    expect(await db.goal.count()).toBe(0);
  });

  it("returns 400 for a malformed JSON body", async () => {
    const res = await POST(post("{not json"));
    expect(res.status).toBe(400);
  });
});

describe("GET /api/goals", () => {
  it("lists only the current owner's goals, sorted by target date", async () => {
    await POST(post({ title: "Later", targetDate: "2027-01-10" }));
    await POST(post({ title: "Sooner", targetDate: "2026-12-01" }));
    asOwner("bob");
    await POST(post({ title: "Bob's", targetDate: "2026-11-30" }));
    asOwner("alice");

    const res = await GET();

    expect(res.status).toBe(200);
    const goals = await res.json();
    expect(goals.map((g: { title: string }) => g.title)).toEqual(["Sooner", "Later"]);
  });

  it("returns a generic 500 when something unexpected fails", async () => {
    vi.mocked(getCurrentOwnerId).mockRejectedValueOnce(new Error("secret internals"));

    const res = await GET();

    expect(res.status).toBe(500);
    expect(await res.json()).toEqual({ error: "Something went wrong" });
  });
});
