
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
  const members = [currentUserId, otherUserId].sort();
  const chatId = members.join('_');
  const chatRef = doc(db, 'chats', chatId);
  await setDoc(chatRef, {
      members: members,
      createdAt: serverTimestamp(),
      lastMessageTimestamp: serverTimestamp(),
  });
  
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
    await setDoc(chatRef, { 
        lastMessageTimestamp: serverTimestamp(),
        lastMessage: text,
        lastMessageSenderId: senderId,
    }, { merge: true });

    revalidatePath(`/chat/${chatId}`);
    revalidatePath(`/chat`);
  } catch (error) {
    console.error('Error sending message:', error);
    throw new Error('Failed to send message.');
  }
}
