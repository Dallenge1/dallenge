
'use server';

import { db } from '@/lib/firebase';
import { addDoc, collection, serverTimestamp, doc, updateDoc, arrayUnion, arrayRemove, getDoc, Timestamp, deleteDoc, query, where, getDocs, writeBatch, increment, runTransaction } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { auth } from 'firebase-admin';
import { getAuth } from 'firebase/auth';
import { getOrCreateChat, sendMessage } from './chat-actions';

async function updateAllUserPosts(userId: string, newPhotoURL: string) {
  const postsQuery = query(collection(db, 'posts'), where('authorId', '==', userId));
  const querySnapshot = await getDocs(postsQuery);
  const batch = writeBatch(db);
  
  querySnapshot.forEach(docSnap => {
    batch.update(docSnap.ref, { authorAvatarUrl: newPhotoURL });
  });
  
  await batch.commit();
}

const createActivity = async (userId: string, activityData: Omit<any, 'timestamp' | 'isRead'>) => {
    if (userId === activityData.fromUserId) return; // Don't create activity for your own actions
    try {
        const activityCollection = collection(db, 'users', userId, 'activity');
        await addDoc(activityCollection, {
            ...activityData,
            timestamp: serverTimestamp(),
            isRead: false,
        });
    } catch (error) {
        console.error('Error creating activity:', error);
        // Don't throw, as this is a non-critical background task
    }
};

export async function createPost(
  authorId: string,
  authorName: string,
  authorAvatarUrl: string,
  content: string,
  imageUrl: string | null,
  videoUrl: string | null,
  postType: 'post' | 'challenge' = 'post',
  challengeDurationHours?: number,
  title?: string,
  isPrivate: boolean = false,
  invitedUsers: string[] = []
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
      isPrivate: false, // Default to public
    };
    
    if (postType === 'challenge') {
      postData.title = title || '';
      postData.challengeAcceptedBy = [];
      postData.challengeReplies = [];
      postData.coins = [];
      postData.isPrivate = isPrivate;
      if (isPrivate) {
        postData.invitedUsers = invitedUsers;
      }
      if (challengeDurationHours) {
        const now = Timestamp.now();
        const seconds = now.seconds + challengeDurationHours * 60 * 60;
        postData.challengeEndsAt = new Timestamp(seconds, now.nanoseconds);
      }
    }

    const postRef = await addDoc(collection(db, 'posts'), postData);

    // If it's a private challenge, create notifications for invited users
    if (postType === 'challenge' && isPrivate && invitedUsers.length > 0) {
      for (const invitedUserId of invitedUsers) {
        // Send an activity feed notification
        await createActivity(invitedUserId, {
          type: 'CHALLENGE_INVITE',
          fromUserId: authorId,
          fromUserName: authorName,
          fromUserAvatarUrl: authorAvatarUrl,
          postId: postRef.id,
          postTitle: title,
        });
        
        // Also send a direct message
        try {
            const chatId = await getOrCreateChat(authorId, invitedUserId);
            const invitationMessage = `You've been invited to the challenge: "${title || 'Unnamed Challenge'}"`;
            await sendMessage(chatId, authorId, invitationMessage);
        } catch (chatError) {
            console.error(`Failed to send chat invite to ${invitedUserId}:`, chatError);
        }
      }
    }


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

      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) throw new Error('Liking user not found');
      const likingUser = userSnap.data();

      if (likes.includes(userId)) {
        await updateDoc(postRef, {
          likes: arrayRemove(userId),
        });
      } else {
        await updateDoc(postRef, {
          likes: arrayUnion(userId),
        });
        await createActivity(authorId, {
            type: 'LIKE',
            fromUserId: userId,
            fromUserName: likingUser.displayName,
            fromUserAvatarUrl: likingUser.photoURL,
            postId: postId,
            postContent: postData.content?.substring(0, 50) || postData.title,
        });
      }
      revalidatePath('/feed');
      revalidatePath('/dashboard');
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
  const postRef = doc(db, 'posts', postId);

  try {
    await runTransaction(db, async (transaction) => {
        const postSnap = await transaction.get(postRef);
        if (!postSnap.exists()) {
            throw new Error("Post does not exist!");
        }
        const postData = postSnap.data();
        const authorId = postData.authorId;
        
        const givingUserRef = doc(db, 'users', userId);
        const givingUserSnap = await transaction.get(givingUserRef);
        if (!givingUserSnap.exists()) throw new Error('Giving user not found');
        const givingUserData = givingUserSnap.data();

        const postCoins = postData.coins || [];
        if (postCoins.includes(userId)) {
            // User is taking back their coin
            // This is allowed now based on user feedback
            transaction.update(postRef, { coins: arrayRemove(userId) });
        } else {
            // User is giving a coin for the first time
            transaction.update(postRef, { coins: arrayUnion(userId) });

            if (authorId && authorId !== userId) {
                await createActivity(authorId, {
                    type: 'COIN_RECEIVED',
                    fromUserId: userId,
                    fromUserName: givingUserData.displayName,
                    fromUserAvatarUrl: givingUserData.photoURL,
                    postId: postId,
                    postTitle: postData.title || postData.content?.substring(0, 50),
                });
            }
        }
    });

    revalidatePath('/feed');
    revalidatePath(`/users/${(await getDoc(postRef)).data()?.authorId}`);
    revalidatePath('/leaderboard');
    revalidatePath('/dashboard');

  } catch (error) {
    console.error('Error in addCoin transaction:', error);
    throw new Error('Failed to give coin.');
  }
}


