import "server-only";
import { z, ZodError } from "zod";

/** Thrown for request bodies that aren't valid JSON. */
export class BadRequestError extends Error {}

export async function readJson(request: Request): Promise<unknown> {
  try {
    return await request.json();
  } catch {
    throw new BadRequestError("Request body must be valid JSON");
  }
}

export const notFound = () => Response.json({ error: "Goal not found" }, { status: 404 });

export const invalidId = () => Response.json({ error: "Invalid goal id" }, { status: 400 });

/** Maps errors to safe responses. Never echoes internals or input values. */
export function errorResponse(error: unknown): Response {
  if (error instanceof ZodError) {
    return Response.json(
      { error: "Invalid input", fields: z.flattenError(error).fieldErrors },
      { status: 400 },
    );
  }
  if (error instanceof BadRequestError) {
    return Response.json({ error: error.message }, { status: 400 });
  }
  return Response.json({ error: "Something went wrong" }, { status: 500 });
}
