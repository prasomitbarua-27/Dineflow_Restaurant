import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { validateSSLCommerzPayment } from "@/lib/sslcommerz";
import { serializeOrder } from "@/lib/serializers";
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from "@/lib/email";
import { defaultRestaurantSettings } from "@/data/restaurant";

// POST /api/payments/sslcommerz/ipn
// SSLCommerz calls this server-to-server (not through the customer's
// browser) whenever a payment's status changes. This is the authoritative
// source of truth for "did the payment actually go through" — unlike the
// success/fail/cancel redirects below, which happen in the customer's
// browser and could in theory be interrupted, spoofed, or never arrive at
// all (e.g. customer closes the tab right after paying). This route is
// the safety net that makes sure the order still gets marked paid even if
// that happens.
//
// Always responds 200 — SSLCommerz will retry this webhook on non-200
// responses, and we don't want retries for something like "order not
// found in our DB yet" turning into a flood. Log and move on instead.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const valId = formData.get("val_id")?.toString();
    const orderId = formData.get("value_a")?.toString(); // set by us in lib/sslcommerz.ts

    if (!valId || !orderId) {
      console.error("SSLCommerz IPN missing val_id or value_a", Object.fromEntries(formData));
      return NextResponse.json({ received: true });
    }

    const order = await prisma.order.findUnique({ where: { id: orderId } });
    if (!order) {
      console.error("SSLCommerz IPN referenced an unknown order id:", orderId);
      return NextResponse.json({ received: true });
    }

    // Already processed (e.g. the success-redirect handler got there
    // first) — nothing more to do, and definitely don't double-process.
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ received: true });
    }

    const validation = await validateSSLCommerzPayment(valId);
    // ── SECURITY FIX (same as success/route.ts) ─────────────────────
    // A valid val_id only proves SOME transaction cleared — it doesn't
    // prove it was for THIS order's amount. Require both before paying
    // the order out, or a val_id from a cheap order could be replayed
    // against a pricier one via this webhook.
    const isGenuinelyPaid = validation.isValid && validation.amount === order.total;

    const updated = await prisma.order.update({
      where: { id: orderId },
      data: isGenuinelyPaid
        ? { paymentStatus: "PAID", paymentValId: valId }
        : { paymentStatus: "FAILED" },
      include: { items: true },
    });

    // Guarded by the `order.paymentStatus === "PAID"` early-return above,
    // so this only ever fires the first time an order is validated as
    // paid — if the success-redirect handler already sent these emails
    // moments earlier, the IPN webhook won't send them again.
    if (isGenuinelyPaid) {
      const settings = await prisma.restaurantSettings.findUnique({ where: { id: "singleton" } });
      const serialized = serializeOrder(updated);
      await Promise.all([
        sendOrderConfirmationEmail(serialized),
        sendNewOrderAlertEmail(serialized, settings?.email || defaultRestaurantSettings.email),
      ]);
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("SSLCommerz IPN handler error:", err);
    // Still 200 — see comment above on why we don't want SSLCommerz retrying this.
    return NextResponse.json({ received: true });
  }
}
