# LinkedIn Post — DineFlow (v2, post full-stack build)

Fill in the 🔗 placeholders before posting. Pick whichever variant matches your voice —
or post more than one, spaced a few weeks apart, to different audiences.

## 📸 Screenshots to attach (LinkedIn posts support up to 9 images)

Attach these directly to your post — LinkedIn doesn't pull images from links automatically,
so this step matters. In this order:

1. **The live menu page** — `screenshot-menu.png` (also in `case-study-screenshots/` if you
   downloaded the case study bundle). Shows real product photography and working search/filter
   UI. This should be your FIRST image — it's the most visually appealing and immediately
   readable as "a real product."
2. **The "New order received" email** — `screenshot-order-alert-email.jpeg`. Proof the restaurant
   alert system actually works, not just a claimed feature.
3. **The "Order completed" email** — `screenshot-order-completed-email.jpeg`. Pairs with #2 to
   show the full notification loop (restaurant gets alerted → customer gets updates).
4. *(Optional, if you take it before posting)* A screenshot of `/admin` — the dashboard with
   live orders and revenue charts. This is the single most "impressive at a glance" screen if
   you have a clean one; grab it if you have a moment before posting.

Caption the carousel briefly in the post itself (e.g. "Live menu → real order emails, no manual
work") so the images support the text rather than requiring people to guess what they're
looking at.

---

## Option A — Technical deep-dive (best for recruiters/engineers)

I just finished building and shipping a full-stack restaurant SaaS platform, solo,
end to end — DineFlow.

Not a tutorial clone. A real system:

🔐 Real authentication — NextAuth.js sessions, bcrypt-hashed passwords, and the
admin dashboard locked behind two independent layers: route middleware AND a
server-side role check on every single mutating API endpoint.

💳 A real payment gateway — SSLCommerz, fully integrated: hosted checkout, and
critically, a dual-callback pattern (browser redirect + server-to-server webhook)
so a payment can never get lost if a customer's connection drops mid-transaction.
Every payment gets re-validated server-side before an order is ever marked paid —
never trusting a redirect at face value.

📸 Real file uploads — client-side image compression via the Canvas API before
anything hits the server, specifically to avoid deploying a native image library
as a serverless dependency risk.

📧 Real transactional email — order confirmations, status updates, restaurant
alerts, all wrapped so a provider outage can only ever skip an email, never break
checkout.

🗄️ A real PostgreSQL database via Prisma, with a genuinely tricky detail: separate
pooled vs. direct connection strings, because Supabase's connection pooler doesn't
support the prepared statements schema migrations need — a class of bug that trips
up a lot of serverless + Postgres setups.

🛡️ Rate limiting on every abuse-prone endpoint (checkout, login, registration, the
contact form), an explicit cross-customer data-isolation audit, and a documented
security posture rather than a vague "it's secure" claim.

What I'm most proud of isn't any single feature — it's the process. Every phase
was built, deployed, and verified against real infrastructure before the next one
started. I found and fixed real bugs along the way before they ever reached a user:
a payment-status race condition, a database constraint that would've blocked a
legitimate admin action, a type mismatch a production build caught that local dev
never surfaced.

🔗 Live demo: [YOUR LIVE URL]
🔗 Full case study (architecture decisions, bugs found, engineering process): [LINK]
🔗 Source: [YOUR GITHUB REPO, if public]

#webdevelopment #nextjs #typescript #fullstack #postgresql #softwareengineering

---

## Option B — Outcome-focused (best for broader network / non-technical audience)

Built a complete restaurant ordering platform, from scratch, solo — and it's live. 🍔

DineFlow lets customers browse a menu, order, pay online, and track their delivery
in real time — while the restaurant runs everything from an admin dashboard: menu
management, live order tracking, payment reconciliation, sales analytics.

This isn't a demo or a mockup — it has a real database, real user accounts, real
online payment processing, real photo uploads, and automatic email notifications.
Everything a restaurant would actually need to run their ordering online.

Built with Next.js, TypeScript, and PostgreSQL, deployed live on Vercel.

Check it out: [YOUR LIVE URL]
The full engineering write-up: [CASE STUDY LINK]

#webdev #nextjs #reactjs #fullstackdeveloper #buildinpublic

---

## Option C — For clients/freelance work (best if DMs are open for business)

I just shipped DineFlow — a complete restaurant ordering & management platform —
as a demonstration of exactly the kind of work I take on for restaurant and small
business clients.

What's actually built, not just designed:
✅ Customer ordering site — menu, cart, checkout, live order tracking
✅ Admin back-office — manage the menu, watch orders come in live, see sales at a glance
✅ Real online payments (cards, bKash, Nagad, Rocket, bank transfer via SSLCommerz)
   — no third-party marketplace taking a cut of every order
✅ Real user accounts and a properly access-controlled admin panel
✅ Automatic email notifications for every order
✅ Actually deployed and live — you can order from it right now

If you or someone you know runs a restaurant and wants an ordering system that's
genuinely theirs — not rented from a delivery app that owns the customer
relationship — this is the kind of platform I build, and I can build one for you.

🔗 Live demo: [YOUR LIVE URL]
🔗 Full technical breakdown: [CASE STUDY LINK]

DMs open.

#webdevelopment #smallbusiness #restauranttech #freelancedeveloper #saas
