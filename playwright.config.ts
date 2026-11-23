import { defineConfig, devices } from "@playwright/test";
import { getTestDatabaseUrl } from "./test/test-database-url";

const PORT = 3100;

// Until Auth.js lands, the owner stub refuses to run in production, so E2E runs
// against `next dev` on its own port, pointed at the test database (never the
// dev database in .env.local, because process env wins over .env files).
export default defineConfig({
  testDir: "e2e",
  fullyParallel: false,
  workers: 1,
  retries: process.env.CI ? 1 : 0,
  reporter: process.env.CI ? "github" : "list",
  use: {
    baseURL: `http://localhost:${PORT}`,
    trace: "retain-on-failure",
  },
  projects: [{ name: "chromium", use: { ...devices["Desktop Chrome"] } }],
  webServer: {
    command: `npx next dev --port ${PORT}`,
    url: `http://localhost:${PORT}/api/goals`,
    reuseExistingServer: false,
    timeout: 120_000,
    env: {
      DATABASE_URL: getTestDatabaseUrl(),
      DEV_OWNER_ID: "e2e-user",
    },
  },
});
