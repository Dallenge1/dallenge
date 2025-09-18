'use server';

/**
 * @fileoverview A chatbot flow that answers questions about the application.
 *
 * - askAwion - A function that takes conversation history and a new message and returns a response.
 */

import { ai } from '@/ai/genkit';
import { ChatInput, ChatInputSchema, ChatOutput, ChatOutputSchema } from './chat-types';


export async function askAwion(input: ChatInput): Promise<ChatOutput> {
  return await chatFlow(input);
}

const chatFlow = ai.defineFlow(
  {
    name: 'askAwionFlow',
    inputSchema: ChatInputSchema,
    outputSchema: ChatOutputSchema,
  },
  async ({ history, message }) => {
    const systemPrompt = `You are AWION, an AI assistant for the DAWION application. Your purpose is to help users navigate and understand the features of the application.

The DAWION application has the following features:
- Dashboard: An overview of user activity.
- Videos: A library of educational videos on various topics.
- Documents: A repository for accessing and sharing educational documents.
- IQ Games: A section with games to challenge cognitive skills.
- BMI Calculator: A tool to calculate Body Mass Index.
- AI Personal Trainer: A feature that provides personalized fitness plans using AI.
- Tracking: Tools to track diet and exercise.
- Social Feed: A community feed to connect with other users.
- Leaderboard: A leaderboard to see top-ranked users.
- Profile: A page to manage account settings.

When asked for help, be friendly and concise. If the user asks a question that is not related to the DAWION application, politely decline and steer the conversation back to the app's features.`;

    const fullHistory = [
      { role: 'user' as const, content: [{ text: systemPrompt }] },
      { role: 'model' as const, content: [{ text: 'Hello! I am AWION, your AI assistant. How can I help you navigate the features of the DAWION application today?' }] },
    ];

    if (history) {
      fullHistory.push(...history.map(h => ({
        role: h.role,
        content: [{text: h.content}]
      })))
    }

    const { output } = await ai.generate({
      prompt: message,
      history: fullHistory,
      model: 'googleai/gemini-2.5-flash',
    });

    return output?.text ?? 'Sorry, I could not process that. Please try again.';
  }
);
