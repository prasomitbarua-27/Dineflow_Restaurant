import { Resend } from "resend";
import { Order } from "@/types";
import { formatCurrency, formatDateTime } from "@/lib/utils";

// Lazily constructed so a missing RESEND_API_KEY doesn't crash the whole
// app at import time — it only matters the moment someone actually tries
// to send an email, and every send function below already wraps its call
// in a try/catch that logs and swallows the error rather than throwing.
// See the big comment on sendEmailSafely() for why that matters.
function getResendClient(): Resend | null {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return null;
  return new Resend(apiKey);
}

const FROM_ADDRESS = process.env.RESEND_FROM_EMAIL || "DineFlow <onboarding@resend.dev>";

/**
 * Every email send in this file goes through this wrapper. Emails are
 * important, but they must NEVER be able to break the actual thing they're
 * describing — a customer's order should still go through, and an admin's
 * status update should still save, even if Resend is down, misconfigured,
 * or the API key hasn't been set up yet (e.g. before Phase 6's setup steps
 * are done). So every failure here is logged server-side and swallowed,
 * never thrown, and every call site treats sending an email as
 * "fire and forget" — nothing awaits this in a way that could fail the
 * surrounding request.
 */
async function sendEmailSafely(params: { to: string; subject: string; html: string }) {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipped email "${params.subject}" to ${params.to}`);
    return;
  }
  try {
    await resend.emails.send({ from: FROM_ADDRESS, to: params.to, subject: params.subject, html: params.html });
  } catch (err) {
    console.error(`Failed to send email "${params.subject}" to ${params.to}:`, err);
  }
}

// ─────────────────────────────────────────────────────────────────────────
// Shared layout — every email wraps its content in this so the emails look
// like they belong to the same product, without pulling in a templating
// library or React Email just for this. Plain inline-styled HTML table
// layout, since that's still the most reliable thing across email clients.
// ─────────────────────────────────────────────────────────────────────────

function emailShell(title: string, bodyHtml: string): string {
  return `
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:#F4ECD8;font-family:-apple-system,Segoe UI,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:#F4ECD8;padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background-color:#FFFDF9;border-radius:16px;overflow:hidden;">
            <tr>
              <td style="background-color:#17130F;padding:24px 32px;">
                <span style="color:#FBF7EC;font-size:20px;font-weight:600;">DineFlow</span>
              </td>
            </tr>
            <tr>
              <td style="padding:32px;">
                <h1 style="margin:0 0 16px;color:#17130F;font-size:22px;font-weight:600;">${title}</h1>
                ${bodyHtml}
              </td>
            </tr>
            <tr>
              <td style="padding:20px 32px;background-color:#F5F4F2;color:#9C9284;font-size:12px;">
                This is an automated message from DineFlow. If you didn't place this order, please contact us.
              </td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
  </body>
</html>`;
}

function itemsTableHtml(order: Order): string {
  const rows = order.items
    .map(
      (item) => `
      <tr>
        <td style="padding:8px 0;color:#2B261F;font-size:14px;">${item.quantity}× ${item.name}</td>
        <td style="padding:8px 0;color:#2B261F;font-size:14px;text-align:right;">${formatCurrency(item.price * item.quantity)}</td>
      </tr>`
    )
    .join("");

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin:16px 0;border-top:1px solid #E6E3DE;border-bottom:1px solid #E6E3DE;">
      ${rows}
      <tr>
        <td style="padding:12px 0 0;color:#17130F;font-size:15px;font-weight:600;">Total</td>
        <td style="padding:12px 0 0;color:#17130F;font-size:15px;font-weight:600;text-align:right;">${formatCurrency(order.total)}</td>
      </tr>
    </table>`;
}

// ─────────────────────────────────────────────────────────────────────────
// The three emails this project sends. Call sites are documented on each
// function — see app/api/orders/route.ts, app/api/orders/[id]/route.ts,
// and app/api/payments/sslcommerz/{success,ipn}/route.ts.
// ─────────────────────────────────────────────────────────────────────────

/** Sent to the customer once an order is genuinely confirmed — immediately
 *  for Cash on Delivery, or once SSLCommerz validates payment for online
 *  orders. Never sent at order *creation* for a card order that hasn't
 *  paid yet — see the comment in app/api/orders/route.ts for why. */
export async function sendOrderConfirmationEmail(order: Order) {
  const html = emailShell(
    "Order confirmed!",
    `
    <p style="margin:0 0 8px;color:#4C453B;font-size:15px;">Hi ${order.customer.fullName.split(" ")[0]}, thanks for your order.</p>
    <p style="margin:0 0 16px;color:#4C453B;font-size:15px;">Order <strong>${order.orderNumber}</strong> — estimated ${order.orderType === "delivery" ? "delivery" : "pickup"} time: ~${order.estimatedReadyMinutes} minutes.</p>
    ${itemsTableHtml(order)}
    `
  );
  await sendEmailSafely({ to: order.customer.email, subject: `Order confirmed — ${order.orderNumber}`, html });
}

