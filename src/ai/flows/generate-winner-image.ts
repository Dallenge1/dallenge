
'use server';
/**
 * @fileOverview A flow to generate a winner's certificate image for a challenge.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';
import { MediaPart } from 'genkit/cohere';

const GenerateWinnerImageInputSchema = z.object({
  rank: z.number().describe('The rank of the winner (e.g., 1, 2, 3).'),
  userName: z.string().describe("The winner's display name."),
  userAvatarUrl: z.string().url().describe("The URL of the winner's avatar image."),
  challengeTitle: z.string().describe('The title of the challenge that was won.'),
});

export type GenerateWinnerImageInput = z.infer<typeof GenerateWinnerImageInputSchema>;

const GenerateWinnerImageOutputSchema = z.object({
  imageUrl: z.string().describe('The data URI of the generated winner image.'),
});

export type GenerateWinnerImageOutput = z.infer<typeof GenerateWinnerImageOutputSchema>;

async function urlToDataUri(url: string): Promise<string> {
    const fetch = (await import('node-fetch')).default;
    const response = await fetch(url);
    if (!response.ok) {
        throw new Error(`Failed to fetch image from ${url}: ${response.statusText}`);
    }
    const buffer = await response.arrayBuffer();
    const contentType = response.headers.get('content-type') || 'image/jpeg';
    const base64 = Buffer.from(buffer).toString('base64');
    return `data:${contentType};base64,${base64}`;
}


export async function generateWinnerImage(input: GenerateWinnerImageInput): Promise<GenerateWinnerImageOutput> {
  return generateWinnerImageFlow(input);
}

const generateWinnerImageFlow = ai.defineFlow(
  {
    name: 'generateWinnerImageFlow',
    inputSchema: GenerateWinnerImageInputSchema,
    outputSchema: GenerateWinnerImageOutputSchema,
  },
  async (input) => {
    const { rank, userName, userAvatarUrl, challengeTitle } = input;

    const rankText = rank === 1 ? '1st Place' : rank === 2 ? '2nd Place' : '3rd Place';

    const avatarDataUri = await urlToDataUri(userAvatarUrl);

    const { media } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Create a visually stunning and celebratory winner's certificate image for a challenge on the "DAWION" app.

        **Key elements to include:**
        - **App Name:** "DAWION" should be clearly visible, perhaps in a stylized font at the top.
        - **Challenge Title:** Feature the text: "${challengeTitle}".
        - **Winner's Name:** Prominently display the winner's name: "${userName}".
        - **Rank:** Clearly show the achievement: "${rankText}".
        - **Avatar:** Include the user's avatar in the design, perhaps in a circular frame. The avatar is provided as an image input.
        - **Theme:** The overall theme should be celebratory and prestigious. Think gold accents, laurels, a trophy or medal icon, and a clean, modern design. The background should be elegant, perhaps a subtle gradient or pattern.
        
        **Layout guidance:**
        1. "DAWION" at the top.
        2. A graphic element like a trophy or laurel wreath.
        3. The rank "${rankText}" below the graphic.
        4. The winner's avatar, integrated cleanly.
        5. The winner's name, "${userName}".
        6. A statement like "For conquering the challenge:".
        7. The challenge title: "${challengeTitle}".
        
        The image should be high-quality and suitable for sharing on social media. Aspect ratio should be square (1:1).`,
        media: [
            { url: avatarDataUri }
        ]
    });

    if (!media.url) {
      throw new Error('Image generation failed to produce an image.');
    }

    return {
      imageUrl: media.url,
    };
  }
);
