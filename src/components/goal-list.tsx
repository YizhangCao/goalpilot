"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { GoalForm } from "./goal-form";
import { formatTargetDate, STATUS_LABELS, type GoalView } from "./goal-view";

export function GoalList({ goals }: { goals: GoalView[] }) {
  return (
    <ul aria-label="Goals" className="divide-y divide-zinc-200 dark:divide-zinc-800">
      {goals.map((goal) => (
        <GoalItem key={goal.id} goal={goal} />
      ))}
    </ul>
  );
}

function GoalItem({ goal }: { goal: GoalView }) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deleting, startDelete] = useTransition();

  function onDelete() {
    if (!window.confirm(`Delete "${goal.title}"? This can't be undone.`)) return;
    startDelete(async () => {
      const res = await fetch(`/api/goals/${goal.id}`, { method: "DELETE" });
      if (!res.ok && res.status !== 404) {
        setError("Could not delete the goal");
        return;
      }
      router.refresh();
    });
  }

  return (
    <li className="py-4">
      {editing ? (
        <div className="flex flex-col gap-3">
          <h3 className="font-medium break-words">{goal.title}</h3>
          <GoalForm mode="edit" goal={goal} onDone={() => setEditing(false)} />
        </div>
      ) : (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
          <div className="min-w-0">
            <h3 className="font-medium break-words">{goal.title}</h3>
            <p className="text-sm text-zinc-500">
              Due {formatTargetDate(goal.targetDate)} · {STATUS_LABELS[goal.status]}
            </p>
            {goal.description && <p className="mt-1 text-sm break-words whitespace-pre-line">{goal.description}</p>}
            <div className="mt-2 flex items-center gap-2">
              <div
                role="progressbar"
                aria-label={`Progress for ${goal.title}`}
                aria-valuenow={goal.progress}
                aria-valuemin={0}
                aria-valuemax={100}
                className="h-2 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
              >
                <div className="h-full bg-emerald-600" style={{ width: `${goal.progress}%` }} />
              </div>
              <span className="text-sm tabular-nums">{goal.progress}%</span>
            </div>
          </div>
          <div className="flex shrink-0 gap-2">
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-md border border-zinc-300 px-3 py-1.5 text-sm dark:border-zinc-700"
            >
              Edit
            </button>
            <button
              type="button"
              onClick={onDelete}
              disabled={deleting}
              className="rounded-md border border-red-300 px-3 py-1.5 text-sm text-red-700 disabled:opacity-60 dark:border-red-800 dark:text-red-400"
            >
              Delete
            </button>
          </div>
        </div>
      )}
      {error && (
        <p role="alert" className="mt-2 text-sm text-red-600">
          {error}
        </p>
      )}
    </li>
  );
}
