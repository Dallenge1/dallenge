
'use server';

import {
  getPersonalizedFitnessRecommendations,
  type PersonalizedFitnessRecommendationsInput,
  type PersonalizedFitnessRecommendationsOutput,
} from '@/ai/flows/personalized-fitness-recommendations';
import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp, deleteDoc } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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

export async function createPost(
  authorId: string,
  authorName: string,
  authorAvatarUrl: string,
  content: string,
  imageUrl: string | null,
  postType: 'post' | 'challenge' = 'post'
) {
  try {
    await addDoc(collection(db, 'posts'), {
      authorId,
      authorName,
      authorAvatarUrl,
      content,
      imageUrl: imageUrl || null,
      timestamp: serverTimestamp(),
      likes: [],
      comments: [],
      type: postType,
      ...(postType === 'challenge' && { 
        challengeAcceptedBy: [], 
        challengeReplies: [],
        coins: []
      }),
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
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      } else {
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

export async function addCoin(postId: string, userId: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const postData = postSnap.data();
      if(postData.type !== 'challenge') throw new Error("Can only add coins to challenges.");
      
      const coins = postData.coins || [];
      if (coins.includes(userId)) {
        // User already gave a coin, so we remove it (toggle behavior)
        await updateDoc(postRef, {
          coins: arrayRemove(userId),
        });
      } else {
        await updateDoc(postRef, {
          coins: arrayUnion(userId),
        });
      }
      revalidatePath('/feed');
    }
  } catch (error) {
    console.error('Error adding coin:', error);
    throw new Error('Failed to add coin.');
  }
}

export async function addComment(
  postId: string,
  comment: {
    authorName: string;
    authorAvatarUrl: string;
    content: string;
  }
) {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      comments: arrayUnion({
        ...comment,
        timestamp: Timestamp.now(),
      }),
    });
    revalidatePath('/feed');
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment.');
  }
}

export async function acceptChallenge(postId: string, userId: string) {
  try {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      challengeAcceptedBy: arrayUnion(userId),
    });
    revalidatePath('/feed');
  } catch (error) {
    console.error('Error accepting challenge:', error);
    throw new Error('Failed to accept challenge.');
  }
}

export async function replyToChallenge(
  challengePostId: string,
  reply: {
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    content: string;
    imageUrl: string | null;
  }
) {
  try {
    const replyPostRef = await addDoc(collection(db, 'posts'), {
      ...reply,
      timestamp: serverTimestamp(),
      likes: [],
      comments: [],
      type: 'post', // Replies are regular posts
      isChallengeReply: true,
      originalChallengeId: challengePostId,
    });

    const challengePostRef = doc(db, 'posts', challengePostId);
    await updateDoc(challengePostRef, {
      challengeReplies: arrayUnion(replyPostRef.id),
    });

    revalidatePath('/feed');
  } catch (error) {
    console.error('Error replying to challenge:', error);
    throw new Error('Failed to reply to challenge.');
  }
}

export async function deletePost(postId: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        await deleteDoc(postRef);
        revalidatePath('/feed');
    } catch (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post.');
    }
}
