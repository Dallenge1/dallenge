
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp, deleteDoc, query, where, getDocs, writeBatch } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase/auth';

async function updateAllUserPosts(userId: string, newPhotoURL: string) {
  const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
  const querySnapshot = await getDocs(postsQuery);
  const batch = writeBatch(db);
  
  querySnapshot.forEach(docSnap => {
    batch.update(docSnap.ref, { authorAvatarUrl: newPhotoURL });
  });
  
  await batch.commit();
}

export async function createPost(
  authorId: string,
  authorName: string,
  authorAvatarUrl: string,
  content: string,
  imageUrl: string | null,
  videoUrl: string | null,
  postType: 'post' | 'challenge' = 'post',
  challengeDurationHours?: number
) {
  try {
    const postData: any = {
      authorId,
      authorName,
      authorAvatarUrl,
      content,
      imageUrl: imageUrl || null,
      videoUrl: videoUrl || null,
      timestamp: serverTimestamp(),
      likes: [],
      comments: [],
      type: postType,
    };
    
    if (postType === 'challenge') {
      postData.challengeAcceptedBy = [];
      postData.challengeReplies = [];
      postData.coins = [];
      if (challengeDurationHours) {
        const now = Timestamp.now();
        const seconds = now.seconds + challengeDurationHours * 60 * 60;
        postData.challengeEndsAt = new Timestamp(seconds, now.nanoseconds);
      }
    }

    await addDoc(collection(db, 'posts'), postData);

    revalidatePath('/feed');
    revalidatePath(`/users/${authorId}`);
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
      const authorId = postData.authorId;
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
      if (authorId) {
        revalidatePath(`/users/${authorId}`);
      }
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
      const coins = postData.coins || [];
      const authorId = postData.authorId;

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
      if (authorId) {
        revalidatePath(`/users/${authorId}`);
      }
      revalidatePath('/leaderboard');
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
    const postSnap = await getDoc(postRef);
    let authorId;
    if(postSnap.exists()) {
        authorId = postSnap.data().authorId;
    }

    await updateDoc(postRef, {
      comments: arrayUnion({
        ...comment,
        timestamp: Timestamp.now(),
      }),
    });
    revalidatePath('/feed');
    if (authorId) {
      revalidatePath(`/users/${authorId}`);
    }
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
    videoUrl: string | null;
  }
) {
  try {
    const replyPostRef = await addDoc(collection(db, 'posts'), {
      ...reply,
      timestamp: serverTimestamp(),
      likes: [],
      comments: [],
      coins: [],
      type: 'post', // Replies are regular posts
      isChallengeReply: true,
      originalChallengeId: challengePostId,
    });

    const challengePostRef = doc(db, 'posts', challengePostId);
    await updateDoc(challengePostRef, {
      challengeReplies: arrayUnion(replyPostRef.id),
    });

    revalidatePath('/feed');
    revalidatePath(`/users/${reply.authorId}`);
  } catch (error)
    {
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
