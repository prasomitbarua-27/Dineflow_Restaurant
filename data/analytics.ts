import { DailyStat } from "@/types";

// Last 7 days of revenue/orders for the admin dashboard overview chart.
export const last7DaysStats: DailyStat[] = [
  { label: "Mon", revenue: 32400, orders: 96 },
  { label: "Tue", revenue: 28900, orders: 84 },
  { label: "Wed", revenue: 35200, orders: 103 },
  { label: "Thu", revenue: 31100, orders: 91 },
  { label: "Fri", revenue: 46800, orders: 132 },
  { label: "Sat", revenue: 52300, orders: 148 },
  { label: "Sun", revenue: 42500, orders: 128 },
];

// Last 30 days, used on the Analytics page for a longer trend view.
export const last30DaysStats: DailyStat[] = Array.from({ length: 30 }, (_, i) => {
  const day = i + 1;
  const base = 28000 + Math.sin(i / 3) * 8000 + (i % 7 === 5 || i % 7 === 6 ? 9000 : 0);
  const revenue = Math.round(base + (i * 137) % 1500);
  return {
    label: `${day}`,
    revenue,
    orders: Math.round(revenue / 340),
  };
});

export const categoryPerformance = [
  { category: "Burgers", revenue: 142500, percentage: 26 },
  { category: "Pizza", revenue: 168300, percentage: 31 },
  { category: "Chicken", revenue: 98200, percentage: 18 },
  { category: "Pasta", revenue: 64100, percentage: 12 },
  { category: "Desserts", revenue: 38900, percentage: 7 },
  { category: "Drinks", revenue: 32000, percentage: 6 },
];

export const popularFoodsAnalytics = [
  { name: "Smoky Beef Burger", unitsSold: 412, revenue: 156560 },
  { name: "Margherita Pizza", unitsSold: 356, revenue: 192240 },
  { name: "Crispy Fried Chicken Bucket", unitsSold: 298, revenue: 205620 },
  { name: "Classic Chicken Burger", unitsSold: 287, revenue: 91840 },
  { name: "Buffalo Chicken Wings", unitsSold: 241, revenue: 84350 },
];

export const averageOrderValue = 612; // BDT
