"use client";

import { useEffect } from "react";
import { TrendingUp, Receipt } from "lucide-react";
import { RevenueChart } from "@/components/admin/RevenueChart";
import { OrdersChart } from "@/components/admin/OrdersChart";
import { StatCard } from "@/components/admin/StatCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { useOrders } from "@/context/OrderContext";
import { useCatalog } from "@/context/CatalogContext";
import {
  buildDailyStats,
  buildCategoryPerformance,
  buildPopularFoods,
  buildAverageOrderValue,
} from "@/lib/analytics";
import { formatCurrency } from "@/lib/utils";

const CATEGORY_COLORS = ["#C2700E", "#17130F", "#2E7D53", "#DC8A2F", "#9C9284", "#E8A455"];

export default function AdminAnalyticsPage() {
  const { orders, isLoading: ordersLoading, loadAll } = useOrders();
  const { foods, categories, isLoading: catalogLoading } = useCatalog();
  const isLoading = ordersLoading || catalogLoading;

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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

  const dailyStats = buildDailyStats(orders, 30);
  const categoryPerformance = buildCategoryPerformance(orders, foods, categories);
  const popularFoods = buildPopularFoods(orders, 5);
  const averageOrderValue = buildAverageOrderValue(orders);

  const totalRevenue30d = dailyStats.reduce((sum, d) => sum + d.revenue, 0);
  const totalOrders30d = dailyStats.reduce((sum, d) => sum + d.orders, 0);
  const topCategory = categoryPerformance[0]?.category ?? "—";

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Revenue (30 days)" value={formatCurrency(totalRevenue30d)} icon={TrendingUp} />
        <StatCard label="Orders (30 days)" value={totalOrders30d.toLocaleString()} icon={Receipt} />
        <StatCard label="Average Order Value" value={formatCurrency(averageOrderValue)} icon={Receipt} />
        <StatCard label="Top Category" value={topCategory} icon={TrendingUp} />
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
        <h2 className="font-display text-base font-semibold text-ink-900">Revenue Trend — Last 30 Days</h2>
        <div className="mt-2">
          <RevenueChart data={dailyStats} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink-900">Order Trend — Last 30 Days</h2>
          <div className="mt-2">
            <OrdersChart data={dailyStats} />
          </div>
        </div>

        <div className="rounded-2xl border border-ink-100 bg-white p-5 shadow-card">
          <h2 className="font-display text-base font-semibold text-ink-900">Category Performance</h2>
          {categoryPerformance.length === 0 ? (
            <p className="mt-4 text-sm text-ink-400">No paid orders yet — this fills in as sales come through.</p>
          ) : (
            <div className="mt-4 space-y-3.5">
              {categoryPerformance.map((cat, i) => (
                <div key={cat.category}>
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-medium text-ink-700">{cat.category}</span>
                    <span className="text-ink-500">{formatCurrency(cat.revenue)}</span>
                  </div>
                  <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-ink-100">
                    <div
                      className="h-full rounded-full"
                      style={{ width: `${cat.percentage}%`, backgroundColor: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-2xl border border-ink-100 bg-white shadow-card">
        <div className="border-b border-ink-100 p-5">
          <h2 className="font-display text-base font-semibold text-ink-900">Most Popular Foods</h2>
        </div>
        {popularFoods.length === 0 ? (
          <p className="p-5 text-sm text-ink-400">No paid orders yet — this fills in as sales come through.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead>
                <tr className="border-b border-ink-100 text-xs uppercase tracking-wide text-ink-400">
                  <th className="py-3 pl-5 pr-4 font-medium">Food</th>
                  <th className="py-3 pr-4 font-medium">Units Sold</th>
                  <th className="py-3 pr-5 font-medium">Revenue</th>
                </tr>
              </thead>
              <tbody>
                {popularFoods.map((food) => (
                  <tr key={food.name} className="border-b border-ink-50 last:border-none">
                    <td className="py-3 pl-5 pr-4 font-medium text-ink-900">{food.name}</td>
                    <td className="py-3 pr-4 text-ink-600">{food.unitsSold}</td>
                    <td className="py-3 pr-5 font-medium text-ink-900">{formatCurrency(food.revenue)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
