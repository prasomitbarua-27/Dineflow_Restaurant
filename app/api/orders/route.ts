import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { serializeOrder, orderTypeToDb, paymentMethodToDb } from "@/lib/serializers";
import { placeOrderInputSchema } from "@/lib/validation";
import { withErrorHandling, apiError, apiRateLimited } from "@/lib/api-helpers";
import { requireAdmin } from "@/lib/session";
import { generateOrderNumber } from "@/lib/utils";
import { sendOrderConfirmationEmail, sendNewOrderAlertEmail } from "@/lib/email";
import { defaultRestaurantSettings } from "@/data/restaurant";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// GET /api/orders            — every order, newest first. Admin-only.
// GET /api/orders?mine=true  — only the logged-in customer's own orders.
//                               Requires a session, but not the ADMIN role.
// This split is what keeps a customer from being able to see every other
// customer's order history (see TODO.md Phase 3 + Phase 8 — this used to
// be a wide-open endpoint before auth existed).
export const GET = withErrorHandling(async (req: NextRequest) => {
  const mine = req.nextUrl.searchParams.get("mine") === "true";

  if (mine) {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return apiError("Not authenticated.", 401);
    }
    const orders = await prisma.order.findMany({
      where: { userId: session.user.id },
      include: { items: true },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(orders.map(serializeOrder));
  }

  const { error } = await requireAdmin();
  if (error) return error;

  const orders = await prisma.order.findMany({
    include: { items: true },
    orderBy: { createdAt: "desc" },
  });
  return NextResponse.json(orders.map(serializeOrder));
});

// POST /api/orders — place a new order from checkout. Deliberately left
// open to guests (no login required) — forcing an account just to order
// food is exactly the kind of friction this project's checkout was built
// to avoid. If the customer IS logged in, the order is linked to their
// account (via the session, never a client-supplied id) so it shows up in
// their "My Orders" page automatically.
export const POST = withErrorHandling(async (req: NextRequest) => {
  // 10 orders per 10 minutes per IP — generous enough for a genuine
  // customer (including retries after a failed payment), tight enough to
  // blunt a scripted spam-order attempt. Checked before touching the
  // database at all.
  const rateLimit = checkRateLimit(`place-order:${getClientIp(req)}`, 10, 10 * 60 * 1000);
  if (!rateLimit.success) return apiRateLimited(rateLimit.resetAt);

  const session = await getServerSession(authOptions);

  const body = await req.json();
  const input = placeOrderInputSchema.parse(body);

  // Every order starts PENDING regardless of payment method. Cash stays
  // pending until collected on delivery/pickup. Card/mobile-banking orders
  // ALSO start pending — they only flip to PAID once SSLCommerz actually
  // confirms the payment (see app/api/payments/sslcommerz/{success,ipn}
  // route.ts), never at order-creation time. Marking a card order "paid"
  // here would be wrong before the customer has even reached the payment
  // page, and — worse — would permanently block the fail/cancel handlers
  // from ever correctly marking an abandoned or declined payment as
  // failed, since those handlers only act `if paymentStatus !== "PAID"`.
  const paymentStatus = "PENDING";

  // Order numbers are short and human-friendly (e.g. "DF-48213"), but two
  // near-simultaneous orders could in theory collide — retry a handful of
  // times with a fresh number rather than fail the checkout outright.
  let order = null;
  for (let attempt = 0; attempt < 5 && !order; attempt++) {
    const orderNumber = generateOrderNumber();
    try {
      order = await prisma.order.create({
        data: {
          orderNumber,
          userId: session?.user?.id ?? null,
          fullName: input.customer.fullName,
          email: input.customer.email,
          phone: input.customer.phone,
          orderType: orderTypeToDb(input.orderType),
          address: input.delivery?.address ?? null,
          city: input.delivery?.city ?? null,
          postalCode: input.delivery?.postalCode ?? null,
          paymentMethod: paymentMethodToDb(input.paymentMethod),
          paymentStatus,
          status: "PLACED",
          subtotal: input.subtotal,
          deliveryFee: input.deliveryFee,
          total: input.total,
          estimatedReadyMinutes: 25 + Math.round(Math.random() * 15),
          items: {
            create: input.items.map((item) => ({
              foodId: item.foodId,
              name: item.name,
              price: item.price,
              quantity: item.quantity,
              image: item.image,
            })),
          },
        },
        include: { items: true },
      });
    } catch (err: unknown) {
      // Prisma's unique-constraint error code — retry with a new number.
      const isUniqueViolation =
        typeof err === "object" && err !== null && "code" in err && err.code === "P2002";
      if (!isUniqueViolation) throw err;
    }
  }

  if (!order) {
    throw new Error("Could not generate a unique order number after several attempts.");
  }

  const serialized = serializeOrder(order);

  // Cash on Delivery orders are genuinely confirmed the moment they're
  // placed — there's no payment step to wait for, unlike online orders
  // (see app/api/payments/sslcommerz/{success,ipn}/route.ts, which send
  // these same two emails but only once SSLCommerz actually validates
  // payment). Awaited (not fire-and-forget) so the send actually
  // completes before this serverless function's response returns — but
  // sendEmailSafely() never throws, so a Resend outage or missing API key
  // can't fail the checkout itself, only skip the email.
  if (input.paymentMethod === "cash") {
    const settings = await prisma.restaurantSettings.findUnique({ where: { id: "singleton" } });
    await Promise.all([
      sendOrderConfirmationEmail(serialized),
      sendNewOrderAlertEmail(serialized, settings?.email || defaultRestaurantSettings.email),
    ]);
  }

  return NextResponse.json(serialized, { status: 201 });
});
