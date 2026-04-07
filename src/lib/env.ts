import { z } from "zod";

const optionalText = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().min(1).optional());

const optionalUrl = z.preprocess((value) => {
  if (typeof value !== "string") {
    return value;
  }

  const trimmed = value.trim();
  return trimmed.length === 0 ? undefined : trimmed;
}, z.string().url().optional());

const envSchema = z.object({
  NEXT_PUBLIC_APP_URL: optionalUrl,
  DATABASE_URL: optionalText,
  SUPABASE_URL: optionalUrl,
  SUPABASE_ANON_KEY: optionalText,
  SUPABASE_SERVICE_ROLE_KEY: optionalText,
  JWT_SECRET: optionalText,
  SUPABASE_STORAGE_BUCKET: optionalText,
  SMTP_HOST: optionalText,
  SMTP_PORT: optionalText,
  SMTP_USER: optionalText,
  SMTP_PASS: optionalText,
  SMTP_FROM: optionalText
});

export const env = envSchema.parse(process.env);