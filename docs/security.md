# Security (OWASP)

Only the items that apply to GoalPilot are listed, with what we do about each.

## OWASP Top 10 (2021)

| Item | Risk for us | What we do |
| --- | --- | --- |
| **A01 Broken Access Control** | A user reads another user's goals or audit log; a coach reaches calendar data; an ID from the client is trusted. | Every service function takes the session user and scopes queries by owner or active `CoachLink`. Coaches have no code path to calendar, suggestions, briefs or audit data. Tests cover cross-user and coach access. |
| **A02 Cryptographic Failures** | Leaked Google refresh tokens give access to the user's calendar. | HTTPS only (Vercel). Tokens stored only server-side in the database, never sent to the client or logged. Neon encrypts at rest. Secrets live in Vercel env vars. |
| **A03 Injection** | SQL injection; XSS from calendar text or model output. | Prisma parameterized queries only; no raw SQL with interpolation. React escaping; never `dangerouslySetInnerHTML` with calendar, email or model text. zod validation at every boundary. |
| **A04 Insecure Design** | An agent that can act on its own. | The agent only drafts; every write goes through the approval queue (see `architecture.md`). |
| **A05 Security Misconfiguration** | Open cron route, verbose errors, over-broad OAuth scopes. | Cron route requires `CRON_SECRET`. Generic error messages to the client. Minimal Google scopes per version. Security headers set in `next.config.ts`. |
| **A06 Vulnerable Components** | Vulnerable npm packages. | Lockfile committed; `npm audit` and Dependabot; pinned Next.js version. |
| **A07 Identification and Authentication Failures** | Session hijacking, weak auth. | Auth.js with Google only (no passwords); secure, httpOnly, SameSite cookies; `AUTH_SECRET` set; sessions checked server-side on every action. |
| **A08 Software and Data Integrity Failures** | Tampered audit log; forged cron calls. | Audit log is append-only with no update or delete path. Cron requests authenticated. |
| **A09 Logging and Monitoring Failures** | Not knowing what the agent did; logging too much. | The audit log records every agent read, suggestion, decision and write. Server logs exclude tokens, calendar contents and prompts. |
| **A10 SSRF** | The agent or server fetching URLs found in calendar or email content. | Server only calls fixed Google and Anthropic endpoints. No tool fetches arbitrary URLs. |

## OWASP Top 10 for LLM Applications (2025)

| Item | Risk for us | What we do |
| --- | --- | --- |
| **LLM01 Prompt Injection** | An invite or email (indirect injection) tells the agent to do something. | Calendar and email content is data, never instructions: delimited in tool results, flagged as untrusted in the system prompt. The agent has no write tools, so the worst case is a bad pending suggestion the user rejects. |
| **LLM02 Sensitive Information Disclosure** | The model reveals one user's data to another, or calendar data reaches a coach. | Each agent run gets only the current user's data through user-scoped tools. Coaches never trigger agent runs over a user's calendar. Prompts and responses are not logged in full. |
| **LLM05 Improper Output Handling** | Model output used as HTML, SQL, URLs or commands. | Model output is parsed with zod into structured suggestions; goal IDs re-checked against the user's goals; text rendered as plain text only. |
| **LLM06 Excessive Agency** | The agent writes to the calendar or sends email on its own. | Tools are read-only plus "create pending suggestion". Writes only after user approval, in server code outside the agent. Minimal OAuth scopes. No automatic email sending. |
| **LLM07 System Prompt Leakage** | Secrets or authorization logic in the system prompt. | No secrets or tokens in prompts. Authorization is enforced in code, never by asking the model. |
| **LLM10 Unbounded Consumption** | Runaway agent loops or abuse drive up API cost. | Max turns and token limits per agent run; per-user rate limits on agent requests; cron runs once per user per day. |

LLM03 (Supply Chain), LLM04 (Data and Model Poisoning) and LLM08 (Vector and Embedding Weaknesses) do not apply: we use a hosted model, do no training or fine-tuning, and have no retrieval index. Supply-chain risk for npm packages is covered by A06.
