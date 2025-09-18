// src/ai/flows/personalized-fitness-recommendations.ts
'use server';

/**
 * @fileOverview AI-powered personal fitness trainer that provides personalized fitness recommendations based on user data.
 *
 * - getPersonalizedFitnessRecommendations - A function that takes user data as input and returns personalized fitness recommendations.
 * - PersonalizedFitnessRecommendationsInput - The input type for the getPersonalizedFitnessRecommendations function.
 * - PersonalizedFitnessRecommendationsOutput - The return type for the getPersonalizedFitnessRecommendations function.
 */

import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const PersonalizedFitnessRecommendationsInputSchema = z.object({
  age: z.number().describe('The age of the user in years.'),
  weight: z.number().describe('The weight of the user in kilograms.'),
  fitnessLevel: z
    .enum(['Beginner', 'Intermediate', 'Advanced'])
    .describe('The current fitness level of the user.'),
  goals: z
    .string()
    .describe(
      'The fitness goals of the user, e.g., weight loss, muscle gain, improved endurance.'
    ),
});

export type PersonalizedFitnessRecommendationsInput = z.infer<
  typeof PersonalizedFitnessRecommendationsInputSchema
>;

const PersonalizedFitnessRecommendationsOutputSchema = z.object({
  recommendations: z
    .string()
    .describe('Personalized fitness recommendations based on user data.'),
});

export type PersonalizedFitnessRecommendationsOutput = z.infer<
  typeof PersonalizedFitnessRecommendationsOutputSchema
>;

export async function getPersonalizedFitnessRecommendations(
  input: PersonalizedFitnessRecommendationsInput
): Promise<PersonalizedFitnessRecommendationsOutput> {
  return personalizedFitnessRecommendationsFlow(input);
}

const prompt = ai.definePrompt({
  name: 'personalizedFitnessRecommendationsPrompt',
  input: {schema: PersonalizedFitnessRecommendationsInputSchema},
  output: {schema: PersonalizedFitnessRecommendationsOutputSchema},
  prompt: `You are an AI personal trainer. Your goal is to provide personalized fitness recommendations to users based on their inputted data.

  Consider the user's age, weight, fitness level, and goals to create safe and effective recommendations. The recommendations should include types of exercises, frequency, duration, and intensity.

  User Data:
  Age: {{{age}}}
  Weight: {{{weight}}} kg
  Fitness Level: {{{fitnessLevel}}}
  Goals: {{{goals}}}

  Personalized Fitness Recommendations:`,
});

const personalizedFitnessRecommendationsFlow = ai.defineFlow(
  {
    name: 'personalizedFitnessRecommendationsFlow',
    inputSchema: PersonalizedFitnessRecommendationsInputSchema,
    outputSchema: PersonalizedFitnessRecommendationsOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
