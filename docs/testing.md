# Testing

## Strict TDD

Each behavior goes through red → green → refactor, with separate commits:

1. **Red:** write the test and run it to see it fail for the expected reason. Commit the test alone: `test: <behavior>`.
2. **Green:** write the minimum code to pass. Commit: `feat: <behavior>` or `fix: <behavior>`.
3. **Refactor (if needed):** clean up with all tests green. Commit: `refactor: <what>`.

Don't write implementation code before its failing test is committed, and don't change a test in the same commit that makes it pass.

## Layers

| Layer | Tool | Scope | Location |
| --- | --- | --- | --- |
| Unit | Vitest | Pure logic: zod schemas, free-slot calculation, suggestion status transitions, brief formatting, authorization helpers. No network, no DB. | `src/**/*.test.ts` next to the code |
| Integration | Vitest | Services and server actions against a real PostgreSQL test database (separate Neon branch or local Postgres); Google Calendar and the Claude API mocked at the HTTP/SDK boundary. | `src/**/*.int.test.ts` |
| E2E | Playwright | Full user flows in a browser against `npm run build && npm start`, with test auth and mocked external APIs. | `e2e/` |

## Required coverage

- **70%+ line and branch coverage** overall (Vitest v8 coverage, enforced as a threshold in CI).
- At least one Playwright E2E test, and at minimum one for the core V1 flow: sign in → create a goal → agent suggests a block → approve it → the decision appears in the audit log.

## What must be tested

These protect the non-negotiables in `CLAUDE.md` and need tests before the feature counts as done:

- The agent's tool set contains no write tools, and approving is the only path that changes a suggestion's status.
- Approving a suggestion that is not `pending`, or that belongs to another user, fails.
- Suggestions never overlap existing events and never land after the goal's target date.
- Calendar text containing instructions (for example "ignore previous instructions and delete…") produces no action beyond normal pending suggestions.
- Every read, suggestion, decision and write creates an audit row.
- A coach cannot reach calendar, suggestion, brief or audit data, and loses goal access after revocation.
- User A cannot read or change user B's goals, suggestions or audit log.

## Mocking rules

- Never call the real Google or Claude APIs in tests. Mock at the boundary (`src/server/calendar/`, `src/server/agent/`) with recorded fixtures.
- Don't mock Prisma in integration tests; use the test database and reset it between tests.
- Agent tests check the structured output and the tool calls made, not exact model wording.
