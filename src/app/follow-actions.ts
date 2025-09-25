
'use server';

import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, arrayUnion, arrayRemove, collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

const createActivity = async (userId: string, activityData: Omit<any, 'timestamp' | 'isRead'>) => {
    if (userId === activityData.fromUserId) return;
    try {
        const activityCollection = collection(db, 'users', userId, 'activity');
        await addDoc(activityCollection, {
            ...activityData,
            timestamp: serverTimestamp(),
            isRead: false,
        });
    } catch (error) {
        console.error('Error creating activity:', error);
    }
};

export async function toggleFollow(currentUserId: string, targetUserId: string) {
    if (currentUserId === targetUserId) {
        throw new Error("You cannot follow yourself.");
    }

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    try {
        const batch = writeBatch(db);
        const targetUserSnap = await getDoc(targetUserRef);
        const targetUserData = targetUserSnap.data();

        const currentUserSnap = await getDoc(currentUserRef);
        const currentUserData = currentUserSnap.data();
        
        if (!currentUserData) throw new Error("Current user not found");

        const isFollowing = targetUserData?.followers?.includes(currentUserId);

        if (isFollowing) {
            // Unfollow
            batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
            batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
        } else {
            // Follow
            batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
            batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
            
            // Create activity for the followed user
            await createActivity(targetUserId, {
                type: 'NEW_FOLLOWER',
                fromUserId: currentUserId,
                fromUserName: currentUserData.displayName,
                fromUserAvatarUrl: currentUserData.photoURL,
            });
        }

        await batch.commit();

        revalidatePath(`/users/${currentUserId}`);
        revalidatePath(`/users/${targetUserId}`);
        revalidatePath('/dashboard');

    } catch (error) {
        console.error("Error toggling follow:", error);
        throw new Error("Failed to update follow status.");
    }
}
