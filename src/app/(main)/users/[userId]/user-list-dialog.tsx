
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@/components/ui/dialog';
import { collection, doc, getDoc, getDocs, query, where } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type UserInfo = {
  id: string;
  displayName: string;
  photoURL: string;
};

type UserListDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  userIds: string[];
};

export default function UserListDialog({
  isOpen,
  onClose,
  title,
  userIds,
}: UserListDialogProps) {
  const [users, setUsers] = useState<UserInfo[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isOpen || userIds.length === 0) {
      setUsers([]);
      return;
    }

    const fetchUsers = async () => {
      setLoading(true);
      try {
        const usersData: UserInfo[] = [];
        // Firestore 'in' query is limited to 30 elements. 
        // We chunk the requests to handle more.
        const chunks = [];
        for (let i = 0; i < userIds.length; i += 30) {
            chunks.push(userIds.slice(i, i + 30));
        }

        for (const chunk of chunks) {
            const q = query(collection(db, 'users'), where('uid', 'in', chunk));
            const querySnapshot = await getDocs(q);
            querySnapshot.forEach((doc) => {
                const data = doc.data();
                usersData.push({
                    id: doc.id,
                    displayName: data.displayName,
                    photoURL: data.photoURL,
                });
            });
        }
        setUsers(usersData);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [isOpen, userIds]);

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
           {userIds.length === 0 && <DialogDescription>No users to display.</DialogDescription>}
        </DialogHeader>
        <div className="max-h-[60vh] overflow-y-auto space-y-4 py-4">
          {loading ? (
            Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-4 w-32" />
              </div>
            ))
          ) : (
            users.map((user) => (
              <Link
                key={user.id}
                href={`/users/${user.id}`}
                onClick={onClose}
                className="flex items-center gap-4 p-2 -mx-2 rounded-md hover:bg-muted"
              >
                <Avatar>
                  <AvatarImage src={user.photoURL} alt={user.displayName} />
                  <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                </Avatar>
                <span className="font-semibold">{user.displayName}</span>
              </Link>
            ))
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

    