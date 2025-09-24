
'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  doc,
  getDoc,
  Timestamp,
  getDocs,
  limit,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { MessageSquare } from 'lucide-react';

type UserInfo = {
  id: string;
  displayName: string;
  photoURL: string;
  status?: 'online' | 'offline';
  lastSeen?: Timestamp;
};

type Chat = {
  id: string;
  members: string[];
  otherUser: UserInfo | null;
  lastMessage?: string;
  lastMessageTimestamp?: Timestamp;
  lastMessageSenderId?: string;
};

export default function ChatsPage() {
  const { user: currentUser } = useAuth();
  const { toast } = useToast();
  const [chats, setChats] = useState<Chat[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) {
        setLoading(false);
        return;
    };

    const q = query(
      collection(db, 'chats'),
      where('members', 'array-contains', currentUser.uid),
      orderBy('lastMessageTimestamp', 'desc')
    );

    const unsubscribe = onSnapshot(
      q,
      async (querySnapshot) => {
        const chatsData: Chat[] = await Promise.all(
            querySnapshot.docs.map(async (docSnap) => {
                const data = docSnap.data();
                const otherUserId = data.members.find(
                (id: string) => id !== currentUser.uid
                );

                let otherUser: UserInfo | null = null;
                if (otherUserId) {
                    const userRef = doc(db, 'users', otherUserId);
                    const userSnap = await getDoc(userRef);
                    if (userSnap.exists()) {
                        const userData = userSnap.data();
                        otherUser = {
                            id: userSnap.id,
                            displayName: userData.displayName,
                            photoURL: userData.photoURL,
                            status: userData.status,
                            lastSeen: userData.lastSeen,
                        };
                    } else {
                        const postsQuery = query(
                            collection(db, 'posts'),
                            where('authorId', '==', otherUserId),
                            orderBy('timestamp', 'desc'),
                            limit(1)
                        );
                        const postsSnapshot = await getDocs(postsQuery);
                        if (!postsSnapshot.empty) {
                            const postData = postsSnapshot.docs[0].data();
                            otherUser = {
                                id: otherUserId,
                                displayName: postData.authorName,
                                photoURL: postData.authorAvatarUrl,
                            };
                        }
                    }
                }
                
                return {
                    id: docSnap.id,
                    members: data.members,
                    otherUser,
                    lastMessage: data.lastMessage,
                    lastMessageTimestamp: data.lastMessageTimestamp,
                    lastMessageSenderId: data.lastMessageSenderId,
                } as Chat;
          })
        );
        setChats(chatsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching chats:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load your conversations.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [currentUser, toast]);

  return (
    <div className="space-y-6">
       <header>
        <h1 className="text-3xl font-bold tracking-tight">Messages</h1>
        <p className="text-muted-foreground">
          Your private conversations with other users.
        </p>
      </header>
      <div className="border rounded-lg">
        {loading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-2">
                    <Skeleton className="h-12 w-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-1/3" />
                    <Skeleton className="h-4 w-2/3" />
                    </div>
                </div>
            ))}
          </div>
        ) : chats.length === 0 ? (
          <div className="text-center p-8">
            <MessageSquare className="mx-auto h-12 w-12 text-muted-foreground" />
            <h3 className="mt-4 text-lg font-semibold">No Messages Yet</h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Start a conversation by visiting a user's profile.
            </p>
          </div>
        ) : (
          <ul className="divide-y">
            {chats.map((chat) => chat.otherUser && (
              <li key={chat.id}>
                <Link
                  href={{
                    pathname: `/chat/${chat.id}`,
                    query: {
                      otherUserId: chat.otherUser.id,
                      displayName: encodeURIComponent(chat.otherUser.displayName),
                      photoURL: encodeURIComponent(chat.otherUser.photoURL),
                    },
                  }}
                  className="flex items-center gap-4 p-4 transition-colors hover:bg-muted/50"
                >
                  <div className="relative">
                    <Avatar className="h-12 w-12">
                      <AvatarImage
                        src={chat.otherUser.photoURL}
                        alt={chat.otherUser.displayName}
                      />
                      <AvatarFallback>
                        {chat.otherUser.displayName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    {chat.otherUser.status === 'online' && (
                       <span className="absolute bottom-0 right-0 block h-3 w-3 rounded-full bg-green-500 ring-2 ring-background" />
                    )}
                  </div>
                  <div className="flex-1 truncate">
                    <div className="flex justify-between">
                        <h3 className="font-semibold">{chat.otherUser.displayName}</h3>
                         {chat.lastMessageTimestamp && (
                            <p className="text-xs text-muted-foreground">
                                {formatDistanceToNow(chat.lastMessageTimestamp.toDate(), { addSuffix: true })}
                            </p>
                        )}
                    </div>
                    <p className={cn("text-sm truncate", chat.lastMessageSenderId === currentUser?.uid ? "text-muted-foreground" : "text-foreground font-medium")}>
                       {chat.lastMessageSenderId === currentUser?.uid && 'You: '}
                       {chat.lastMessage || '...'}
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
