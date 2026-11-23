# Plan: Goals CRUD (US-1, before sign-in exists)

## Context
The repo is still the create-next-app scaffold: no Prisma, zod, Vitest or `src/server/`. US-1 needs goals stored in Postgres, scoped to an owner, and exposed through API routes and a simple `/goals` page. Auth.js isn't wired up yet, so each goal stores an `ownerId` string that will later point at the Auth.js `User`. Each step follows the strict TDD rule in `docs/testing.md`: a `test:` commit with the failing test, then a `feat:` commit with the code. Step 1 is tooling only, so it gets one `chore:` commit.

## Decisions (defaults; change any before approving)
- **Where `ownerId` comes from before auth exists:** a stub `getCurrentOwnerId()` in `src/server/auth.ts` that reads `DEV_OWNER_ID` from the environment (checked by zod) and **throws when `NODE_ENV === "production"`**. The routes never read an owner ID from the request. Auth.js later replaces only the body of this function.
- **Progress:** `progress` is a whole number from 0 to 100, plus a `status` enum (`not_started | in_progress | done`).
- **Test database:** a separate Postgres given by `TEST_DATABASE_URL` (a Neon branch or local). You set the real values; I only add the variable names to `.env.example`.
- **Driver:** Prisma 7 with the new `prisma-client` generator, `prisma.config.ts`, and the `@prisma/adapter-pg` driver adapter. Before writing it, I'll check the installed Prisma docs/README, since APIs move.

## Steps

### 1. `chore: set up prisma, zod and vitest with the Goal model`
- **Packages:** install `prisma`, `@prisma/client`, `@prisma/adapter-pg`, `zod`, `server-only`, `vitest`, `@vitest/coverage-v8` and `vite-tsconfig-paths`. Pin exact versions.
- **`prisma/schema.prisma`:** the generator outputs to `src/generated/prisma`, which is gitignored. Models:
  - `enum GoalStatus { not_started in_progress done }`
  - `model Goal { id String @id @default(cuid()); ownerId String; title String; description String?; targetDate DateTime; progress Int @default(0); status GoalStatus @default(not_started); createdAt DateTime @default(now()); updatedAt DateTime @updatedAt; @@index([ownerId, targetDate]) }`
- **`prisma.config.ts`:** reads `DATABASE_URL`.
- **Migration:** `npx prisma migrate dev --name add-goal`, which creates the first migration.
- **`src/server/env.ts`:** `import "server-only"`; a zod schema for `DATABASE_URL` and an optional `DEV_OWNER_ID`.
- **`src/server/db.ts`:** `import "server-only"`; one PrismaClient with the pg adapter, kept on `globalThis` in development.
- **`vitest.config.ts`:** two projects:
  - `unit`: `src/**/*.test.ts`
  - `int`: `src/**/*.int.test.ts`, run one file at a time, with a `globalSetup` that runs `prisma migrate deploy` against `TEST_DATABASE_URL`
  - Both alias `server-only` to an empty stub, and v8 coverage is enforced at 70% for lines and branches.
- **`package.json` scripts:** `test`, `test:unit`, `test:int`, `test:coverage`, `db:migrate`.
- **`.gitignore`:** add `!.env.example` and `src/generated`. `.env.example` lists the variable names only.

### 2. Goal zod schemas (`src/lib/schemas/goal.ts`)
- **Red:** `src/lib/schemas/goal.test.ts` covers:
  - The title is required: empty or whitespace-only titles are rejected, and titles are trimmed. Length is capped at 200.
  - `targetDate` must be a valid date: an ISO string becomes a `Date`, and garbage is rejected.
  - `description` is optional and capped at 2000 characters.
  - `progress` must be a whole number from 0 to 100, and `status` must be one of the enum values.
  - The update schema is partial but must change at least one field.
  - `goalIdSchema` accepts a cuid.
- **Green:** export `goalCreateSchema`, `goalUpdateSchema`, `goalIdSchema` and the inferred types.

