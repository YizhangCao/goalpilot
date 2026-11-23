import { vi } from "vitest";

/** Shared spy for `useRouter().refresh` in component tests. */
export const refresh = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh, push: vi.fn(), replace: vi.fn(), back: vi.fn(), prefetch: vi.fn() }),
}));

/** Stubs global fetch with a single JSON (or empty) response and returns the spy. */
export function mockFetch(status: number, body?: unknown) {
  const fetchMock = vi.fn(async () =>
    body === undefined ? new Response(null, { status }) : Response.json(body, { status }),
  );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}
