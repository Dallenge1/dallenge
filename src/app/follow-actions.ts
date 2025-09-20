
'use server';

import { db } from '@/lib/firebase';
import { doc, writeBatch, getDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

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
        
        const isFollowing = targetUserData?.followers?.includes(currentUserId);

        if (isFollowing) {
            // Unfollow
            batch.update(currentUserRef, { following: arrayRemove(targetUserId) });
            batch.update(targetUserRef, { followers: arrayRemove(currentUserId) });
        } else {
            // Follow
            batch.update(currentUserRef, { following: arrayUnion(targetUserId) });
            batch.update(targetUserRef, { followers: arrayUnion(currentUserId) });
        }

        await batch.commit();

        revalidatePath(`/users/${currentUserId}`);
        revalidatePath(`/users/${targetUserId}`);

    } catch (error) {
        console.error("Error toggling follow:", error);
        throw new Error("Failed to update follow status.");
    }
}

    