### 3. Goals service (`src/server/services/goals.ts`)
- **Red:** `src/server/services/goals.int.test.ts` runs against the test database, and each test starts by truncating `Goal`. It covers:
  - Create, then list, returns goals sorted by `targetDate` ascending.
  - Creating with invalid input throws a validation error.
  - Update changes the fields; update and delete on a missing ID return `null`/`false`.
  - **Owner isolation:** owner B cannot list, update or delete owner A's goal, and A's row is left unchanged.
- **Green:** `import "server-only"`.
  - `listGoals(ownerId)`, `createGoal(ownerId, input)`, `updateGoal(ownerId, id, input)` and `deleteGoal(ownerId, id)`.
  - Input is parsed with the step-2 schemas inside the service, so a future agent tool can reuse it safely.
  - Update and delete use `where: { id, ownerId }` (`updateMany`/`deleteMany`, then re-read). Another owner's goal looks exactly like a missing one.
- The audit log isn't involved: it covers agent actions, and the agent doesn't exist yet.

### 4. API routes
- **Files:**
  - `src/app/api/goals/route.ts`: `GET` returns the list; `POST` returns 201 with the created goal.
  - `src/app/api/goals/[id]/route.ts`: `PATCH` returns 200; `DELETE` returns 204. Both use `ctx: RouteContext<'/api/goals/[id]'>` and `await ctx.params`, as the installed Next 16 docs describe.
  - `src/server/auth.ts`: the `getCurrentOwnerId()` stub described above.
- **Behavior:** handlers are thin. They resolve the owner, parse the body and `id` with zod, and call the service. Responses:
  - 400 with field errors (no stack traces) for bad input or a malformed `id`.
  - 404 when the goal is missing or belongs to someone else.
  - 500 with a generic message for anything unexpected.
- **Red:** `route.int.test.ts` in each folder calls the exported handlers with `Request` objects against the test database. `vi.mock("@/server/auth")` switches between owner A and owner B. Tests cover:
  - The status codes above.
  - Cross-owner PATCH and DELETE return 404.
  - A POST body containing `ownerId` is ignored.
- **Green:** the handlers.

### 5. `/goals` page
- **Files:**
  - `src/app/goals/page.tsx`: a Server Component that loads goals by calling `listGoals(await getCurrentOwnerId())` directly (no HTTP call to its own API), wrapped in `<Suspense>` because `cacheComponents` is on.
  - `src/components/goal-form.tsx` (client): title, description, date and progress; it POSTs to `/api/goals`, then calls `router.refresh()`.
  - `src/components/goal-list.tsx` (client): each row allows inline edits to progress and status (PATCH) and a delete button that asks for confirmation with `window.confirm` (DELETE). Text renders as plain text only.
  - Replace the scaffold `src/app/page.tsx` and `layout.tsx` metadata with a link to `/goals`.
- **Tests:** install Playwright (`@playwright/test`, `playwright.config.ts` running `npm run build && npm start` with `DEV_OWNER_ID` set) and add `e2e/goals.spec.ts`:
  - create a goal, check it appears in date order
  - change its progress, check the list updates
  - delete it after confirming, check it's gone
- **Commits:** red is the spec; green is the page and components. If unit coverage drops below 70% because of the components, add focused tests there.

## Critical files
`prisma/schema.prisma`, `prisma.config.ts`, `src/server/{env,db,auth}.ts`, `src/lib/schemas/goal.ts`, `src/server/services/goals.ts`, `src/app/api/goals/route.ts`, `src/app/api/goals/[id]/route.ts`, `src/app/goals/page.tsx`, `src/components/goal-{form,list}.tsx`, `vitest.config.ts`, `playwright.config.ts`.

## Verification
- After each green commit: `npm run lint`, `npm test`, `npm run build`.
- At the end:
  - `npm run test:coverage` meets the 70% threshold.
  - `npm run test:e2e` passes.
  - Manually: `npm run dev`, open `/goals`, create, edit and delete a goal.
  - `curl` checks: `/api/goals` with a bad body returns 400, and an unknown ID returns 404.
- **Needs you first:** set `DATABASE_URL`, `TEST_DATABASE_URL` and `DEV_OWNER_ID` in your local `.env` files. I can't read or write them.
