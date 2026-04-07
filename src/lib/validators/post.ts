import { z } from "zod";

export const createPostSchema = z.object({
  content: z.string().trim().min(1).max(280),
  media_url: z.string().url().optional().nullable(),
  media_type: z.enum(["image", "video"]).optional().nullable()
});

export const updatePostSchema = z.object({
  content: z.string().trim().min(1).max(280).optional(),
  media_url: z.string().url().optional().nullable(),
  media_type: z.enum(["image", "video"]).optional().nullable()
});
