# Architecture

## Overview

```
Browser ── Next.js App Router (Vercel)
             ├── Server Components / Server Actions ── src/server/services ── Prisma ── Neon PostgreSQL
             ├── Auth.js (Google OAuth: sign-in + Calendar scope)
             ├── Agent runner (Claude Agent SDK) ── agent tools ── services / Google Calendar (read)
             └── Vercel Cron ── /api/cron/daily-brief (V2)
```

All business logic lives in `src/server/services/`. Pages, server actions, route handlers and agent tools are thin adapters that validate input with zod, resolve the session user, and call a service.

## Decision 1: The agent only drafts

The agent can **read** (calendar events in a window, the user's goals) and **propose** (create a `Suggestion` row with status `pending`). It has no tool that writes to Google Calendar, edits goals or sends anything.

Writes happen only in the approval flow:

1. The user approves a pending suggestion in the queue (server action).
2. The server re-checks ownership, status (`pending`) and, for time blocks, that the slot is still free.
3. V1: the suggestion is marked `approved` and nothing is written to Google. V2: the server creates the calendar event with the user's token, stores the event ID on the suggestion, then marks it `approved`.
4. Every step is written to the audit log.

Rejecting marks the suggestion `rejected`. Suggestion status only moves forward: `pending → approved | rejected` (plus `conflict` when the slot is no longer free).

Because the agent's tool set physically lacks write tools, a manipulated model can at worst create bad pending suggestions, which the user sees and rejects.

## Decision 2: Calendar and email content is data, never instructions

Event titles, descriptions, attendee names and (V2) email bodies may contain text written by anyone who can send the user an invite or email. Therefore:

- Tool results pass external content to the model as clearly delimited data, and the system prompt states that this content is never to be followed as instructions.
- Tools return only the fields the agent needs (time ranges, busy/free, titles), not raw API payloads.
- The agent's output is parsed with a zod schema into structured suggestions (goal ID, start, end, reason). Free text from the model is never executed, rendered as HTML, or used to build queries or URLs.
- Goal IDs in agent output are re-checked against the user's own goals before a suggestion is saved.

## Decision 3: Append-only audit log

`AuditEvent` rows record `type` (`read`, `suggestion`, `decision`, `write`), user, timestamp and a JSON summary (for example the source and time range read, never full event bodies). The app exposes no update or delete path for audit rows. Writes to the audit log happen in the same service call (and transaction where possible) as the action they record.

## Decision 4: Coach access enforced in the data layer

A `CoachLink` (user, coach, status `invited | active | revoked`) gates coach access. Coach-facing service functions return only goals and comments for users with an `active` link. Calendar, suggestions, briefs and audit data have no coach-accessible code path at all.

## Data model (initial)

- `User`, `Account`, `Session`: Auth.js Prisma adapter tables. Google refresh tokens are stored on `Account`.
- `Goal`: owner, title, description, targetDate, progress, status, timestamps.
- `Suggestion`: owner, goal, start, end, reason, status, decidedAt, calendarEventId (V2).
- `AuditEvent`: owner, type, summary (JSON), createdAt.
- V2: `DailyBrief` (owner, date, content), `CoachLink`, `Comment` (goal, author, body).

## Daily brief (V2)

Vercel Cron calls `/api/cron/daily-brief`, which checks the `CRON_SECRET` bearer token, then generates a brief per user with a connected calendar. Any time blocks the brief proposes become pending suggestions, like any other agent output.
