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

const ALLOWED_TRANSITIONS: Record<SuggestionStatus, readonly SuggestionStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["executed"],
  rejected: [],
  executed: [],
};

function transition(item: Suggestion, to: SuggestionStatus): Suggestion {
  if (!ALLOWED_TRANSITIONS[item.status].includes(to)) {
    throw new InvalidTransitionError(item.status, to);
  }
  return { ...item, status: to };
}

export function approve(item: Suggestion): Suggestion {
  return transition(item, "approved");
}

export function reject(item: Suggestion): Suggestion {
  return transition(item, "rejected");
}

export function execute(item: Suggestion): Suggestion {
  return transition(item, "executed");
}
