import { describe, expect, it } from "vitest";
import { approve, createSuggestion, InvalidTransitionError, reject } from "./queue";

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
      expect(approve(newSuggestion()).status).toBe("approved");
    });

    it("rejecting a pending item makes it rejected", () => {
      expect(reject(newSuggestion()).status).toBe("rejected");
    });

    it.each([
      ["approved", () => approve(newSuggestion())],
      ["rejected", () => reject(newSuggestion())],
    ])("an item that is already %s cannot be approved or rejected", (_status, decided) => {
      const item = decided();

      expect(() => approve(item)).toThrow(InvalidTransitionError);
      expect(() => reject(item)).toThrow(InvalidTransitionError);
    });

    it("does not modify the original item", () => {
      const item = newSuggestion();
      approve(item);

      expect(item.status).toBe("pending");
    });
  });
});
