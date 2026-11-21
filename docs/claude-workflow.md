# Working with Claude Code

## Permissions (`.claude/settings.json`)

These are shared project rules, committed to the repo. Personal overrides go in `.claude/settings.local.json`, which stays local. Each rule is written twice, once as `Bash(...)` and once as `PowerShell(...)`, so it applies on macOS/Linux and on Windows.

### Allowed without a prompt

| Rule | Why |
| --- | --- |
| `npm run lint` | Read-only check, run before every commit. |
| `npm run build` | Production build and type check; changes nothing outside `.next/`. |
| `npm run dev` | Local dev server for trying changes. |
| `npm test` | Unit and integration tests, run constantly during TDD. |
| `npx vitest` | Run a single test file or test name during red/green. |
| `npx playwright test` | E2E tests against a local build. |
| `npx prisma generate` | Regenerates the Prisma client from the schema; no database changes. |
| `npx prisma migrate dev` | Creates and applies migrations to the development database only. |
| `git status`, `git diff`, `git log` | Read-only inspection of the repo. |
| `git add`, `git commit` | Local and reversible; TDD needs a commit for each red, green and refactor step. |
| `gh pr view` | Read-only look at a pull request. |
| `gh pr create` | Opens a PR for review; nothing merges without a person. |

`git push` is not on the list, so Claude asks before every push.

### Denied

| Rule | Why |
| --- | --- |
| `Read(./.env)`, `Read(./.env.*)` | Secrets (Google OAuth, Anthropic key, database URL) never enter Claude's context. This also blocks `.env.example`; tell Claude the variable names instead. |
| `rm -rf` | Recursive deletes can't be undone. Delete specific files, or let a person do it. |
| `git push --force` (and `-f`, in any position) | Rewriting shared history can destroy a teammate's commits. |
| `npx prisma migrate reset` | Drops the database and all its data. |

Deny rules match command prefixes, so a reworded command can slip past them. They are a safety net, not a guarantee; still read what Claude asks to run.

## Context strategy

- **`/clear` between phases.** Start a fresh context for each phase: explore, plan, implement, and each TDD feature (red → green → refactor). `CLAUDE.md` and the imported docs reload automatically, so nothing important is lost, and leftover context from the last phase can't steer the next one. Before clearing, make sure the plan or result is written to a file or committed.
- **`/compact <focus>` when a session gets long.** Compact with an instruction about what to keep, for example `/compact keep the approval-queue design and the failing test names`. A focused summary keeps what matters and drops the rest.
- **`claude --continue` the next day.** Resumes the most recent session in this directory with its history, so you can pick up where you stopped. If the next task is a new phase, `/clear` instead.
