import "server-only";
import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().min(1),
  // Temporary owner for all goals until Auth.js is wired up.
  DEV_OWNER_ID: z.string().min(1).optional(),
  NODE_ENV: z.enum(["development", "test", "production"]).default("development"),
});

export type Env = z.infer<typeof envSchema>;

let cached: Env | undefined;

/** Parsed environment. Throws (without echoing values) if anything is missing. */
export function getEnv(): Env {
  if (!cached) {
    const result = envSchema.safeParse(process.env);
    if (!result.success) {
      const names = result.error.issues.map((i) => i.path.join(".")).join(", ");
      throw new Error(`Invalid environment variables: ${names}`);
    }
    cached = result.data;
  }
  return cached;
}
