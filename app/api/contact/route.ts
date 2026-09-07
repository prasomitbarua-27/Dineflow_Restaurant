import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { contactMessageInputSchema } from "@/lib/validation";
import { withErrorHandling, apiError, apiRateLimited } from "@/lib/api-helpers";
import { sendContactMessageEmail } from "@/lib/email";
import { defaultRestaurantSettings } from "@/data/restaurant";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

// POST /api/contact — open to anyone (guest or logged in), same reasoning
// as guest checkout: no reason to force an account just to send a message.
//
// Unlike the order confirmation/status emails elsewhere in the app (which
// are fire-and-forget via sendEmailSafely() — an email failure there
// should never fail an order that already succeeded), this route AWAITS
// the send and checks the result. There's no order record to fall back
// on here: if the email doesn't go out, nothing happened at all, so the
// customer needs to actually be told that rather than see a false
// "Message sent!" toast.
export const POST = withErrorHandling(async (req: NextRequest) => {
  // 5 messages per 10 minutes per IP — generous for a genuine visitor,
  // tight enough to blunt this route being used to spam the restaurant's
  // inbox (this endpoint triggers an outbound email on every request).
  const rateLimit = checkRateLimit(`contact:${getClientIp(req)}`, 5, 10 * 60 * 1000);
  if (!rateLimit.success) return apiRateLimited(rateLimit.resetAt);

  const body = await req.json();
  const input = contactMessageInputSchema.parse(body);

  const settings = await prisma.restaurantSettings.findUnique({ where: { id: "singleton" } });
  const restaurantEmail = settings?.email || defaultRestaurantSettings.email;

  const result = await sendContactMessageEmail(input, restaurantEmail);
  if (!result.sent) {
    return apiError(
      "Couldn't send your message right now — please try again in a moment, or reach us by phone.",
      502
    );
  }

  return NextResponse.json({ success: true });
});
