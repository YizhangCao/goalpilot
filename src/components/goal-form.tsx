"use client";

import { useRouter } from "next/navigation";
import { useId, useState, useTransition, type FormEvent } from "react";
import { GOAL_STATUSES } from "@/lib/schemas/goal";
import { STATUS_LABELS, type GoalView } from "./goal-view";

type Props = { mode: "create" } | { mode: "edit"; goal: GoalView; onDone: () => void };

type FieldErrors = Partial<Record<string, string[]>>;

const inputClass =
  "w-full rounded-md border border-zinc-300 bg-transparent px-3 py-2 text-sm dark:border-zinc-700";

export function GoalForm(props: Props) {
  const router = useRouter();
  const id = useId();
  const [pending, startTransition] = useTransition();
  const [errors, setErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const goal = props.mode === "edit" ? props.goal : undefined;

  function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = event.currentTarget;
    const data = new FormData(form);
    const progress = String(data.get("progress") ?? "").trim();

    const payload: Record<string, unknown> = {
      title: String(data.get("title") ?? ""),
      description: String(data.get("description") ?? ""),
      targetDate: String(data.get("targetDate") ?? ""),
    };
    if (progress !== "") payload.progress = Number(progress);
    if (props.mode === "edit") payload.status = data.get("status");

    startTransition(async () => {
      const res = await fetch(goal ? `/api/goals/${goal.id}` : "/api/goals", {
        method: goal ? "PATCH" : "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const body = (await res.json().catch(() => ({}))) as { error?: string; fields?: FieldErrors };
        setErrors(body.fields ?? {});
        setFormError(body.fields ? null : (body.error ?? "Could not save the goal"));
        return;
      }

      setErrors({});
      setFormError(null);
      if (props.mode === "edit") props.onDone();
      else form.reset();
      router.refresh();
    });
  }

  const field = (name: string) => `${id}-${name}`;
  const errorFor = (name: string) =>
    errors[name]?.length ? (
      <p id={`${field(name)}-error`} className="mt-1 text-sm text-red-600">
        {errors[name]![0]}
      </p>
    ) : null;
  const describedBy = (name: string) => (errors[name]?.length ? `${field(name)}-error` : undefined);

  return (
    <form
      aria-label={goal ? "Edit goal" : "New goal"}
      onSubmit={onSubmit}
      noValidate
      className="grid gap-3 sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label htmlFor={field("title")} className="mb-1 block text-sm font-medium">
          Title
        </label>
        <input
          id={field("title")}
          name="title"
          defaultValue={goal?.title}
          maxLength={200}
          aria-invalid={Boolean(errors.title?.length)}
          aria-describedby={describedBy("title")}
          className={inputClass}
        />
        {errorFor("title")}
      </div>

      <div className="sm:col-span-2">
        <label htmlFor={field("description")} className="mb-1 block text-sm font-medium">
          Description <span className="font-normal text-zinc-500">(optional)</span>
        </label>
        <textarea
          id={field("description")}
          name="description"
          defaultValue={goal?.description ?? ""}
          maxLength={2000}
          rows={2}
          aria-describedby={describedBy("description")}
          className={inputClass}
        />
        {errorFor("description")}
      </div>

      <div>
        <label htmlFor={field("targetDate")} className="mb-1 block text-sm font-medium">
          Target date
        </label>
        <input
          id={field("targetDate")}
          name="targetDate"
          type="date"
          defaultValue={goal?.targetDate}
          aria-invalid={Boolean(errors.targetDate?.length)}
          aria-describedby={describedBy("targetDate")}
          className={inputClass}
        />
        {errorFor("targetDate")}
      </div>

      <div>
        <label htmlFor={field("progress")} className="mb-1 block text-sm font-medium">
          Progress
        </label>
        <input
          id={field("progress")}
          name="progress"
          type="number"
          min={0}
          max={100}
          step={1}
          defaultValue={goal?.progress ?? 0}
          aria-invalid={Boolean(errors.progress?.length)}
          aria-describedby={describedBy("progress")}
          className={inputClass}
        />
        {errorFor("progress")}
      </div>

      {goal && (
        <div>
          <label htmlFor={field("status")} className="mb-1 block text-sm font-medium">
            Status
          </label>
          <select id={field("status")} name="status" defaultValue={goal.status} className={inputClass}>
            {GOAL_STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="flex items-end gap-2 sm:col-span-2">
        <button
          type="submit"
          disabled={pending}
          className="rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {goal ? "Save" : "Add goal"}
        </button>
        {props.mode === "edit" && (
          <button
            type="button"
            onClick={props.onDone}
            className="rounded-md px-4 py-2 text-sm font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
          >
            Cancel
          </button>
        )}
        {formError && (
          <p role="alert" className="text-sm text-red-600">
            {formError}
          </p>
        )}
      </div>
    </form>
  );
}
