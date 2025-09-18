'use server';

/**
 * @fileOverview A helpful AI assistant for the DAWION application.
 * - chat - A function that takes conversation history and a new message, and returns an AI response.
 * - ChatInput - The input type for the chat function.
 * - ChatOutput - The return type for the chat function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const MessageSchema = z.object({
  role: z.enum(['user', 'model']),
  content: z.string(),
});

const ChatInputSchema = z.object({
  history: z.array(MessageSchema),
  message: z.string(),
});
export type ChatInput = z.infer<typeof ChatInputSchema>;

export type ChatOutput = string;

export async function chat(input: ChatInput): Promise<ChatOutput> {
  return chatFlow(input);
}

const systemPrompt = `You are a helpful AI assistant for the DAWION application. DAWION is an all-in-one educational and wellness platform.

Your goal is to assist users by answering their questions about the application's features.

Here are the features available in the DAWION app:
- Dashboard: An overview of user activity.
- Videos: A library of educational videos on various topics.
- Documents: A place to access and share educational documents.
- IQ Games: Brain-teasing games to challenge cognitive skills.
- BMI Calculator: A tool to calculate Body Mass Index.
- AI Personal Trainer: Get personalized fitness plans powered by AI.
- Tracking: Log meals and workouts to track progress.
- Social Feed: Connect with the community and share thoughts.
- Leaderboard: See top-ranked users.
- Profile: Manage account settings.

Be friendly, concise, and helpful in your responses.`;

const chatFlow = ai.defineFlow(
  {
    name: 'chatFlow',
    inputSchema: ChatInputSchema,
    outputSchema: z.string(),
  },
  async ({history, message}) => {
    const {output} = await ai.generate({
      system: systemPrompt,
      history: history.map(h => ({role: h.role, parts: [{text: h.content}]})),
      prompt: message,
    });
    return output?.text ?? 'Sorry, I could not process that. Please try again.';
  }
);
