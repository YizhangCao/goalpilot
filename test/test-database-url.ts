import { loadEnvConfig } from "@next/env";

/**
 * Returns TEST_DATABASE_URL (from .env.test.local / .env.test) or throws.
 * Integration tests truncate tables, so they must never fall back to DATABASE_URL.
 */
export function getTestDatabaseUrl(): string {
  loadEnvConfig(process.cwd());
  const url = process.env.TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "TEST_DATABASE_URL is not set. Add it to .env.test.local (a separate test database; it gets truncated).",
    );
  }
  return url;
}
