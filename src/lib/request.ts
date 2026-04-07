import { NextRequest } from "next/server";

export function getBearerToken(request: NextRequest) {
  const header = request.headers.get("authorization");

  if (!header?.startsWith("Bearer ")) {
    return null;
  }

  return header.slice(7);
}