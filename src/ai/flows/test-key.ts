'use server';
/**
 * @fileOverview A simple flow to test the API key.
 */

import { ai } from '@/ai/genkit';
import { z } from 'genkit';

export const testApiKey = ai.defineFlow(
  {
    name: 'testApiKey',
    inputSchema: z.void(),
    outputSchema: z.string(),
  },
  async () => {
    console.log('Testing API key by asking for a joke...');
    try {
      const { output } = await ai.generate({
        prompt: 'Tell me a short joke.',
      });
      const joke = output?.text ?? 'No joke found.';
      console.log('API Key Test Successful! Response:', joke);
      return joke;
    } catch (e: any) {
      console.error('API Key Test Failed. Error:', e.message);
      throw new Error(
        'The API key test failed. Please check your API key and try again.'
      );
    }
  }
);
