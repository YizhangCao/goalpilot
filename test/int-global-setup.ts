import { execSync } from "node:child_process";
import { getTestDatabaseUrl } from "./test-database-url";

/** Applies all migrations to the test database once per run. */
export default function setup() {
  const url = getTestDatabaseUrl();
  execSync("npx prisma migrate deploy", {
    stdio: ["ignore", "ignore", "inherit"],
    env: { ...process.env, DATABASE_URL: url },
  });
}
