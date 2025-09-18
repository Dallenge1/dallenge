'use server';

import {
  getPersonalizedFitnessRecommendations,
  type PersonalizedFitnessRecommendationsInput,
  type PersonalizedFitnessRecommendationsOutput,
} from '@/ai/flows/personalized-fitness-recommendations';
import { askAwion, type ChatInput, type ChatOutput } from '@/ai/flows/chat';
import { redirect } from 'next/navigation';

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

export async function chatAction(input: ChatInput): Promise<ChatOutput> {
  try {
    const result = await askAwion(input);
    return result;
  } catch (error) {
    console.error('Error getting chat response:', error);
    throw new Error('Could not get a response. Please try again.');
  }
}

export async function navigateToDashboard() {
  redirect('/dashboard');
}
