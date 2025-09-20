
'use client';

import {
  generateWinnerImage as generateWinnerImageFlow,
  GenerateWinnerImageInput,
  GenerateWinnerImageOutput,
} from '@/ai/flows/generate-winner-image';

export type { GenerateWinnerImageInput, GenerateWinnerImageOutput };

export async function generateWinnerImage(
  input: GenerateWinnerImageInput
): Promise<GenerateWinnerImageOutput> {
  return await generateWinnerImageFlow(input);
}
