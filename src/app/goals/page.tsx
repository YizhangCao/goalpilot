import type { Metadata } from "next";
import { connection } from "next/server";
import { Suspense } from "react";
import { GoalForm } from "@/components/goal-form";
import { GoalList } from "@/components/goal-list";
import type { GoalView } from "@/components/goal-view";
import { getCurrentOwnerId } from "@/server/auth";
import { listGoals, type Goal } from "@/server/services/goals";

export const metadata: Metadata = { title: "Goals · GoalPilot" };

function toView(goal: Goal): GoalView {
  return {
    id: goal.id,
    title: goal.title,
    description: goal.description,
    targetDate: goal.targetDate.toISOString().slice(0, 10),
    progress: goal.progress,
    status: goal.status,
  };
}

async function Goals() {
  // Goals are per owner and per request: never prerender them into the static shell.
  await connection();
  const goals = await listGoals(await getCurrentOwnerId());
  if (goals.length === 0) {
    return <p className="text-sm text-zinc-500">No goals yet. Add one above.</p>;
  }
  return <GoalList goals={goals.map(toView)} />;
}

export default function GoalsPage() {
  return (
    <main className="mx-auto w-full max-w-2xl px-4 py-10">
      <h1 className="text-2xl font-semibold">Goals</h1>

      <section aria-labelledby="new-goal" className="mt-6 rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
        <h2 id="new-goal" className="mb-3 text-lg font-medium">
          New goal
        </h2>
        <GoalForm mode="create" />
      </section>

      <section aria-label="Goal list" className="mt-8">
        <Suspense fallback={<p className="text-sm text-zinc-500">Loading goals…</p>}>
          <Goals />
        </Suspense>
      </section>
    </main>
  );
}
