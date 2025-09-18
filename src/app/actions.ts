'use server';

import {
  getPersonalizedFitnessRecommendations,
  type PersonalizedFitnessRecommendationsInput,
  type PersonalizedFitnessRecommendationsOutput,
} from '@/ai/flows/personalized-fitness-recommendations';

export async function getRecommendationsAction(
  input: PersonalizedFitnessRecommendationsInput
): Promise<PersonalizedFitnessRecommendationsOutput> {
  try {
    const result = await getPersonalizedFitnessRecommendations(input);
    return result;
  } catch (error) {
    console.error('Error getting recommendations:', error);
    throw new Error('Failed to get recommendations. Please try again.');
  }
}
