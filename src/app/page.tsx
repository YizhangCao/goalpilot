import Link from "next/link";

export default function Home() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-4 px-4 py-16">
      <h1 className="text-3xl font-semibold">GoalPilot</h1>
      <p className="text-zinc-600 dark:text-zinc-400">A goal agent that plans with you, not for you.</p>
      <Link
        href="/goals"
        className="w-fit rounded-md bg-zinc-900 px-4 py-2 text-sm font-medium text-white dark:bg-zinc-100 dark:text-zinc-900"
      >
        Go to your goals
      </Link>
    </main>
  );
}
