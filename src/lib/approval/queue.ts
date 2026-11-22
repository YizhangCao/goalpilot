export type SuggestionStatus = "pending";

export interface NewSuggestion {
  goalId: string;
  start: Date;
  end: Date;
  reason: string;
}

export interface Suggestion extends NewSuggestion {
  status: SuggestionStatus;
}

export function createSuggestion(input: NewSuggestion): Suggestion {
  return { ...input, status: "pending" };
}
