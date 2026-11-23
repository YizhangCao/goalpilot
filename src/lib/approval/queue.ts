export type SuggestionStatus = "pending" | "approved" | "rejected" | "executed";

export interface NewSuggestion {
  goalId: string;
  start: Date;
  end: Date;
  reason: string;
}

/** Who is making a transition and when. The caller supplies the time so it can be fixed in tests. */
export interface TransitionContext {
  actorId: string;
  at: Date;
}

/** One entry in a suggestion's audit trail. */
export interface Transition extends TransitionContext {
  from: SuggestionStatus;
  to: SuggestionStatus;
}

export interface Suggestion extends NewSuggestion {
  status: SuggestionStatus;
  transitions: readonly Transition[];
}

export class InvalidTransitionError extends Error {
  constructor(from: SuggestionStatus, to: SuggestionStatus) {
    super(`Cannot move a suggestion from ${from} to ${to}`);
    this.name = "InvalidTransitionError";
  }
}

export function createSuggestion(input: NewSuggestion): Suggestion {
  return { ...input, status: "pending", transitions: [] };
}

const ALLOWED_TRANSITIONS: Record<SuggestionStatus, readonly SuggestionStatus[]> = {
  pending: ["approved", "rejected"],
  approved: ["executed"],
  rejected: [],
  executed: [],
};

function transition(item: Suggestion, to: SuggestionStatus, context: TransitionContext): Suggestion {
  if (!ALLOWED_TRANSITIONS[item.status].includes(to)) {
    throw new InvalidTransitionError(item.status, to);
  }
  const entry: Transition = { from: item.status, to, actorId: context.actorId, at: context.at };
  return { ...item, status: to, transitions: [...item.transitions, entry] };
}

export function approve(item: Suggestion, context: TransitionContext): Suggestion {
  return transition(item, "approved", context);
}

export function reject(item: Suggestion, context: TransitionContext): Suggestion {
  return transition(item, "rejected", context);
}

export function execute(item: Suggestion, context: TransitionContext): Suggestion {
  return transition(item, "executed", context);
}
