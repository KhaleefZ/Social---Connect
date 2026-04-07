import { z } from "zod";

const usernamePattern = /^[A-Za-z0-9_]{3,30}$/;

export const registerSchema = z.object({
  email: z.string().email(),
  username: z.string().regex(usernamePattern, "Username must be 3-30 characters and contain only letters, numbers, and underscores."),
  password: z.string().min(8).max(128),
  first_name: z.string().trim().min(1).max(50),
  last_name: z.string().trim().min(1).max(50)
});

export const loginSchema = z.object({
  identifier: z.string().trim().min(1),
  password: z.string().min(1)
});

export const logoutSchema = z.object({
  token: z.string().min(1).optional()
});
