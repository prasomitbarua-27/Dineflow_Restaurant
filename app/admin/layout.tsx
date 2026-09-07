"use client";

import { useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { Sidebar } from "@/components/admin/Sidebar";
import { AdminHeader } from "@/components/admin/AdminHeader";
import { useOrders } from "@/context/OrderContext";
import { useToast } from "@/context/ToastContext";

const POLL_INTERVAL_MS = 10000;

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { orders, loadAll, refreshAll } = useOrders();
  const { showToast } = useToast();

  // Tracks which order ids we've already shown a toast for, so a poll that
  // re-fetches the same orders doesn't re-notify. Starts as `null` so the
  // very first load (which is "every order that already existed") never
  // triggers a flood of "new order" toasts — only orders that show up in a
  // LATER poll count as genuinely new.
  const knownOrderIds = useRef<Set<string> | null>(null);

  // Keeps the admin dashboard/orders/payments pages live without a manual
  // refresh — this is deliberately centralized here (in the layout that
  // wraps every /admin/* page) rather than duplicated in each page, so
  // polling keeps running as the admin navigates between admin pages, and
  // the "new order" toast fires no matter which admin page they're looking
  // at, not just /admin/orders.
  useEffect(() => {
    loadAll();
    const interval = window.setInterval(refreshAll, POLL_INTERVAL_MS);
    return () => window.clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (knownOrderIds.current === null) {
      knownOrderIds.current = new Set(orders.map((o) => o.id));
      return;
    }
    const newOrders = orders.filter((o) => !knownOrderIds.current!.has(o.id));
    if (newOrders.length > 0) {
      newOrders.forEach((o) => knownOrderIds.current!.add(o.id));
      const message =
        newOrders.length === 1
          ? `New order received: ${newOrders[0].orderNumber}`
          : `${newOrders.length} new orders received`;
      showToast(message, "info");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orders]);

  return (
    <div className="flex min-h-screen bg-cream-100">
      <Sidebar mobileOpen={mobileOpen} onCloseMobile={() => setMobileOpen(false)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminHeader pathname={pathname} onOpenMobile={() => setMobileOpen(true)} />
        <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">{children}</main>
      </div>
    </div>
  );
}
