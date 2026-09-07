# DineFlow — Complete Project TODO
### From current state → live, full-stack, business-ready, portfolio-ready

**Current status (as of this file):** Frontend deployed live on Vercel at
`dineflow-restaurant-two.vercel.app`, Supabase database created and seeded,
but the running app still reads/writes mock data (Context + localStorage),
not the real database. Authentication, payments, and image uploads are
still UI-only/mocked.

Use this file as your master checklist. Check items off as you go. Where a
step needs me to write code, say "let's do step X" and I'll build it.

---

## PHASE 2 — Connect the app to the real database ✅ CODE COMPLETE

*Goal: admin edits and customer orders persist in Supabase, not the browser.*

- [x] Build API routes for **Categories**: `GET/POST /api/categories`, `PATCH/DELETE /api/categories/[id]`
- [x] Build API routes for **Foods**: `GET/POST /api/foods`, `PATCH/DELETE /api/foods/[id]`
- [x] Build API routes for **Orders**: `GET/POST /api/orders`, `PATCH /api/orders/[id]` (status updates)
- [x] Build API route for **Restaurant Settings**: `GET/PATCH /api/settings`
- [x] Replace `CatalogContext`'s localStorage logic with real `fetch()` calls to the new API routes
- [x] Replace `OrderContext`'s localStorage logic with real `fetch()` calls
- [x] Add loading and error states everywhere data is now fetched over the network
- [ ] **YOU NEED TO DO THIS:** run `npm run db:push` again — the schema changed (`Food.categoryId` is now nullable) — see `progress.md`
- [ ] **YOU NEED TO DO THIS:** test the full loop locally (see `progress.md` → "How to test this")
- [ ] Test: add a food in `/admin/foods`, refresh the page, confirm it's still there
- [ ] Test: open the site in two different browsers/devices, confirm both see the same live menu
- [ ] Push to GitHub + let Vercel redeploy
- [x] Known gap resolved: admin can now toggle a food's "Popular"/"Featured" flags from the UI (added to `FoodFormModal`)

---

## PHASE 3 — Real authentication ✅ CODE COMPLETE

*Goal: `/admin` is locked behind a real login; customers can create real accounts.*

- [x] Install and configure NextAuth.js (Credentials provider + Prisma-backed user lookup)
- [x] Create `app/api/auth/[...nextauth]/route.ts`
- [x] Wire the existing Login/Register UI to actually call NextAuth's `signIn()` / a real `/api/register` route
- [x] Hash passwords with bcrypt on registration
- [x] Add `middleware.ts` that redirects unauthenticated users away from `/admin/*`
- [x] Add a role check so only `ADMIN` users (not regular customers) can reach `/admin/*`
- [x] Every mutating API route (foods/categories/orders/settings POST/PATCH/DELETE) now calls `requireAdmin()` server-side — the "⚠️ not yet protected" warnings from Phase 2 are resolved
- [x] `GET /api/orders` now requires ADMIN; added `GET /api/orders?mine=true` (requires any login) for customer order history
- [x] Wire "My Orders" to show only the logged-in customer's own orders — page now requires login
- [x] Navbar shows real logged-in state (name + logout + admin link) instead of a static "Login" link
- [ ] **YOU NEED TO DO THIS:** run `npm install` (new dependencies: `next-auth`, `@next-auth/prisma-adapter`, `bcryptjs`, `tailwind-merge`)
- [ ] **YOU NEED TO DO THIS:** change the seeded admin password (`ChangeMe123!`) — see `progress.md`
- [ ] Test: log out, try visiting `/admin` directly — confirm you're redirected to login
- [ ] Test: register a new customer account, place an order, confirm it appears in "My Orders"
- [ ] Test: log in as the seeded admin, confirm `/admin` loads and all CRUD actions still work
- [ ] Known gap: guest checkout orders (no account) aren't linked to any user — this is intentional (forcing login to order adds friction), but means a guest can only track that one order via its direct link, not see order history. Worth a banner nudging guests to create an account after checkout, as a future polish item.

---

## PHASE 4 — Real payments ✅ DONE AND VERIFIED LIVE (SSLCommerz)

*Goal: customers can pay online, not just choose Cash on Delivery.*

