"use client";

import { useEffect } from "react";
import { Wallet, ShoppingCart, Clock3, CheckCircle2 } from "lucide-react";
import { StatCard } from "@/components/admin/StatCard";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { OrdersChart } from "@/components/admin/OrdersChart";
import { PopularFoodsList } from "@/components/admin/PopularFoodsList";
import { RecentOrdersTable } from "@/components/admin/RecentOrdersTable";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrders } from "@/context/OrderContext";
import { useCatalog } from "@/context/CatalogContext";
import { buildDailyStats } from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

function isToday(iso: string) {
  const d = new Date(iso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function AdminDashboardPage() {
  const { orders, isLoading: ordersLoading, loadAll } = useOrders();
  const { foods, isLoading: catalogLoading } = useCatalog();
  const isLoading = ordersLoading || catalogLoading;

  // Safe to fetch every order here — middleware.ts already keeps
  // non-admins from ever reaching this page, and the API route
  // double-checks the admin role server-side too.
  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Computed from real orders in the database, not static mock data — the
  // stat cards below AND the 7-day trend charts are both genuinely live,
  // via lib/analytics.ts's buildDailyStats() (bucketed by real order
  // createdAt timestamps, revenue counted only for paid orders).
  const todaysOrders = orders.filter((o) => isToday(o.createdAt));
  const todayRevenue = todaysOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);
  const pendingOrders = orders.filter((o) => ["placed", "confirmed", "preparing"].includes(o.status)).length;
  const completedOrders = orders.filter((o) => o.status === "completed").length;

  const popularFoods = foods.filter((f) => f.isPopular).slice(0, 5);
  const dailyStats = buildDailyStats(orders, 7);
  const recentOrders = [...orders]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 6);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28 w-full rounded-2xl" />
          ))}
        </div>
        <Skeleton className="h-80 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Today's Revenue" value={formatCurrency(todayRevenue)} icon={Wallet} />
        <StatCard label="Today's Orders" value={String(todaysOrders.length)} icon={ShoppingCart} />
        <StatCard label="Pending Orders" value={String(pendingOrders)} icon={Clock3} />
        <StatCard label="Completed Orders" value={String(completedOrders)} icon={CheckCircle2} />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
          <div className="flex items-center justify-between">
            <h2 className="font-display text-base font-semibold text-ink-900">Revenue — Last 7 Days</h2>
          </div>
          <div className="mt-2">
            <RevenueChart data={dailyStats} />
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink-900">Top Selling Foods</h2>
          <div className="mt-4">
            <PopularFoodsList foods={popularFoods} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-1">
          <h2 className="font-display text-base font-semibold text-ink-900">Orders — Last 7 Days</h2>
          <div className="mt-2">
            <OrdersChart data={dailyStats} />
          </div>
        </div>
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card lg:col-span-2">
          <h2 className="font-display text-base font-semibold text-ink-900">Recent Orders</h2>
          <div className="mt-3">
            <RecentOrdersTable orders={recentOrders} />
          </div>
        </div>
      </div>
    </div>
  );
}
