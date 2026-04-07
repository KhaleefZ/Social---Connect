import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { env } from "@/lib/env";

export type AuthTokenPayload = {
  sub: string;
  email: string;
  username: string;
};

function getJwtSecret() {
  const secret = env.JWT_SECRET ?? process.env.JWT_SECRET;

  if (!secret) {
    throw new Error("JWT_SECRET is required to sign or verify authentication tokens.");
  }

  return new TextEncoder().encode(secret);
}

export async function hashPassword(password: string) {
  return bcrypt.hash(password, 12);
}

export async function comparePassword(password: string, hash: string) {
  return bcrypt.compare(password, hash);
}

export async function signAuthToken(payload: AuthTokenPayload) {
  return new SignJWT({ email: payload.email, username: payload.username })
    .setProtectedHeader({ alg: "HS256" })
    .setSubject(payload.sub)
    .setJti(crypto.randomUUID())
    .setIssuedAt()
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthToken(token: string) {
  const { payload } = await jwtVerify(token, getJwtSecret());
  const userId = typeof payload.sub === "string" ? payload.sub : "";

  if (!userId) {
    throw new Error("Token is missing a subject.");
  }

  return {
    userId,
    email: typeof payload.email === "string" ? payload.email : "",
    username: typeof payload.username === "string" ? payload.username : "",
    tokenId: typeof payload.jti === "string" ? payload.jti : "",
    expiresAt: typeof payload.exp === "number" ? payload.exp : 0
  };
}