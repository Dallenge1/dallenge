
'use server';
/**
 * @fileOverview A flow to generate a winner's certificate image for a challenge.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

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
    const rankColors = {
        1: { bg: 'gold', text: 'black' },
        2: { bg: 'silver', text: 'black' },
        3: { bg: '#cd7f32', text: 'white' }
    };
    const rankColor = rankColors[rank as keyof typeof rankColors];


    // Step 1: Generate the base certificate without the avatar.
    const { media: baseCertificate } = await ai.generate({
        model: 'googleai/imagen-4.0-fast-generate-001',
        prompt: `Create a vibrant, trendy, and celebratory social media graphic for a winner on the "DAWION" app. The style should be modern and energetic, perfect for a Gen Z audience.

        **Key Elements & Style:**
        - **App Name:** "DAWION" should be integrated stylishly.
        - **Challenge Title:** Feature the text: "${challengeTitle}".
        - **Winner's Name:** Display "${userName}" in a bold, modern font.
        - **Rank:** Clearly show the achievement: "${rankText}". Use colors appropriate for the rank (e.g., gold for 1st).
        - **Avatar Placeholder:** Leave a clean, empty, circular space for the user's avatar. It should be a central focus.
        - **Aesthetic:** Think bold gradients, abstract shapes, dynamic lines, and maybe a subtle glow or particle effect. Avoid formal certificate borders. The background should be eye-catching and modern.
        
        **Layout Idea:**
        1. Place the circular avatar placeholder prominently.
        2. Arrange the winner's name, rank, and challenge title around it in a dynamic, visually interesting composition.
        3. The "DAWION" brand name can be smaller, perhaps in a corner.
        4. The overall image should be a square (1:1 aspect ratio) and feel like a cool, shareable Instagram post.
        
        Make it look exciting and something a user would be proud to share.`,
    });

    if (!baseCertificate.url) {
      throw new Error('Base certificate generation failed.');
    }

    const avatarDataUri = await urlToDataUri(userAvatarUrl);

    // Step 2: Composite the avatar onto the base certificate.
    const { media: finalImage } = await ai.generate({
        model: 'googleai/gemini-2.5-flash-image-preview', // This is Google's "nano-banana" model
        prompt: [
            { text: `Take the user's avatar image and place it neatly inside the empty circular placeholder on the winner's graphic. Ensure the avatar fits perfectly within the circle and the composition looks seamless and professional.` },
            { media: { url: baseCertificate.url } }, // The certificate
            { media: { url: avatarDataUri } }      // The user's avatar
        ],
        config: {
            responseModalities: ['IMAGE'],
        }
    });


    if (!finalImage.url) {
      throw new Error('Image generation failed to produce a final image.');
    }

    return {
      imageUrl: finalImage.url,
    };
  }
);
