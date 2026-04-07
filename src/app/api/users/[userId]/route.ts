import { NextRequest } from "next/server";
import { jsonError, jsonSuccess } from "@/lib/http";
import { loadPublicProfile } from "@/lib/profiles";
import { userIdParamsSchema } from "@/lib/validators/social";

type RouteParams = {
  params: Promise<{ userId: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteParams) {
  const parsedParams = userIdParamsSchema.safeParse(await params);

  if (!parsedParams.success) {
    return jsonError("Invalid user id.", 422, parsedParams.error.flatten());
  }

  const { userId } = parsedParams.data;
  const profile = await loadPublicProfile(userId);

  if (!profile) {
    return jsonError("Profile not found.", 404);
  }

  return jsonSuccess({ user: profile });
}