export async function addComment(
  postId: string,
  comment: {
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    content: string;
  }
) {
  try {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);
    let postData, authorId;
    if(postSnap.exists()) {
        postData = postSnap.data();
        authorId = postData.authorId;
    }

    const newComment = {
      ...comment,
      id: new Date().getTime().toString(), // Using timestamp as a unique ID
      timestamp: Timestamp.now(),
      likes: [],
    };

    await updateDoc(postRef, {
      comments: arrayUnion(newComment),
    });

    if (authorId && authorId !== comment.authorId) {
        await createActivity(authorId, {
            type: 'NEW_COMMENT',
            fromUserId: comment.authorId,
            fromUserName: comment.authorName,
            fromUserAvatarUrl: comment.authorAvatarUrl,
            postId: postId,
            postTitle: postData?.title || postData?.content?.substring(0, 50),
            commentContent: comment.content.substring(0, 50),
        });
    }

    if (authorId) {
        revalidatePath(`/users/${authorId}`);
    }

    revalidatePath('/feed');
    revalidatePath('/dashboard');
    
  } catch (error) {
    console.error('Error adding comment:', error);
    throw new Error('Failed to add comment.');
  }
}

export async function likeComment(postId: string, commentId: string, userId: string) {
  const postRef = doc(db, 'posts', postId);
  try {
    const postSnap = await getDoc(postRef);
    if (!postSnap.exists()) {
      throw new Error("Post not found");
    }

    const postData = postSnap.data();
    const comments = postData.comments || [];
    let commentFound = false;
    let targetComment: any = null;
    let alreadyLiked = false;

    const updatedComments = comments.map((comment: any) => {
      if (comment.id === commentId) {
        commentFound = true;
        const likes = comment.likes || [];
        if (likes.includes(userId)) {
          // Unlike
          alreadyLiked = true;
          targetComment = { ...comment, likes: likes.filter((id: string) => id !== userId) };
        } else {
          // Like
          targetComment = { ...comment, likes: [...likes, userId] };
        }
        return targetComment;
      }
      return comment;
    });

    if (!commentFound) {
      throw new Error("Comment not found");
    }

    await updateDoc(postRef, { comments: updatedComments });
    
    // Create activity for the comment author if someone else liked it
    if (targetComment && targetComment.authorId !== userId && !alreadyLiked) {
        const likingUserSnap = await getDoc(doc(db, 'users', userId));
        if (likingUserSnap.exists()) {
            const likingUser = likingUserSnap.data();
            await createActivity(targetComment.authorId, {
                type: 'COMMENT_LIKE',
                fromUserId: userId,
                fromUserName: likingUser.displayName,
                fromUserAvatarUrl: likingUser.photoURL,
                postId: postId,
                commentContent: targetComment.content.substring(0, 50)
            });
        }
    }


    revalidatePath(`/feed`);
    revalidatePath(`/users/${postData.authorId}`);
    revalidatePath('/dashboard');
  } catch (error) {
    console.error("Error liking comment:", error);
    throw new Error("Failed to like comment.");
  }
}


