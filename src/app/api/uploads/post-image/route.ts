import { NextRequest } from "next/server";
import { requireAuthenticatedUser } from "@/lib/current-user";
import { jsonError, jsonSuccess } from "@/lib/http";
import { uploadImageFile } from "@/lib/storage";

export async function POST(request: NextRequest) {
  const auth = await requireAuthenticatedUser(request);

  if (!auth.user) {
    return jsonError(auth.error, auth.status);
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return jsonError("A file field is required.", 422);
  }

  const uploaded = await uploadImageFile(file, "post-images");

  if (!uploaded.ok) {
    return jsonError(uploaded.error, uploaded.status);
  }

  return jsonSuccess({ image_url: uploaded.url }, { status: 201 });
}