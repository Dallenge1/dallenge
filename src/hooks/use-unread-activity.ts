
'use client';

import { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, Unsubscribe } from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/firebase';

export function useUnreadActivity(): boolean {
  const { user } = useAuth();
  const [hasUnread, setHasUnread] = useState(false);

  useEffect(() => {
    let unsubscribe: Unsubscribe | null = null;

    if (user) {
      const q = query(
        collection(db, 'users', user.uid, 'activity'),
        where('isRead', '==', false)
      );

      unsubscribe = onSnapshot(q, (querySnapshot) => {
        setHasUnread(!querySnapshot.empty);
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
