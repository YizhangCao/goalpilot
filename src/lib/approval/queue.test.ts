import { describe, expect, it } from "vitest";
import { approve, createSuggestion, execute, InvalidTransitionError, reject } from "./queue";

const user = { actorId: "user-1", at: new Date("2026-11-21T09:00:00Z") };
const later = { actorId: "server", at: new Date("2026-11-21T09:05:00Z") };

function newSuggestion() {
  return createSuggestion({
    goalId: "goal-1",
    start: new Date("2026-11-23T14:00:00Z"),
    end: new Date("2026-11-23T16:00:00Z"),
    reason: "free 2-hour window, deadline in 3 days",
  });
}

describe("approval queue", () => {
  it("a new suggestion starts as pending", () => {
    expect(newSuggestion().status).toBe("pending");
  });

  describe("only a pending item can be approved or rejected", () => {
    it("approving a pending item makes it approved", () => {
      expect(approve(newSuggestion(), user).status).toBe("approved");
    });

    it("rejecting a pending item makes it rejected", () => {
      expect(reject(newSuggestion(), user).status).toBe("rejected");
    });

    it.each([
      ["approved", () => approve(newSuggestion(), user)],
      ["rejected", () => reject(newSuggestion(), user)],
    ])("an item that is already %s cannot be approved or rejected", (_status, decided) => {
      const item = decided();

      expect(() => approve(item, user)).toThrow(InvalidTransitionError);
      expect(() => reject(item, user)).toThrow(InvalidTransitionError);
    });

    it("does not modify the original item", () => {
      const item = newSuggestion();
      approve(item, user);

      expect(item.status).toBe("pending");
    });
  });

  describe("only an approved item can be executed", () => {
    it("executing an approved item makes it executed", () => {
      expect(execute(approve(newSuggestion(), user), later).status).toBe("executed");
    });

    it.each([
      ["pending", () => newSuggestion()],
      ["rejected", () => reject(newSuggestion(), user)],
    ])("a %s item cannot be executed", (_status, make) => {
      expect(() => execute(make(), later)).toThrow(InvalidTransitionError);
    });

    it("does not modify the original item", () => {
      const item = approve(newSuggestion(), user);
      execute(item, later);

      expect(item.status).toBe("approved");
    });
  });

  describe("rejected and executed items can't change again", () => {
    it.each([
      ["rejected", () => reject(newSuggestion(), user)],
      ["executed", () => execute(approve(newSuggestion(), user), later)],
    ])("an item that is %s cannot be approved, rejected or executed", (_status, make) => {
      const item = make();

      expect(() => approve(item, user)).toThrow(InvalidTransitionError);
      expect(() => reject(item, user)).toThrow(InvalidTransitionError);
      expect(() => execute(item, later)).toThrow(InvalidTransitionError);
    });
  });

  describe("every transition records who did it and when, for the audit log", () => {
    it("a new suggestion has no transitions yet", () => {
      expect(newSuggestion().transitions).toEqual([]);
    });

    it("approving records the actor and the time", () => {
      expect(approve(newSuggestion(), user).transitions).toEqual([
        { from: "pending", to: "approved", actorId: "user-1", at: new Date("2026-11-21T09:00:00Z") },
      ]);
    });

    it("rejecting records the actor and the time", () => {
      expect(reject(newSuggestion(), user).transitions).toEqual([
        { from: "pending", to: "rejected", actorId: "user-1", at: new Date("2026-11-21T09:00:00Z") },
      ]);
    });

    it("executing appends to the history instead of replacing it", () => {
      expect(execute(approve(newSuggestion(), user), later).transitions).toEqual([
        { from: "pending", to: "approved", actorId: "user-1", at: new Date("2026-11-21T09:00:00Z") },
        { from: "approved", to: "executed", actorId: "server", at: new Date("2026-11-21T09:05:00Z") },
      ]);
    });

    it("does not modify the original item's history", () => {
      const item = approve(newSuggestion(), user);
      execute(item, later);

      expect(item.transitions).toHaveLength(1);
    });

    it("a refused transition records nothing", () => {
      const item = reject(newSuggestion(), user);

      expect(() => approve(item, later)).toThrow(InvalidTransitionError);
      expect(item.transitions).toHaveLength(1);
    });
  });
});
