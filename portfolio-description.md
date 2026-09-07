# Portfolio Project Description — DineFlow (v2, post full-stack build)

Use the length that fits your portfolio site's format.

---

## One-liner (for a project card / grid)

A full-stack restaurant SaaS platform with real authentication, payment processing,
and cloud infrastructure — not a demo, a working system.

---

## Short description (2–3 sentences)

DineFlow is a production-grade restaurant ordering and management platform: a
customer storefront with real online payments and order tracking, paired with an
admin back office protected by real authentication and role-based access control.
Built solo with Next.js, TypeScript, and PostgreSQL, integrating a real payment
gateway (SSLCommerz), cloud file storage, and transactional email — deployed and
verified live on Vercel.

---

## Full description (for a dedicated project page)

**DineFlow — Restaurant Ordering & Management Platform**

DineFlow is a complete, live restaurant SaaS product — not a portfolio piece
dressed up to look finished, but a system built to the point a real restaurant
could run their ordering operation on it.

**Customer-facing:** menu browsing with search, category, and price filtering; a
persistent cart; a full checkout flow supporting both real online payment
(SSLCommerz — cards, bKash, Nagad, Rocket, bank transfer) and Cash on Delivery;
account registration and login; and a real-time visual order tracker.

**Admin-facing:** a dashboard locked behind authentication and role-based access
control, enforced at two independent layers (route middleware and server-side
checks on every API endpoint); menu and category management with real photo
uploads (client-side compressed before storage); a live order pipeline with
automatic in-app notifications for new orders; a payments view reconciled against
the real payment gateway's own transaction references; and sales analytics.

**Infrastructure:** a real PostgreSQL database (Prisma + Supabase), NextAuth.js
session-based authentication with bcrypt password hashing, a real payment gateway
integration built with a dual-callback reliability pattern (browser redirect plus
a server-to-server webhook, so a payment can never be lost to a dropped
connection), cloud object storage for uploaded images, and automatic transactional
email (Resend) for order confirmations, status updates, and restaurant alerts —
designed so an email-provider outage can never break checkout.

The project was built in verified, sequential phases — frontend first, then
database, authentication, payments, media, and notifications — each one deployed
and tested against real infrastructure before the next began. Several real bugs
were found and fixed during development, including a payment-status race
condition, a database constraint that would have blocked a legitimate admin
action, and a type mismatch a production build caught that local development
never surfaced.

**Tech stack:** Next.js 14 (App Router), TypeScript, Tailwind CSS, Prisma ORM,
PostgreSQL (Supabase), Supabase Storage, NextAuth.js, SSLCommerz, Resend, Zod,
Recharts, deployed on Vercel.

**Live demo:** [your live URL]
**Source:** [your GitHub link, if public]

---

## Tags / keywords (for filtering on a portfolio site)

Next.js, TypeScript, React, Tailwind CSS, PostgreSQL, Prisma, Supabase,
Full-Stack, SaaS, Authentication, Payment Integration, REST API, Cloud Storage,
Transactional Email, E-commerce, Admin Dashboard
