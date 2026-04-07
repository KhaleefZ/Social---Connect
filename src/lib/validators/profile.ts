import { z } from "zod";

export const updateProfileSchema = z.object({
  email: z.string().email().optional(),
  phone_number: z.string().trim().max(30).optional().nullable(),
  bio: z.string().trim().max(160).optional().nullable(),
  avatar_url: z.string().url().optional().nullable(),
  website: z.string().url().optional().nullable(),
  location: z.string().trim().max(80).optional().nullable()
});
