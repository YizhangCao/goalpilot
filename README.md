This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## GoalPilot setup

### Environment variables

Real values live only in local, gitignored files. Never commit them.

| File | Variable | What it is |
| --- | --- | --- |
| `.env.local` | `DATABASE_URL` | Postgres (Neon) connection string for development |
| `.env.local` | `DEV_OWNER_ID` | Optional. The owner of all goals until Auth.js is wired up (defaults to `dev-user`; refused in production) |
| `.env.test.local` | `TEST_DATABASE_URL` | A **separate** database (e.g. a Neon `test` branch). Integration and E2E tests wipe it. Next.js skips `.env.local` in test mode, so it must go here. |

### Commands

- `npm run db:migrate`: create and apply a migration (`prisma migrate dev`)
- `npm test`: all Vitest projects (`unit`, `ui`, `int`); `npm run test:coverage` enforces 70% lines and branches
- `npm run test:e2e`: Playwright against `next dev` on port 3100, pointed at the test database

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
