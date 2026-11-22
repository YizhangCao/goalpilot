import { describe, expect, it } from "vitest";
import { createSuggestion } from "./queue";

describe("approval queue", () => {
  it("a new suggestion starts as pending", () => {
    const item = createSuggestion({
      goalId: "goal-1",
      start: new Date("2026-11-23T14:00:00Z"),
      end: new Date("2026-11-23T16:00:00Z"),
      reason: "free 2-hour window, deadline in 3 days",
    });

    expect(item.status).toBe("pending");
  });
});
