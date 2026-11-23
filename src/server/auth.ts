import "server-only";
import { getEnv } from "@/server/env";

const FALLBACK_DEV_OWNER = "dev-user";

/**
 * The owner of the current request.
 *
 * Temporary stub until Auth.js is wired up: returns DEV_OWNER_ID (or a fixed
 * dev owner) and refuses to run in production. Callers never take an owner ID
 * from the request; when Auth.js lands, only this function's body changes.
 */
export async function getCurrentOwnerId(): Promise<string> {
  const env = getEnv();
  if (env.NODE_ENV === "production") {
    throw new Error("getCurrentOwnerId stub is not available in production; wire up Auth.js first");
  }
  return env.DEV_OWNER_ID ?? FALLBACK_DEV_OWNER;
}
