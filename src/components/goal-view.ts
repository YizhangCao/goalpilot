import type { GoalStatus } from "@/lib/schemas/goal";

/** A goal as the client components see it (plain, serializable). */
export type GoalView = {
  id: string;
  title: string;
  description: string | null;
  /** YYYY-MM-DD (UTC) */
  targetDate: string;
  progress: number;
  status: GoalStatus;
};

export const STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not started",
  in_progress: "In progress",
  done: "Done",
};

export function formatTargetDate(isoDate: string): string {
  return new Intl.DateTimeFormat("en-US", { dateStyle: "medium", timeZone: "UTC" }).format(
    new Date(`${isoDate}T00:00:00Z`),
  );
}
