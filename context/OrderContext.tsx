"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { Order, OrderStatus, OrderType, PaymentMethod } from "@/types";
import { CartLine } from "./CartContext";

export interface PlaceOrderInput {
  customer: { fullName: string; email: string; phone: string };
  delivery: { address: string; city: string; postalCode: string } | null;
  orderType: OrderType;
  paymentMethod: PaymentMethod;
  items: CartLine[];
  subtotal: number;
  deliveryFee: number;
  total: number;
}

interface OrderContextValue {
  orders: Order[];
  isLoading: boolean;
  error: string | null;
  placeOrder: (input: PlaceOrderInput) => Promise<Order>;
  getOrder: (id: string) => Order | undefined;
  fetchOrder: (id: string) => Promise<Order | undefined>;
  updateOrderStatus: (id: string, status: OrderStatus) => Promise<void>;
  updatePaymentStatus: (id: string, status: Order["paymentStatus"]) => Promise<void>;
  /** Admin-only: loads every order. Call from an admin page's own effect —
   *  see note below on why this isn't fetched automatically for everyone. */
  loadAll: () => Promise<void>;
  /** Loads only the logged-in customer's own orders. Call from My Orders. */
  loadMine: () => Promise<void>;
  /** Same request as loadAll(), but never touches isLoading or error —
   *  for background polling (see app/admin/layout.tsx) where the goal is
   *  to keep `orders` fresh silently, not to re-trigger a full-page
   *  loading skeleton or error banner over data that was displaying
   *  fine a moment ago. */
  refreshAll: () => Promise<void>;
}

const OrderContext = createContext<OrderContextValue | undefined>(undefined);

async function unwrap<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed (${res.status})`);
  }
  return res.json();
}

export function OrderProvider({ children }: { children: ReactNode }) {
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Unlike CatalogContext, this does NOT eagerly fetch on mount. Orders now
  // require authentication to list (GET /api/orders needs an admin
  // session; GET /api/orders?mine=true needs any session) — and
  // OrderProvider wraps the ENTIRE app, including pages a logged-out
  // visitor sees. Auto-fetching here would fire an API call that 401s on
  // every single page load for every anonymous visitor. Instead, the
  // specific pages that need a list of orders (admin pages call loadAll();
  // My Orders calls loadMine()) trigger the fetch themselves, once, in
  // their own effect.
  async function loadAll() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders");
      const data = await unwrap<Order[]>(res);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load orders.");
    } finally {
      setIsLoading(false);
    }
  }

  async function loadMine() {
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/orders?mine=true");
      const data = await unwrap<Order[]>(res);
      setOrders(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load your orders.");
    } finally {
      setIsLoading(false);
    }
  }

  // Same request as loadAll(), but never touches isLoading or error — a
  // failed background poll fails silently and just tries again on the
  // next interval, rather than surfacing an error banner or re-triggering
  // a loading skeleton over data that was displaying just fine a moment
  // ago. This is what fixed a real bug: app/admin/layout.tsx's 10-second
  // poll was originally calling loadAll() directly, which meant every
  // poll flipped isLoading true→false again, visibly "flashing" every
  // admin page's full skeleton every 10 seconds.
  async function refreshAll() {
    try {
      const res = await fetch("/api/orders");
      const data = await unwrap<Order[]>(res);
      setOrders(data);
    } catch {
      // silent — see comment above
    }
  }

  async function placeOrder(input: PlaceOrderInput): Promise<Order> {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer: input.customer,
        delivery: input.delivery,
        orderType: input.orderType,
        paymentMethod: input.paymentMethod,
        items: input.items.map((line) => ({
          foodId: line.food.id,
          name: line.food.name,
          price: line.food.price,
          quantity: line.quantity,
          image: line.food.image,
        })),
        subtotal: input.subtotal,
        deliveryFee: input.deliveryFee,
        total: input.total,
      }),
    });
    const created = await unwrap<Order>(res);
    setOrders((prev) => [created, ...prev]);
    return created;
  }

  // Synchronous lookup against whatever's already loaded in state. Used by
  // pages that render inside the same session as placeOrder() (checkout ->
  // confirmation -> tracking), where the order is already in memory.
  function getOrder(id: string) {
    return orders.find((o) => o.id === id || o.orderNumber === id);
  }

  // Fetches a single order directly from the API — used when a page is
  // opened fresh (e.g. a reload, or a shared link) and the order may not
  // yet be in the context's in-memory list. This endpoint is intentionally
  // open (no auth) — see the comment in app/api/orders/[id]/route.ts.
  async function fetchOrder(id: string): Promise<Order | undefined> {
    const cached = getOrder(id);
    if (cached) return cached;
    try {
      const res = await fetch(`/api/orders/${id}`);
      if (res.status === 404) return undefined;
      const order = await unwrap<Order>(res);
      setOrders((prev) => (prev.some((o) => o.id === order.id) ? prev : [order, ...prev]));
      return order;
    } catch {
      return undefined;
    }
  }

  async function updateOrderStatus(id: string, status: OrderStatus) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    const updated = await unwrap<Order>(res);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }

  async function updatePaymentStatus(id: string, paymentStatus: Order["paymentStatus"]) {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ paymentStatus }),
    });
    const updated = await unwrap<Order>(res);
    setOrders((prev) => prev.map((o) => (o.id === id ? updated : o)));
  }

  return (
    <OrderContext.Provider
      value={{
        orders,
        isLoading,
        error,
        placeOrder,
        getOrder,
        fetchOrder,
        updateOrderStatus,
        updatePaymentStatus,
        loadAll,
        loadMine,
        refreshAll,
      }}
    >
      {children}
    </OrderContext.Provider>
  );
}

export function useOrders(): OrderContextValue {
  const ctx = useContext(OrderContext);
  if (!ctx) throw new Error("useOrders must be used within an OrderProvider");
  return ctx;
}
