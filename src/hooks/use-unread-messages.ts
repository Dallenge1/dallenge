
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/firebase';

export function useUnreadMessages(): boolean {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    if (user) {
      const q = query(
        collection(db, 'chats'),
        where('members', 'array-contains', user.uid)
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        let unreadFound = false;
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          const unreadCount = data.unreadCount?.[user.uid] || 0;
          if (unreadCount > 0) {
            unreadFound = true;
          }
        });
        setHasUnread(unreadFound);
      });
    } else {
      setHasUnread(false);
    }

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user]);

  return hasUnread;
}