/** Sent to the customer whenever an admin moves the order to a new status.
 *  Intentionally skips "placed" (that's covered by the confirmation email
 *  above, not a status *change* an admin made) and "confirmed" immediately
 *  following creation (redundant with the confirmation email for most
 *  orders) — see call site for the exact guard. */
export async function sendOrderStatusUpdateEmail(order: Order) {
  const STATUS_COPY: Record<string, { subject: string; message: string }> = {
    confirmed: { subject: "Order confirmed", message: "Your order has been confirmed and the kitchen has it." },
    preparing: { subject: "Your order is being prepared", message: "The kitchen has started preparing your order." },
    ready: {
      subject: "Your order is ready!",
      message:
        order.orderType === "pickup"
          ? "Your order is ready for pickup at the restaurant."
          : "Your order is ready and will be out for delivery shortly.",
    },
    completed: { subject: "Order completed", message: "Your order has been completed. Enjoy your meal!" },
    cancelled: { subject: "Order cancelled", message: "Your order has been cancelled. If this is unexpected, please contact us." },
  };

  const copy = STATUS_COPY[order.status];
  if (!copy) return;

  const html = emailShell(
    copy.subject,
    `
    <p style="margin:0 0 8px;color:#4C453B;font-size:15px;">Hi ${order.customer.fullName.split(" ")[0]},</p>
    <p style="margin:0 0 16px;color:#4C453B;font-size:15px;">${copy.message}</p>
    <p style="margin:0 0 16px;color:#9C9284;font-size:13px;">Order ${order.orderNumber}</p>
    `
  );
  await sendEmailSafely({ to: order.customer.email, subject: `${copy.subject} — ${order.orderNumber}`, html });
}

/** Sent to the restaurant's own inbox (RestaurantSettings.email) the
 *  moment an order is genuinely confirmed — same timing as the customer
 *  confirmation email above (immediate for COD, on payment confirmation
 *  for online orders), so the restaurant never gets alerted about an
 *  order that turned out to never be paid for. */
export async function sendNewOrderAlertEmail(order: Order, restaurantEmail: string) {
  const html = emailShell(
    "New order received",
    `
    <p style="margin:0 0 4px;color:#4C453B;font-size:15px;"><strong>${order.orderNumber}</strong> — ${order.customer.fullName}</p>
    <p style="margin:0 0 16px;color:#4C453B;font-size:15px;">${order.orderType === "delivery" ? "Delivery" : "Pickup"} · ${order.paymentMethod === "cash" ? "Cash on Delivery" : "Paid online"} · Placed ${formatDateTime(order.createdAt)}</p>
    ${itemsTableHtml(order)}
    ${
      order.orderType === "delivery" && order.delivery
        ? `<p style="margin:16px 0 0;color:#4C453B;font-size:14px;">${order.delivery.address}, ${order.delivery.city} ${order.delivery.postalCode}</p>`
        : ""
    }
    <p style="margin:8px 0 0;color:#4C453B;font-size:14px;">${order.customer.phone}</p>
    `
  );
  await sendEmailSafely({ to: restaurantEmail, subject: `New order: ${order.orderNumber}`, html });
}

interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

/** Sent to the restaurant's own inbox when a customer submits the contact
 *  form. Reply-To is set to the customer's address so the restaurant can
 *  just hit reply. Returns { sent: boolean } — deliberately NOT swallowed
 *  like the order emails, since app/api/contact needs to surface a real
 *  failure to the customer rather than show a false "Message sent!". */
export async function sendContactMessageEmail(
  input: ContactMessageInput,
  restaurantEmail: string
): Promise<{ sent: boolean }> {
  const resend = getResendClient();
  if (!resend) {
    console.warn(`RESEND_API_KEY not set — skipped contact email from ${input.email}`);
    return { sent: false };
  }

  const html = emailShell(
    "New message from your website",
    `
    <p style="margin:0 0 4px;color:#4C453B;font-size:15px;"><strong>${input.name}</strong> — ${input.email}</p>
    <p style="margin:16px 0 0;color:#4C453B;font-size:14px;white-space:pre-wrap;">${input.message}</p>
    `
  );

  try {
    const { error } = await resend.emails.send({
      from: FROM_ADDRESS,
      to: restaurantEmail,
      replyTo: input.email,
      subject: `New message from ${input.name} (via contact form)`,
      html,
    });

    if (error) {
      console.error("Resend error sending contact message:", error);
      return { sent: false };
    }
    return { sent: true };
  } catch (err) {
    console.error(`Failed to send contact email from ${input.email}:`, err);
    return { sent: false };
  }
}
