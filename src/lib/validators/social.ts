import { z } from "zod";

export const paginationSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(1).max(100).default(20)
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
