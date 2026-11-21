# GoalPilot: Product Requirements Document

**GoalPilot: A Goal Agent That Plans With You, Not For You**

Team: Yizhang Cao, Yikang Liu

## Problem

Grad students and job seekers handle assignment deadlines, interviews, applications and side projects all at once. The information for all of this sits in different places: Canvas, calendars and inboxes. To keep track of it, people check several apps every day and rewrite the same to-do list by hand, so goals slip until a deadline is close.

Existing tools fall short in two ways:

- **Most AI assistants are reactive.** They answer when asked and never follow up.
- **New personal agents ask for too much and act alone.** Products such as Meta Muse want access to nearly every part of a person's digital life and can take actions without asking.

No tool connects a person's goals to their real schedule while keeping them in control of every change.

## Target Users

People working toward several goals at once, for example:

- Grad students
- Job seekers
- Early-career professionals

Users set goals and connect their calendar. A user can invite **coaches** (a mentor, advisor or accountability partner) to follow their goal progress.

## Roles

| Role | Capabilities | Restrictions |
| --- | --- | --- |
| **User** | Connects a calendar, manages goals, reads the daily brief, approves or rejects the agent's suggestions, invites a coach. | None. The user owns their data. |
| **Coach** | Once invited by a user, views that user's goal progress and comments on it. | Never sees calendar contents. Cannot change goals or act on the agent's suggestions. Sees only users who invited them. |

## User Stories

### US-1: Goals in one place

> As a user with several deadlines, I want to create goals with a target date and track their progress in one place, so that I stop rebuilding the same list across apps.

**Acceptance criteria**

- A signed-in user can create a goal with a title and a target date. A description is optional.
- A goal cannot be saved without a title and a valid target date.
- The user can view all their goals on one page, sorted by target date by default.
- The user can edit a goal's title, description, target date and progress.
- The user can update progress (for example a percentage or a status such as not started, in progress, done), and the change appears in the goal list right away.
- The user can delete a goal after confirming, and it no longer appears in the list.
- Goals are private to their owner. Another user cannot read or change them.
- Goals persist across sessions and devices.

### US-2: Time blocks that fit the real calendar

> As a user with a busy calendar, I want the agent to read my calendar and suggest specific time blocks for each goal, so that my goals fit into the time I actually have.

**Acceptance criteria**

- The agent reads the user's Google Calendar events for a set planning window (for example the next 7 days) using read-only access.
- Each suggestion names a goal, a start time and an end time.
- Suggested blocks never overlap existing calendar events.
- Suggested blocks land before the goal's target date.
- The agent gives a short reason for each suggestion (for example, "free 2-hour window, deadline in 3 days").
- If no free time exists before a goal's target date, the agent says so instead of suggesting an overlapping block.
- If the calendar is not connected or the token has expired, the user is asked to reconnect and no suggestions are made from stale data.

### US-3: Approval queue

> As a user who wants to stay in control, I want every change the agent proposes to wait in a queue until I approve or reject it, so that nothing happens to my calendar without my consent.

**Acceptance criteria**

- Every change the agent proposes goes into the approval queue with status **pending**. The agent has no path to apply a change directly.
- The queue shows each pending item's goal, proposed time and the agent's reason.
- The user can approve or reject each item on its own.
- An approved or rejected item leaves the pending list, and its final status and decision time are kept.
- In Version 1 (read-only calendar), approving an item records the decision but does not write to Google Calendar.
- In Version 2, a calendar event is created only after approval. A rejected item never touches the calendar.
- If the calendar has changed since a suggestion was made so that the slot is no longer free, the item is flagged as conflicting before the user approves it.

### US-4: Daily brief

> As a user who starts the day unsure what to focus on, I want a short daily brief of today's deadlines, free time and goal progress, so that I know what matters most before I open any other app.

**Acceptance criteria**

- A brief is generated once each morning on a schedule (Vercel Cron) for each user with a connected calendar.
- The brief lists goals due today or soon, today's free time blocks, and progress on active goals.
- The brief highlights what matters most today (for example the goal with the nearest deadline).
- The brief is short enough to read in under a minute.
- The user can see today's brief in the app as soon as they open it.
- Any time blocks the brief suggests go through the approval queue, as in US-3.
- If brief generation fails, the user sees a clear message rather than an empty or outdated brief.

### US-5: Audit log

> As a user who cares about privacy, I want to see a log of what the agent read, what it suggested and what I decided, so that I can trust what it does with my data.

**Acceptance criteria**

- Each time the agent reads data, the log records the source (for example Google Calendar), the time range read and a timestamp.
- Each suggestion the agent makes is logged with its content and timestamp.
- Each user decision (approve or reject) is logged with the item it applies to and a timestamp.
- In Version 2, each calendar write is logged with the event it created.
- Log entries are shown newest first, and the user can filter by type (read, suggestion, decision).
- Log entries cannot be edited or deleted through the app.
- Only the owning user can see their log. Coaches cannot.

### US-6: Coach access

> As a coach invited by a user, I want to view their goal progress and leave comments without seeing their calendar, so that I can keep them accountable without access to their private schedule.

**Acceptance criteria**

- A user can invite a coach by email and can revoke that access at any time.
- A coach gets access only after accepting an invitation.
- A coach can see the inviting user's goals: titles, target dates and progress.
- A coach can comment on a goal, and the user sees those comments on that goal.
- A coach cannot see calendar events, free time, the approval queue, the daily brief or the audit log. These restrictions are enforced on the server, not just hidden in the UI.
- A coach cannot create, edit or delete the user's goals.
- After access is revoked, the coach can no longer see the user's goals.

## Version 1 Scope

- Google sign-in with read-only Google Calendar access
- Goals CRUD (US-1)
- Agent core built on the Claude Agent SDK, with tools to:
  - read the calendar
  - look up goals
  - suggest time blocks (US-2)
- Approval queue (US-3)
- Audit log (US-5)

## Version 2 Scope

- Daily brief generated on a schedule with Vercel Cron (US-4)
- Calendar writes after approval (US-3, Version 2 criteria)
- Coach role (US-6)
- Read-only Gmail access, if time allows

## Out of Scope

- Admin dashboard
- Payments
- Shopping
- Sending email automatically
- Mobile apps
