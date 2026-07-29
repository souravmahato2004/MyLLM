import { z } from 'zod';

// Mirrors the auth schemas' shape: validateRequest parses { body, query, params }.
export const chatSchema = z.object({
  body: z.object({
    message: z
      .string()
      .trim()
      .min(1, 'Message cannot be empty')
      .max(4000, 'Message is too long'),
  }),
});
