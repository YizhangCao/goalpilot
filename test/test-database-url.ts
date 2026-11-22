import { loadEnvConfig } from "@next/env";

const silent = { info() {}, error() {} };

/**
 * Returns TEST_DATABASE_URL (from .env.test.local / .env.test) or throws.
 * Integration and E2E tests wipe tables, so they never fall back to DATABASE_URL.
 */
export function getTestDatabaseUrl(): string {
  // Load in "test" mode (which reads .env.test.local and skips .env.local),
  // even when the caller, like Playwright, doesn't set NODE_ENV=test.
  const previous = process.env.NODE_ENV;
  Object.assign(process.env, { NODE_ENV: "test" });
  loadEnvConfig(process.cwd(), false, silent);
  Object.assign(process.env, { NODE_ENV: previous });
  if (previous === undefined) delete (process.env as Record<string, string | undefined>).NODE_ENV;

  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Add it to .env.test.local (a separate test database; it gets wiped).",
    );
  }
  return url;
}
