import { NextResponse } from "next/server";

const DEFAULT_HEADERS = {
  "Cache-Control": "no-store",
  "X-Content-Type-Options": "nosniff"
} as const;

function withDefaultHeaders(init?: ResponseInit): ResponseInit {
  return {
    ...init,
    headers: {
      ...DEFAULT_HEADERS,
      ...(init?.headers ?? {})
    }
  };
}

export function jsonSuccess<T>(data: T, init?: ResponseInit) {
  return NextResponse.json(data, withDefaultHeaders(init));
}

export function jsonError(message: string, status = 400, details?: Record<string, unknown>) {
  return NextResponse.json(
    {
      error: message,
      ...(details ? { details } : {})
    },
    withDefaultHeaders({ status })
  );
}