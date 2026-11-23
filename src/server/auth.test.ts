import { afterEach, describe, expect, it, vi } from "vitest";

async function loadAuth(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./auth");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getCurrentOwnerId (pre-Auth.js stub)", () => {
  const base = { DATABASE_URL: "postgres://unused" };

  it("returns DEV_OWNER_ID when set", async () => {
    const { getCurrentOwnerId } = await loadAuth({ ...base, NODE_ENV: "development", DEV_OWNER_ID: "yizhang" });
    await expect(getCurrentOwnerId()).resolves.toBe("yizhang");
  });

  it("falls back to a fixed dev owner outside production", async () => {
    const { getCurrentOwnerId } = await loadAuth({ ...base, NODE_ENV: "development", DEV_OWNER_ID: undefined });
    await expect(getCurrentOwnerId()).resolves.toBe("dev-user");
  });

  it("refuses to run in production, even with DEV_OWNER_ID set", async () => {
    const { getCurrentOwnerId } = await loadAuth({ ...base, NODE_ENV: "production", DEV_OWNER_ID: "yizhang" });
    await expect(getCurrentOwnerId()).rejects.toThrow(/not available in production/);
  });
});
