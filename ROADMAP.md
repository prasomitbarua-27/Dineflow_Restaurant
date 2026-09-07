# DineFlow — Production Roadmap

Tracking progress from frontend prototype → live, full-stack, client-ready product.

| Phase | Description | Status |
|---|---|---|
| 1 | Database (Supabase Postgres + Prisma schema + seed data) | 🟡 In progress — see `docs/PHASE-1-DATABASE-SETUP.md` |
| 2 | Backend API routes (foods, categories, orders, settings) replacing mock Context state | ⬜ Not started |
| 3 | Real authentication (NextAuth.js) — customer accounts + protected admin routes | ⬜ Not started |
| 4 | Real payments (gateway integration — deferred; Cash on Delivery live first) | ⬜ Not started |
| 5 | Image uploads via Supabase Storage (replacing hardcoded Unsplash URLs) | ⬜ Not started |
| 6 | Order notifications (confirmation email to customer, new-order alert to restaurant) | ⬜ Not started |
| 7 | Deployment (Vercel + custom domain + SSL + environment variables) | ⬜ Not started |
| 8 | Security hardening (input validation, rate limiting, secrets review) | ⬜ Not started |
| 9 | QA & testing (cross-device, edge cases, error handling) | ⬜ Not started |
| 10 | Client handover (admin guide, credentials handoff, support plan) | ⬜ Not started |

## Key decisions made

- **Database:** Supabase (PostgreSQL + Storage)
- **Auth:** NextAuth.js (self-hosted, Credentials provider + Prisma adapter)
- **Payments:** Cash on Delivery live at launch; online gateway (likely SSLCommerz) added post-launch
- **Hosting:** Vercel (assumed — confirm before Phase 7)

## How to pick this back up in a new session

If continuing this project later or with a different assistant session, share:
1. This file (`ROADMAP.md`)
2. `docs/PHASE-1-DATABASE-SETUP.md` (and any other `docs/PHASE-*.md` files added later)
3. Whether the steps in the current in-progress phase have been completed
