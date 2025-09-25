
'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';

export type FollowingUser = {
  id: string;
  displayName: string;
  photoURL: string;
};

type InviteFriendsDialogProps = {
  isOpen: boolean;
  onClose: () => void;
  currentUserId: string;
  selectedUsers: string[];
  onSelectionChange: (selectedIds: string[]) => void;
};

export default function InviteFriendsDialog({
  isOpen,
  onClose,
  currentUserId,
  selectedUsers,
  onSelectionChange,
}: InviteFriendsDialogProps) {
  const [following, setFollowing] = useState<FollowingUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [internalSelection, setInternalSelection] = useState<string[]>(selectedUsers);

  useEffect(() => {
    if (isOpen) {
      setInternalSelection(selectedUsers);
    }
  }, [isOpen, selectedUsers]);

  useEffect(() => {
    if (!isOpen || !currentUserId) return;

    const fetchFollowing = async () => {
      setLoading(true);
      try {
        const userRef = doc(db, 'users', currentUserId);
        const userSnap = await getDoc(userRef);

        if (userSnap.exists()) {
          const followingIds = userSnap.data().following || [];
          if (followingIds.length > 0) {
            const userPromises = followingIds.map(async (id: string) => {
              const followingUserRef = doc(db, 'users', id);
              const followingUserSnap = await getDoc(followingUserRef);
              if (followingUserSnap.exists()) {
                const data = followingUserSnap.data();
                return {
                  id: followingUserSnap.id,
                  displayName: data.displayName,
                  photoURL: data.photoURL,
                };
              }
              return null;
            });
            const users = (await Promise.all(userPromises)).filter(Boolean) as FollowingUser[];
            setFollowing(users);
          } else {
             setFollowing([]);
          }
        }
      } catch (error) {
        console.error('Error fetching following list:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchFollowing();
  }, [isOpen, currentUserId]);

  const handleSelectUser = (userId: string) => {
    setInternalSelection((prev) =>
      prev.includes(userId) ? prev.filter((id) => id !== userId) : [...prev, userId]
    );
  };

  const handleSave = () => {
    onSelectionChange(internalSelection);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Invite Friends</DialogTitle>
          <DialogDescription>
            Select friends from your following list to invite to this private challenge.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="max-h-[60vh] -mx-6 px-6">
          <div className="space-y-4 py-4 pr-1">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-10 w-10 rounded-full" />
                  <Skeleton className="h-5 w-32" />
                </div>
              ))
            ) : following.length === 0 ? (
                <p className='text-sm text-center text-muted-foreground'>You are not following anyone yet.</p>
            ) : (
              following.map((user) => (
                <div
                  key={user.id}
                  onClick={() => handleSelectUser(user.id)}
                  className="flex items-center gap-4 p-2 -mx-2 rounded-lg hover:bg-muted cursor-pointer"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.photoURL} alt={user.displayName} />
                    <AvatarFallback>{user.displayName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <span className="font-semibold flex-1">{user.displayName}</span>
                  <Checkbox
                    checked={internalSelection.includes(user.id)}
                    onCheckedChange={() => handleSelectUser(user.id)}
                  />
                </div>
              ))
            )}
          </div>
        </ScrollArea>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave}>
            Save ({internalSelection.length})
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
