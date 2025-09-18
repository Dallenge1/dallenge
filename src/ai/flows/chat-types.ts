/**
 * @fileoverview Types and schemas for the chatbot flow.
 *
 * - ChatInputSchema - The Zod schema for the input.
 * - ChatInput - The input type for the askAwion function.
 * - ChatOutputSchema - The Zod schema for the output.
 * - ChatOutput - The return type for the askAwion function.
 */

import { z } from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.array(z.object({ text: z.string() })),
});

export const ChatInputSchema = z.object({
  history: z.array(MessageSchema).optional(),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export const ChatOutputSchema = z.string();
export type ChatOutput = z.infer<typeof ChatOutputSchema>;
