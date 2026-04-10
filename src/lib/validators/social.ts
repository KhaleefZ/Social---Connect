import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
});

export const userSearchSchema = paginationSchema.extend({
  q: z.string().trim().min(1).max(50).optional()
  ,featured: z.coerce.boolean().optional().default(false)
});

export const messageInputSchema = z.object({
  content: z.string().trim().min(1).max(2000)
});

export const userIdParamsSchema = z.object({
  userId: z.string().uuid()
});

export const postIdParamsSchema = z.object({
  postId: z.string().uuid()
});

export const postCommentParamsSchema = z.object({
  postId: z.string().uuid(),
  commentId: z.string().uuid()
});
