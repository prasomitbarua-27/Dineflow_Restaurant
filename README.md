# DineFlow — Restaurant Management SaaS (Frontend Prototype)

DineFlow is a modern restaurant ordering and management platform, built as a portfolio
project. It has two experiences in one codebase:

- **Customer storefront** — browse the menu, search & filter, view food details, add to
  cart, check out, and track an order in real time.
- **Admin dashboard** — manage foods, categories, and orders; review payments; view sales
  analytics; and configure restaurant settings.

> **This is a frontend prototype.** It uses realistic mock data and local/browser state.
> There is no real database, authentication, payment gateway, or AI integration yet — see
> [Future Roadmap](#future-roadmap) for how those slot in later.

---

## Features

### Customer
- Home page (hero, featured categories, popular dishes, story, CTA)
- Full menu with search, category tabs, price filter, and sorting
- Food details page with quantity selector and related dishes
- Cart with quantity controls, subtotal/delivery/total, persisted to `localStorage`
- Checkout (customer info, delivery/pickup, mock payment method, order summary)
- Order confirmation page
- Visual order tracker (Placed → Confirmed → Preparing → Ready → Completed)
- My Orders history page (with loading & empty states)
- Login / Register (UI-only, mock authentication)

### Admin
- Dashboard with stat cards, revenue/order charts, popular foods, recent orders
- Food management — add / edit / delete / toggle availability
- Category management — add / edit / delete / toggle visibility
- Order management — filter by status, update order status (reflected in customer tracking)
- Payment overview — revenue summary + transaction table (mock)
- Analytics — 30-day trends, category performance, average order value
- Settings — restaurant info, opening hours, currency & delivery preferences

All admin CRUD operations use shared React Context + `localStorage`, so changes made in
the admin dashboard (e.g. marking a food unavailable, or moving an order to "Preparing")
are immediately reflected on the customer-facing site — without a real backend.

---

## Tech Stack

| Layer       | Choice                                   |
|-------------|-------------------------------------------|
| Framework   | Next.js 14 (App Router)                   |
| Language    | TypeScript                                |
| Styling     | Tailwind CSS                              |
| Icons       | lucide-react                              |
| Charts      | Recharts                                  |
| State       | React Context + hooks, `localStorage`     |

No database, ORM, auth library, or payment SDK is included yet — by design, for this phase.

---

## Project Structure

```
dineflow/
├─ app/
│  ├─ (customer)/          # customer-facing route group (has Navbar + Footer)
│  │  ├─ page.tsx           # home
│  │  ├─ menu/page.tsx
│  │  ├─ menu/[id]/page.tsx
│  │  ├─ cart/page.tsx
│  │  ├─ checkout/page.tsx
│  │  ├─ order-confirmation/[id]/page.tsx
│  │  ├─ track-order/[id]/page.tsx
│  │  ├─ my-orders/page.tsx
│  │  ├─ login/page.tsx
│  │  ├─ register/page.tsx
│  │  ├─ about/page.tsx
│  │  └─ contact/page.tsx
│  ├─ admin/                # admin dashboard route group (has Sidebar + Header)
│  │  ├─ page.tsx           # dashboard overview
│  │  ├─ foods/page.tsx
│  │  ├─ categories/page.tsx
│  │  ├─ orders/page.tsx
│  │  ├─ payments/page.tsx
│  │  ├─ analytics/page.tsx
│  │  └─ settings/page.tsx
│  ├─ layout.tsx            # root layout — fonts + context providers
│  └─ globals.css
├─ components/
│  ├─ ui/                   # Button, Input, Modal, Badge, EmptyState, etc.
│  ├─ layout/                # Navbar, Footer
│  ├─ customer/               # Hero, FoodCard, CategoryCard, MenuBrowser, …
│  ├─ cart/                    # CartItemRow, CartSummary
│  ├─ order/                    # OrderTracker, OrderStatusBadge, OrderCard
│  └─ admin/                     # Sidebar, StatCard, charts, form modals, …
├─ context/                  # CatalogContext, CartContext, OrderContext, ToastContext
├─ data/                     # mock foods, categories, orders, analytics, payments
├─ lib/                      # utils.ts (formatting, id generation, etc.)
├─ types/                    # shared TypeScript interfaces
└─ public/
```

---

## Getting Started

**Prerequisites:** [Node.js](https://nodejs.org) 18.17 or newer.

1. **Install dependencies**

   ```bash
   npm install
   ```

2. **Start the development server**

   ```bash
   npm run dev
   ```

3. **Open the app**

   Visit [http://localhost:3000](http://localhost:3000) in your browser.

   - Customer site: `http://localhost:3000`
   - Admin dashboard: `http://localhost:3000/admin`

No environment variables or additional setup are required — everything runs on mock data.

---

## Available Routes

| Route                              | Description                          |
|-------------------------------------|---------------------------------------|
| `/`                                  | Home page                             |
| `/menu`                              | Menu browsing, search & filters       |
| `/menu/[id]`                         | Food details                          |
| `/cart`                              | Shopping cart                         |
| `/checkout`                          | Checkout flow                         |
| `/order-confirmation/[id]`           | Order success page                    |
| `/track-order/[id]`                  | Live order status tracker             |
| `/my-orders`                         | Order history                         |
| `/login`, `/register`                | Mock authentication UI                |
| `/about`, `/contact`                 | Informational pages                   |
| `/admin`                             | Admin dashboard overview              |
| `/admin/foods`                       | Food management                       |
| `/admin/categories`                  | Category management                   |
| `/admin/orders`                      | Order management                      |
| `/admin/payments`                    | Payment overview                      |
| `/admin/analytics`                   | Sales analytics                       |
| `/admin/settings`                    | Restaurant settings                   |

---

## Mock Data

All mock data lives in `data/`:

- `foods.ts` — 20 menu items across 6 categories, priced in BDT (৳)
- `categories.ts` — Burgers, Pizza, Chicken, Pasta, Desserts, Drinks
- `orders.ts` — 12 sample orders in various statuses
- `analytics.ts` — 7-day and 30-day revenue/order series, category performance
- `payments.ts` — transactions derived from the mock orders
- `restaurant.ts` — restaurant profile, opening hours, preferences

Data created or edited at runtime (cart contents, placed orders, admin food/category
edits) is kept in React Context and persisted to the browser's `localStorage`, so it
survives a page refresh but is local to your browser only.

---

## Future Roadmap

This version is intentionally frontend-only. The next phases (not implemented yet):

| Mock (today)              | Planned replacement                  |
|-----------------------------|----------------------------------------|
| Mock food/category data     | PostgreSQL + Prisma                    |
| Mock login/register UI      | Real authentication (e.g. NextAuth)    |
| Mock payment method UI      | Stripe (or local payment gateway)      |
| Mock order state            | Real backend API + database            |
| —                            | Customer management module             |
| —                            | Inventory management                   |
| —                            | Delivery driver management             |
| —                            | AI-powered features (OpenAI API)       |

The codebase is structured so these can be added incrementally: mock data in `data/`
mirrors the shape a real API would return (see `types/index.ts`), and all data access
goes through `context/` — so swapping local state for real API calls later means editing
those files, not every page that uses them.

---

## Notes for Continued Development

- Run `npm run lint` to check for lint issues as you add features.
- Component and folder naming follows a consistent pattern — see `components/` for
  examples before adding new ones.
- Colors, fonts, and spacing are defined once in `tailwind.config.ts` — adjust the
  palette there rather than hardcoding new colors in components.
- `context/CatalogContext.tsx` is the single source of truth for foods & categories;
  read from it with `useCatalog()` rather than importing `data/foods.ts` directly in new
  components, so admin edits stay reflected everywhere.