export async function acceptChallenge(postId: string, userId: string, willAccept: boolean) {
  try {
    const postRef = doc(db, 'posts', postId);
    if (willAccept) {
      await updateDoc(postRef, {
        challengeAcceptedBy: arrayUnion(userId),
      });
    } else {
       await updateDoc(postRef, {
        challengeAcceptedBy: arrayRemove(userId),
      });
    }
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
    const challengePostSnap = await getDoc(doc(db, 'posts', challengePostId));
    const challengePostData = challengePostSnap.data();

    const replyPostRef = await addDoc(collection(db, 'posts'), {
      ...reply,
      title: challengePostData?.title || '',
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

     if (challengePostData && challengePostData.authorId && challengePostData.authorId !== reply.authorId) {
        await createActivity(challengePostData.authorId, {
            type: 'CHALLENGE_REPLY',
            fromUserId: reply.authorId,
            fromUserName: reply.authorName,
            fromUserAvatarUrl: reply.authorAvatarUrl,
            postId: challengePostId,
            postTitle: challengePostData.title,
            replyId: replyPostRef.id,
        });
    }

    revalidatePath('/feed');
    revalidatePath(`/users/${reply.authorId}`);
    revalidatePath('/dashboard');
  } catch (error)
    {
    console.error('Error replying to challenge:', error);
    throw new Error('Failed to reply to challenge.');
  }
}

export async function deletePost(postId: string, authorId?: string) {
    try {
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (!postSnap.exists()) return;

        const postData = postSnap.data();
        const currentAuthorId = postData.authorId;
        const batch = writeBatch(db);

        // Delete the post itself
        batch.delete(postRef);

        const usersToUpdate = new Set<string>();
        if(postData.authorId) usersToUpdate.add(postData.authorId);
        postData.likes?.forEach((id: string) => usersToUpdate.add(id));
        postData.coins?.forEach((id: string) => usersToUpdate.add(id));
        postData.comments?.forEach((c: any) => usersToUpdate.add(c.authorId));
        postData.invitedUsers?.forEach((id: string) => usersToUpdate.add(id));
        postData.challengeAcceptedBy?.forEach((id: string) => usersToUpdate.add(id));


        for (const userId of Array.from(usersToUpdate)) {
            const userActivityQuery = query(collection(db, 'users', userId, 'activity'), where('postId', '==', postId));
            const userActivitySnap = await getDocs(userActivityQuery);
            userActivitySnap.forEach(doc => {
                batch.delete(doc.ref);
            });
        }
        
        await batch.commit();

        revalidatePath('/feed');
        if (authorId) {
          revalidatePath(`/users/${authorId}`);
        } else if (currentAuthorId) {
          revalidatePath(`/users/${currentAuthorId}`);
        }
        revalidatePath('/dashboard');
        revalidatePath('/notifications');

    } catch (error) {
        console.error('Error deleting post:', error);
        throw new Error('Failed to delete post.');
    }
}

export async function submitFeedback(data: {
    category: string;
    message: string;
    userId: string;
    userDisplayName: string;
}) {
    try {
        await addDoc(collection(db, 'feedback'), {
            ...data,
            submittedAt: serverTimestamp(),
        });
    } catch (error) {
        console.error('Error submitting feedback:', error);
        throw new Error('Failed to submit feedback.');
    }
}

export async function markActivityAsRead(userId: string, activityId: string) {
    try {
        const activityRef = doc(db, 'users', userId, 'activity', activityId);
        await updateDoc(activityRef, { isRead: true });
        revalidatePath('/dashboard');
        revalidatePath('/notifications');
    } catch(error) {
        console.error("Error marking activity as read", error);
        // Do not throw, not a critical failure
    }
}
