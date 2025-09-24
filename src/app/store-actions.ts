
'use server';

import { db } from '@/lib/firebase';
import { doc, updateDoc, arrayUnion, getDoc, increment } from 'firebase/firestore';
import { revalidatePath } from 'next/cache';
import { STORE_ITEMS } from '@/lib/store-items';

export async function purchaseItem(userId: string, itemId: string) {
  const userRef = doc(db, 'users', userId);
  const item = STORE_ITEMS.find((i) => i.id === itemId);

  if (!item) {
    throw new Error('Item not found.');
  }

  try {
    const userSnap = await getDoc(userRef);
    if (!userSnap.exists()) {
      throw new Error('User not found.');
    }

    const userData = userSnap.data();
    const userCoins = userData.coins || 0;
    const userInventory = userData.inventory || [];

    if (userInventory.includes(itemId)) {
      throw new Error('You already own this item.');
    }

    if (userCoins < item.price) {
      throw new Error('You do not have enough coins to purchase this item.');
    }

    // Atomically update user's coins and inventory
    await updateDoc(userRef, {
      coins: increment(-item.price),
      inventory: arrayUnion(itemId),
    });

    revalidatePath(`/users/${userId}`);
    revalidatePath('/store');
    
  } catch (error) {
    console.error('Error purchasing item:', error);
    if (error instanceof Error) {
        throw error;
    }
    throw new Error('Failed to purchase item.');
  }
}
