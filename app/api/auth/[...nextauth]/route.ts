import { NextRequest } from "next/server";
import NextAuth from "next-auth";
import { authOptions } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";
import { apiRateLimited } from "@/lib/api-helpers";

const handler = NextAuth(authOptions);

// NextAuth's catch-all route handles many sub-paths under /api/auth/*
// (session, csrf, providers, signout, etc.) — only the actual login
// attempt (POST to the credentials callback) needs rate limiting here.
// Wrapping the raw NextAuth handler, rather than adding this inside
// lib/auth.ts's authorize() callback, because this route always has
// reliable access to the real NextRequest for IP extraction — that's
// not guaranteed to be true of the arguments NextAuth passes into
// authorize() across versions.
async function rateLimitedPOST(req: NextRequest, ctx: { params: { nextauth: string[] } }) {
  const isLoginAttempt = ctx.params.nextauth?.join("/") === "callback/credentials";
  if (isLoginAttempt) {
    // 10 attempts per 15 minutes per IP — enough for someone who
    // genuinely mistyped their password a few times, tight enough to
    // meaningfully slow a credential-stuffing attempt against this route.
    const rateLimit = checkRateLimit(`login:${getClientIp(req)}`, 10, 15 * 60 * 1000);
    if (!rateLimit.success) return apiRateLimited(rateLimit.resetAt);
  }
  return handler(req, ctx);
}

export { handler as GET, rateLimitedPOST as POST };