- [x] Decided on gateway: **SSLCommerz** — best fit for a Bangladeshi restaurant, one integration covers cards + bKash + Nagad + Rocket + bank transfer, and its sandbox needs no business verification (good for portfolio demo purposes too)
- [x] Built `lib/sslcommerz.ts` — session initiation + server-to-server validation, following SSLCommerz's documented Session API v4 contract
- [x] Built the checkout → payment redirect flow (`app/api/payments/sslcommerz/init/route.ts`, wired into checkout page)
- [x] Built success/fail/cancel redirect handlers AND an IPN webhook handler for reliability (see `docs/PHASE-4-PAYMENT-SETUP.md` for why both exist)
- [x] Built a `/checkout/payment-failed` page with a "Try Payment Again" retry flow against the same order
- [x] Removed the old "payment is mocked" fake card-number form fields from checkout
- [x] Fixed a real bug found during review: order creation was marking `card` payments as `PAID` immediately at checkout, before the customer ever reached SSLCommerz. Now every order starts `PENDING`; only a validated SSLCommerz confirmation (or COD collection) marks it paid.
- [x] Admin Payments page now shows the real SSLCommerz `paymentValId` as a "Gateway Ref" column (for reconciling against SSLCommerz's own dashboard) instead of a fake synthetic transaction id
- [x] Signed up for SSLCommerz sandbox, ran `db:push`, tested a full successful payment, a failed payment, and the retry flow — **all confirmed working**
- [x] Fixed `data/orders.ts` — the 12 mock orders were missing the new `paymentValId` field, which broke the Vercel production build (TypeScript error, not caught locally in this sandbox since there's no way to run `next build` here)
- [x] Fixed `app/(customer)/checkout/payment-failed/page.tsx` — `useSearchParams()` needs a `<Suspense>` boundary for Next.js's static prerendering, which also broke the Vercel build. Restructured into a `PaymentFailedContent` inner component wrapped by the default-exported `PaymentFailedPage`.
- [x] **Deployed to Vercel and confirmed working in production** — full sandbox payment flow (success, fail, cancel, retry) verified live, not just locally
- [ ] Register a **live** merchant account only once you have a real client ready to accept real payments (requires business documents, takes a few business days — see the last section of the setup doc)
- [ ] Switch `SSLCOMMERZ_IS_LIVE` to `"true"` with live credentials only after live testing

---

## PHASE 5 — Real image uploads ✅ DONE AND VERIFIED

*Goal: the restaurant owner can upload their own food photos through the admin panel.*

- [x] Built `lib/image-compress.ts` — client-side resize/compress via the browser's Canvas API (no new dependency, no server-side native library needed)
- [x] Built `app/api/upload/route.ts` — admin-only, validates file type/size server-side (never trusts the client-side check alone), uploads to Supabase Storage, returns the public URL
- [x] Built `components/ui/ImageUploadField.tsx` — reusable upload UI with preview, used by both `FoodFormModal` and `CategoryFormModal`, with "paste a URL instead" kept as a fallback option
- [x] Replaced the plain "Image URL" text field in both admin forms
- [x] Created the `food-images` bucket in Supabase Storage
- [x] Tested: uploaded a real (large) food photo from the admin panel — compression worked, displays correctly on `/menu`, confirmed present in Supabase's Storage dashboard

---

## PHASE 6 — Notifications ✅ DONE AND VERIFIED (Resend)

*Goal: customers and the restaurant get notified automatically, not just via on-screen UI.*

- [x] **Admin-side in-app live updates** — done ahead of schedule. `app/admin/layout.tsx` polls every 10 seconds and toasts "New order received" the moment one comes in. `AdminHeader`'s notification bell shows real orders needing attention.
- [x] Chose **Resend** — simple API, generous free tier (3,000/month), no SMTP setup
- [x] Built `lib/email.ts` — three email types (confirmation, status update, new-order alert), a shared inline-styled HTML shell (table-based layout for email-client compatibility), and a `sendEmailSafely()` wrapper so a Resend outage or missing API key can never break checkout or an admin action — failures are logged and swallowed, never thrown
- [x] Wired the **confirmation + restaurant alert** emails into `app/api/orders/route.ts` (fires immediately for Cash on Delivery) AND `app/api/payments/sslcommerz/{success,ipn}/route.ts` (fires only once SSLCommerz actually validates payment for online orders — deliberately NOT at order creation, so a customer never gets a "confirmed" email for a payment that then fails)
- [x] Wired the **status-update** email into `app/api/orders/[id]/route.ts` — fires only when `status` actually changes to a different value (compared in DB-enum format, not the frontend's lowercase strings, to avoid a same-value comparison bug that would've fired on every PATCH)
- [x] Idempotency verified: the IPN handler's existing `if (order.paymentStatus === "PAID") return` guard means the success-redirect and IPN webhook racing each other can't send duplicate confirmation emails
- [x] Signed up for Resend, added API key, ran `npm install`
- [x] Tested: COD order → both confirmation and restaurant-alert emails arrived; order status changes → status emails arrived correctly; confirmed via Resend's own Logs dashboard (all `POST /emails` → `200`)
- [ ] (Optional, not pursued) SMS notifications via Twilio
- [ ] (Optional, not pursued) Browser push notifications via the Web Notifications API

---

## PHASE 7 — Deployment hardening (skipped for now)

*Custom domain, staging environment, analytics/monitoring — deliberately skipped per user's direction. The site is already live and stable on a Vercel-issued domain; a custom domain matters more once there's a real client/business name to point it at. Revisit if that becomes relevant.*

---

## PHASE 8 — Security hardening ✅ COMPLETE — see `docs/PHASE-8-SECURITY-AUDIT.md`

*Goal: the app doesn't fall over or leak data under real-world use.*

- [x] Audited input validation across all 16 API routes — 12 use Zod directly; the other 4 (NextAuth, file upload, SSLCommerz callbacks) use the correct alternative control for what they actually receive (see audit doc for why)
- [x] Built rate limiting (`lib/rate-limit.ts`) and applied it to checkout, registration, login, AND the new contact form route — the four routes most exposed to abuse. Documented, honest limitation: in-memory, not distributed — meaningfully raises the bar but Upstash Redis is the noted upgrade path for airtight production guarantees.
- [x] Built a real **change-password feature** (`/api/account/change-password` + a section in `/admin/settings`) — closes the gap where the only way to change the seeded admin password was manual Prisma Studio editing
- [x] Audited cross-customer data isolation — no gaps found; every order-related route re-verified
- [x] Confirmed `SUPABASE_SERVICE_ROLE_KEY` isolation — used in exactly one server-only file, grepped to confirm no client-component leak, no `NEXT_PUBLIC_` prefix anywhere on a secret
- [x] Reviewed CSRF posture — NextAuth's own endpoints are protected by its built-in token system; custom routes rely on `SameSite=Lax` session cookies, the appropriate baseline for this project's risk level
- [x] Checked for debug/test artifacts — none found (no sensitive `console.log`s, no leftover test routes, no `TODO`/`FIXME` security markers)
- [x] Fixed a real production login bug found this round: `authorize()` in `lib/auth.ts` wasn't lowercasing the email before the database lookup, but registration does — meant any casing mismatch silently failed login. Fixed.
- [ ] **YOU NEED TO DO THIS:** change the seeded admin password using the new Change Password feature in `/admin/settings` (no more manual DB editing needed)
- [ ] **YOU NEED TO DO THIS:** run `npm audit` yourself (couldn't run it in this sandbox — no internet access) and report findings
- [ ] Test: confirm rate limiting actually kicks in (try 11 rapid checkout attempts, or 6 registrations in an hour)
- [ ] Test: the new Change Password feature — wrong current password should be rejected; correct flow should let you log in with the new password afterward

---

## PHASE 9 — QA & testing

*Goal: confidence that everything works before you show it to the client.*

- [ ] Full click-through of every customer page on both desktop and mobile
- [ ] Full click-through of every admin page on both desktop and mobile
- [ ] Test the complete order flow: browse → cart → checkout → confirmation → tracking → admin status update → customer sees update
- [ ] Test empty states: empty cart, no orders yet, no search results
- [ ] Test error states: what happens if the network fails mid-checkout?
- [ ] Test on a real phone, not just a resized browser window
- [ ] Ask 2–3 people outside the project to try ordering something and note anything confusing

---

## PHASE 10 — Client handover

*Goal: the client can actually run their own business on this, without you.*

- [ ] Write a short **Admin User Guide**: how to add a food, change an order's status, edit settings — with screenshots
- [ ] Change all default/seeded passwords before handing over credentials
- [ ] Hand over: Vercel project access (or transfer ownership), Supabase project access, domain registrar access if applicable
- [ ] Document the tech stack and where the code lives (GitHub repo) in case they hire another developer later
- [ ] Agree on a support/maintenance plan: are you available for bug fixes, a monthly retainer, or is this a one-time handoff?
- [ ] Back up the database (Supabase has automatic backups on paid plans — confirm the plan covers this)
- [ ] Do a final walkthrough call with the client showing them the admin panel live

---

## PORTFOLIO DELIVERABLES

- [x] `case-study.html` — **rewritten** to reflect the full-stack build: expanded architecture decisions, a dedicated "bugs found before they shipped" section, an engineering-process timeline across all 6 build phases, and an updated status table
- [x] `case-study.pdf` — regenerated from the rewritten HTML (7 pages, up from 4)
- [x] `linkedin-post.md` — **rewritten**, 3 variants (technical deep-dive, outcome-focused, client/freelance pitch), grounded in the real technical decisions and real bugs caught during this build
- [x] `portfolio-description.md` — **rewritten** at all three lengths to match

**Still to do before publishing:**
- [ ] Fill in the 🔗 placeholders in all four files: your live URL, your GitHub repo link (if public), your LinkedIn profile link in the case study footer
- [ ] Take real screenshots of the finished product and drop them into the case study's placeholder boxes (dashed-border sections, clearly marked) — the product is fully live now, so there's no reason left to ship without them
- [ ] If you want pixel-perfect Fraunces/Inter typography in the PDF (it currently falls back to system fonts, since the sandbox that generated it has no internet access to fetch Google Fonts), open `case-study.html` in your own browser and use Print → Save as PDF instead of the bundled `case-study.pdf`
- [ ] Consider making the GitHub repo public (if it isn't already) before posting, since two of the three LinkedIn variants and the case study both link to it
