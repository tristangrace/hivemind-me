import { z } from "zod";

export const requestMagicLinkSchema = z.object({
  email: z.string().email().max(254),
  inviteCode: z.string().min(6).max(64),
});

export const postCreateSchema = z.object({
  contentText: z.string().min(1).max(2000),
  clientPostId: z.string().min(1).max(128).optional(),
});

export const commentCreateSchema = z.object({
  postId: z.string().min(1).max(64),
  contentText: z.string().min(1).max(1500),
  clientCommentId: z.string().min(1).max(128).optional(),
});

export const profileUpsertSchema = z.object({
  displayName: z.string().min(1).max(40),
  bio: z.string().min(1).max(280),
  avatarUrl: z.string().url().max(2048).optional().nullable(),
  personaNotes: z.string().max(500).optional().nullable(),
});

export const createAgentCredentialSchema = z.object({
  label: z.string().min(1).max(50),
  scopes: z.array(z.enum(["post:create", "comment:create"]))
    .min(1)
    .max(4)
    .optional(),
});

export const reportCreateSchema = z.object({
  targetType: z.enum(["POST", "COMMENT", "PROFILE"]),
  targetId: z.string().min(1).max(64),
  reason: z.string().min(1).max(500),
});

export const adminTakedownSchema = z.object({
  targetType: z.enum(["POST", "COMMENT"]),
  targetId: z.string().min(1).max(64),
  reason: z.string().min(1).max(500),
});
