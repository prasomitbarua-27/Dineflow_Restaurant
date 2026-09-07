# Phase 8 — Security Hardening Audit

A record of what was checked, what was found, and what was actually
built this phase — so you (or a future developer) don't have to re-derive
this from scratch, and so a client considering this codebase has a real
audit trail rather than just a "trust me."

---

## 1. Input validation — audited every API route

Ran a systematic check for Zod validation across all 15 API routes.
Result: **11 of 15 use `.parse()` directly.** The other 4 were reviewed
individually rather than blindly adding Zod to satisfy a checklist:

| Route | Why it doesn't use `.parse()` | Actual protection |
|---|---|---|
| `app/api/auth/[...nextauth]/route.ts` | Delegates entirely to NextAuth's own handler | NextAuth's internal request handling; the `authorize()` callback in `lib/auth.ts` has explicit presence checks (`if (!credentials?.email \|\| !credentials?.password) return null`) |
| `app/api/upload/route.ts` | Receives a `File` object via `FormData`, not JSON — Zod isn't a natural fit for validating file uploads | Manual `Set.has(file.type)` and `file.size` checks, enforced server-side (never trusting the client-side check alone) |
| `app/api/payments/sslcommerz/{success,fail,cancel,ipn}/route.ts` | Receive redirects/webhooks *from SSLCommerz*, not from our own frontend — a Zod schema can validate shape, but can't validate that the data is genuinely from SSLCommerz | The actual security boundary: every payment is re-validated server-to-server via `validateSSLCommerzPayment()` against SSLCommerz's own API before ever being trusted. A schema on the redirect body would be security theater here — the redirect itself could be spoofed by anyone regardless of how well-formed it looks. |

**Conclusion:** input validation is appropriately applied everywhere it's
the right tool. The 4 exceptions aren't gaps — they use the correct
control for what they're actually receiving.

## 2. Rate limiting — built this phase (genuinely new)

Added `lib/rate-limit.ts` — a lightweight in-memory limiter — to the
three routes most exposed to abuse:

| Route | Limit | Reasoning |
|---|---|---|
| `POST /api/orders` (checkout) | 10 orders / 10 min / IP | Generous enough for a real customer retrying a failed payment; tight enough to blunt scripted order spam |
| `POST /api/register` | 5 accounts / hour / IP | Registration is a one-time action; stricter limit is safe |
| `POST /api/auth/callback/credentials` (login) | 10 attempts / 15 min / IP | Slows credential-stuffing without locking out someone who mistyped their password a few times |
| `POST /api/contact` | 5 messages / 10 min / IP | Added when the contact form was wired to real email — this route triggers an outbound email on every request, exactly the kind of endpoint worth protecting |

**⚠️ Important limitation, documented directly in `lib/rate-limit.ts`:**
this is in-memory, not distributed. On Vercel's serverless platform,
different requests can land on different function instances, and this
Map doesn't persist across them. It still meaningfully raises the bar
(Vercel does reuse warm instances for bursts of requests close together
in time — exactly the pattern a scripted attack looks like), but it
isn't a mathematically airtight guarantee under real production load.
The documented upgrade path is Upstash Redis (Vercel's own recommended
pairing, free tier, small integration effort) if this ever needs to be
bulletproof rather than "meaningfully better than nothing."

## 3. Cross-customer data isolation — audited, no gaps found

Explicitly re-verified every route that touches order data:

- `GET /api/orders` (no query param) → requires `requireAdmin()`
- `GET /api/orders?mine=true` → requires *any* session, scoped to
  `WHERE userId = session.user.id` — a customer can never pass another
  user's id, since it's read from their own session token, never from
  a request parameter
- `GET /api/orders/[id]` → intentionally open (no auth) by design, so a
  guest can view their own order confirmation/tracking without an
  account — documented in the route file itself, including the known
  trade-off (order numbers are a short, somewhat guessable code; the
  internal cuid id is not)
- `PATCH /api/orders/[id]` → requires `requireAdmin()`

Every PATCH/DELETE route across foods, categories, orders, and settings
was re-confirmed to call `requireAdmin()` as the very first line inside
the handler (see the grep-verified list — all 4 files, all covered).

## 4. Service role key isolation — confirmed, no leak

`SUPABASE_SERVICE_ROLE_KEY` (which bypasses all database access
restrictions) is used in exactly one place: `lib/supabase-admin.ts`,
which is imported by exactly one file: `app/api/upload/route.ts` — a
server-only API route, never a client component. Verified by grepping
every file that imports `supabase-admin` and confirming none carry a
`"use client"` directive.

Also confirmed: neither `SUPABASE_SERVICE_ROLE_KEY` nor any other secret
ever has a `NEXT_PUBLIC_` prefix anywhere in the codebase (that prefix is
what makes a Next.js env var visible to the browser — grepped for it
explicitly rather than assuming).

## 5. CSRF protection

NextAuth handles CSRF for its own endpoints (login, session) with a
built-in token system. For this project's custom API routes, protection
comes from NextAuth's session cookie defaulting to `SameSite=Lax`, which
blocks the cookie from being sent on cross-site POST requests from
another origin in all modern browsers — the standard, currently
recommended baseline for a Next.js app that isn't handling something
higher-stakes than a restaurant's order system. A dedicated CSRF token
system on top of this would be reasonable for a bank; it would be
over-engineering here.

## 6. Dependency audit

**Not run in this sandbox** — no internet access to actually execute
`npm audit` or verify results. **You need to run this yourself:**

```bash
npm audit
```

If it reports vulnerabilities, `npm audit fix` resolves most
automatically (re-test after running it — an automatic fix can
occasionally bump a package in a way that changes behavior). Report back
anything `npm audit fix` can't resolve automatically and we'll look at
it together.

## 7. Debug/test data cleanup

- No `console.log` of sensitive data anywhere in `app/api` or `lib`
  (checked explicitly — only `console.error`/`console.warn` calls exist,
  which is appropriate)
- No leftover test-only or debug-only API routes
- No `TODO`/`FIXME`/`XXX` markers indicating unfinished security work
- **The seeded admin password (`ChangeMe123!`) is still active** — this
  was flagged back in Phase 1/3 and remains the single most important
  manual step before this touches real users. See the checklist below.

---

## ⚠️ Action required

1. **Change the seeded admin password.** Log in as
   `admin@dineflow.example` / `ChangeMe123!`, and either add a
   change-password flow (not built yet — there's no UI for a logged-in
   user to change their own password) or, faster for now, update it
   directly via Prisma Studio (`npm run db:studio` → `User` table → hash
   a new password with bcrypt and paste it in) or a one-off script.
2. Run `npm run db:push` — no schema change this phase, but worth
   confirming your database is still in sync before testing.
3. Run `npm audit` yourself and report back what it finds.
4. Test rate limiting: try placing 11 orders in quick succession, or
   registering 6 accounts in an hour — confirm the 6th/11th gets a 429
   response instead of succeeding.
5. Once confirmed, `git add . && git commit && git push`.
