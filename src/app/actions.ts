'use server';

import {
  getPersonalizedFitnessRecommendations,
  type PersonalizedFitnessRecommendationsInput,
  type PersonalizedFitnessRecommendationsOutput,
} from '@/ai/flows/personalized-fitness-recommendations';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
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

export async function navigateToDashboard() {
  redirect('/dashboard');
}

export async function createPost(
  authorName: string,
  authorAvatarUrl: string,
  content: string
) {
  try {
    await addDoc(collection(db, 'posts'), {
      authorName,
      authorAvatarUrl,
      content,
      timestamp: serverTimestamp(),
      likes: [],
    });
    revalidatePath('/feed');
  } catch (error) {
    console.error('Error creating post:', error);
    throw new Error('Failed to create post.');
  }
}

export async function likePost(postId: string, userId: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      const likes = postData.likes || [];
      if (likes.includes(userId)) {
        // User has already liked the post, so unlike it
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      } else {
        // User has not liked the post, so like it
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
        });
      }
      revalidatePath('/feed');
    }
  } catch (error) {
    console.error('Error liking post:', error);
    throw new Error('Failed to like post.');
  }
}
