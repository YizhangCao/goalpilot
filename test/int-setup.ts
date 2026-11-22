import { getTestDatabaseUrl } from "./test-database-url";

// Point the app's Prisma client at the test database before anything imports it.
process.env.DATABASE_URL = getTestDatabaseUrl();
