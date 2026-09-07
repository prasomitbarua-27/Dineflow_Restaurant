import { NextResponse } from "next/server";
import { ZodError } from "zod";

/** Standard error shape returned by every API route in this project. */
export function apiError(message: string, status = 400) {
  return NextResponse.json({ error: message }, { status });
}

/** Turns a Zod validation failure into a readable 400 response. */
export function apiValidationError(err: ZodError) {
  const message = err.errors.map((e) => `${e.path.join(".")}: ${e.message}`).join("; ");
  return apiError(`Invalid request: ${message}`, 400);
}

/** Standard 429 response for a rate-limited request, with a Retry-After
 * header so well-behaved clients know how long to back off. */
export function apiRateLimited(resetAt: number) {
  const retryAfterSeconds = Math.max(1, Math.ceil((resetAt - Date.now()) / 1000));
  return NextResponse.json(
    { error: "Too many requests. Please wait a moment and try again." },
    { status: 429, headers: { "Retry-After": String(retryAfterSeconds) } }
  );
}

/**
 * Wraps a route handler so any unexpected error (e.g. a database connection
 * issue) becomes a clean 500 response instead of crashing the function or
 * leaking a stack trace to the client.
 */
export function withErrorHandling<T extends unknown[]>(
  handler: (...args: T) => Promise<Response>
) {
  return async (...args: T): Promise<Response> => {
    try {
      return await handler(...args);
    } catch (err) {
      if (err instanceof ZodError) {
        return apiValidationError(err);
      }
      console.error("API error:", err);
      return apiError("Something went wrong. Please try again.", 500);
    }
  };
}
