import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/session";
import { supabaseAdmin, FOOD_IMAGES_BUCKET } from "@/lib/supabase-admin";
import { withErrorHandling, apiError } from "@/lib/api-helpers";
import { generateId } from "@/lib/utils";

const MAX_SIZE_BYTES = 5 * 1024 * 1024; // 5MB — matches lib/image-compress.ts's client-side check;
// enforced again here since a client-side check alone is never trustworthy
// (anyone can call this API directly with any file, bypassing the browser).
const ACCEPTED_TYPES = new Set(["image/jpeg", "image/png", "image/webp", "image/gif"]);

// POST /api/upload — accepts a single image file as multipart/form-data
// (field name "file"), uploads it to the "food-images" Supabase Storage
// bucket, and returns its public URL. Admin-only.
export const POST = withErrorHandling(async (req: NextRequest) => {
  const { error } = await requireAdmin();
  if (error) return error;

  const formData = await req.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return apiError("No file was uploaded.", 400);
  }
  if (!ACCEPTED_TYPES.has(file.type)) {
    return apiError("Only JPEG, PNG, WEBP, or GIF images are allowed.", 400);
  }
  if (file.size > MAX_SIZE_BYTES) {
    return apiError("Image is too large — please use a file under 5MB.", 400);
  }

  const extension = file.type.split("/")[1] === "jpeg" ? "jpg" : file.type.split("/")[1];
  const path = `${generateId("img")}.${extension}`;

  const arrayBuffer = await file.arrayBuffer();
  const { error: uploadError } = await supabaseAdmin.storage
    .from(FOOD_IMAGES_BUCKET)
    .upload(path, arrayBuffer, {
      contentType: file.type,
      cacheControl: "31536000", // 1 year — uploaded filenames are unique (see generateId), so a
      // given path's content never changes; safe to cache aggressively at the CDN/browser level.
      upsert: false,
    });

  if (uploadError) {
    // Common cause: the "food-images" bucket doesn't exist yet — see
    // docs/PHASE-5-IMAGE-UPLOAD-SETUP.md for how to create it.
    return apiError(`Upload failed: ${uploadError.message}`, 500);
  }

  const { data: publicUrlData } = supabaseAdmin.storage.from(FOOD_IMAGES_BUCKET).getPublicUrl(path);

  return NextResponse.json({ url: publicUrlData.publicUrl }, { status: 201 });
});
