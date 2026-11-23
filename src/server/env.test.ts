import { afterEach, describe, expect, it, vi } from "vitest";

async function loadEnv(env: Record<string, string | undefined>) {
  vi.resetModules();
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return import("./env");
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("getEnv", () => {
  it("parses the environment", async () => {
    const { getEnv } = await loadEnv({ DATABASE_URL: "postgres://x", NODE_ENV: "test", DEV_OWNER_ID: undefined });
    expect(getEnv()).toMatchObject({ DATABASE_URL: "postgres://x", NODE_ENV: "test" });
  });

  it("names missing variables without echoing any values", async () => {
    const { getEnv } = await loadEnv({ DATABASE_URL: undefined, NODE_ENV: "staging-secret-value" });
    expect(() => getEnv()).toThrow("Invalid environment variables: DATABASE_URL, NODE_ENV");
    expect(() => getEnv()).not.toThrow(/staging-secret-value/);
  });
});
