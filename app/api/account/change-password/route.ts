import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import bcrypt from "bcryptjs";
import { z } from "zod";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { withErrorHandling, apiError } from "@/lib/api-helpers";

const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, "Current password is required"),
  newPassword: z.string().min(6, "New password must be at least 6 characters").max(200),
});

// PATCH /api/account/change-password — available to any logged-in user
// (not admin-only — a regular customer account should be able to do this
// too, even though the only UI for it right now lives in the admin
// Settings page). Requires the correct current password before allowing
// a change, same as any reasonable account settings page.
export const PATCH = withErrorHandling(async (req: NextRequest) => {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return apiError("Not authenticated.", 401);
  }

  const body = await req.json();
  const input = changePasswordSchema.parse(body);

  const user = await prisma.user.findUnique({ where: { id: session.user.id } });
  if (!user?.password) {
    // Shouldn't happen for a Credentials-provider account, but guards
    // against ever comparing against a null password hash.
    return apiError("This account has no password set.", 400);
  }

  const isCorrect = await bcrypt.compare(input.currentPassword, user.password);
  if (!isCorrect) {
    return apiError("Current password is incorrect.", 403);
  }

  const hashed = await bcrypt.hash(input.newPassword, 10);
  await prisma.user.update({ where: { id: user.id }, data: { password: hashed } });

  return NextResponse.json({ success: true });
});
