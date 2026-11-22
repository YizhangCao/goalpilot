export type SuggestionStatus = "pending" | "approved" | "rejected" | "executed";

export interface NewSuggestion {
  goalId: string;
  start: Date;
  end: Date;
  reason: string;
}

export interface Suggestion extends NewSuggestion {
  status: SuggestionStatus;
}

export class InvalidTransitionError extends Error {
  constructor(from: SuggestionStatus, to: SuggestionStatus) {
    super(`Cannot move a suggestion from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function createSuggestion(input: NewSuggestion): Suggestion {
  return { ...input, status: "pending" };
}

export function approve(item: Suggestion): Suggestion {
  if (item.status !== "pending") throw new InvalidTransitionError(item.status, "approved");
  return { ...item, status: "approved" };
}

export function reject(item: Suggestion): Suggestion {
  if (item.status !== "pending") throw new InvalidTransitionError(item.status, "rejected");
  return { ...item, status: "rejected" };
}

export function execute(item: Suggestion): Suggestion {
  if (item.status !== "approved") throw new InvalidTransitionError(item.status, "executed");
  return { ...item, status: "executed" };
}
