
'use server';

import { db } from '@/lib/firebase';
import {
  doc,
  getDoc,
  setDoc,
  collection,
  addDoc,
  serverTimestamp,
  Timestamp,
  arrayUnion,
  query,
  where,
  getDocs,
  increment,
  deleteDoc,
  writeBatch,
  orderBy,
  limit,
} from 'firebase/firestore';
import { revalidatePath } from 'next/cache';

async function getChatId(currentUserId: string, otherUserId: string): Promise<string> {
  // Sort IDs to ensure the chat ID is always the same regardless of who starts it
  const members = [currentUserId, otherUserId].sort();
  const chatId = members.join('_');
  
  // Check if a chat document with this ID already exists
  const chatRef = doc(db, 'chats', chatId);
  const chatSnap = await getDoc(chatRef);

  if (!chatSnap.exists()) {
    // If it doesn't exist, create it
    await setDoc(chatRef, {
      members,
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      }
    });
  }
  
  return chatId;
}

export async function getOrCreateChat(currentUserId: string, otherUserId: string) {
  const q = query(
    collection(db, 'chats'),
    where('members', 'array-contains', currentUserId)
  );

  const querySnapshot = await getDocs(q);
  let existingChatId: string | null = null;

  querySnapshot.forEach(doc => {
    const data = doc.data();
    if (data.members.includes(otherUserId)) {
      existingChatId = doc.id;
    }
  });

  if (existingChatId) {
    return existingChatId;
  }
  
  // If no chat exists, create a new one
  const members = [currentUserId, otherUserId];
  const chatId = members.sort().join('_');
  const chatRef = doc(db, 'chats', chatId);
  
  await setDoc(chatRef, {
      members: members,
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
      unreadCount: {
        [currentUserId]: 0,
        [otherUserId]: 0,
      }
  }, { merge: true });
  
  return chatId;
}

export async function sendMessage(
  chatId: string,
  senderId: string,
  text: string
) {
  if (!text.trim()) {
    throw new Error('Message cannot be empty.');
  }

  try {
    const messagesCol = collection(db, 'chats', chatId, 'messages');
    await addDoc(messagesCol, {
      senderId,
      text,
      timestamp: serverTimestamp(),
    });

    const chatRef = doc(db, 'chats', chatId);
    const chatSnap = await getDoc(chatRef);
    if (chatSnap.exists()) {
        const members = chatSnap.data().members;
        const otherUserId = members.find((id: string) => id !== senderId);

        if (otherUserId) {
            const unreadCountUpdate: { [key: string]: any } = {};
            unreadCountUpdate[`unreadCount.${otherUserId}`] = increment(1);

            await setDoc(chatRef, { 
                lastMessageTimestamp: serverTimestamp(),
                lastMessage: text,
                lastMessageSenderId: senderId,
                ...unreadCountUpdate
            }, { merge: true });
        }
    }
    revalidatePath(`/chat/${chatId}`);
    revalidatePath('/chat');

  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message.');
  }
}

export async function markChatAsRead(chatId: string, userId: string) {
    try {
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);
        if(chatSnap.exists()) {
             const unreadCountUpdate: { [key: string]: any } = {};
             unreadCountUpdate[`unreadCount.${userId}`] = 0;
            await setDoc(chatRef, {
               ...unreadCountUpdate
            }, { merge: true });
        }
    } catch (error) {
        console.error('Error marking chat as read:', error);
        // We don't throw here, as it's not critical if this fails
    }
}


export async function unsendMessage(chatId: string, messageId: string, currentUserId: string) {
    try {
        const chatRef = doc(db, 'chats', chatId);
        const messageRef = doc(db, 'chats', chatId, 'messages', messageId);
        const messageSnap = await getDoc(messageRef);

        if (!messageSnap.exists()) {
            throw new Error("Message not found.");
        }

        if (messageSnap.data().senderId !== currentUserId) {
            throw new Error("You can only delete your own messages.");
        }

        await deleteDoc(messageRef);

        // After deleting, find the new last message to update the chat preview
        const messagesQuery = query(
            collection(db, 'chats', chatId, 'messages'),
            orderBy('timestamp', 'desc'),
            limit(1)
        );
        
        const newLastMessageSnap = await getDocs(messagesQuery);
        if (!newLastMessageSnap.empty) {
            const newLastMessage = newLastMessageSnap.docs[0].data();
            await updateDoc(chatRef, {
                lastMessage: newLastMessage.text,
                lastMessageSenderId: newLastMessage.senderId,
                lastMessageTimestamp: newLastMessage.timestamp,
            });
        } else {
            // No messages left, so clear the preview
            await updateDoc(chatRef, {
                lastMessage: '',
                lastMessageSenderId: '',
                lastMessageTimestamp: serverTimestamp(), // Or use a specific value
            });
        }
        
        revalidatePath(`/chat/${chatId}`);
        revalidatePath('/chat');
    } catch(error) {
        console.error("Error unsending message:", error);
        if (error instanceof Error) throw error;
        throw new Error("Failed to unsend message.");
    }
}

export async function deleteChat(chatId: string) {
    try {
        const chatRef = doc(db, 'chats', chatId);
        const messagesCol = collection(db, 'chats', chatId, 'messages');

        // Delete all messages in the subcollection
        const messagesSnap = await getDocs(messagesCol);
        const batch = writeBatch(db);
        messagesSnap.forEach(doc => {
            batch.delete(doc.ref);
        });
        
        // Also delete the chat document itself
        batch.delete(chatRef);

        await batch.commit();

        revalidatePath('/chat');
    } catch (error) {
        console.error("Error deleting chat:", error);
        throw new Error("Failed to delete chat.");
    }
}
