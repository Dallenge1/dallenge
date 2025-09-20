
'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send, ArrowLeft } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';
import { sendMessage } from '@/app/chat-actions';
import { cn } from '@/lib/utils';
import Link from 'next/link';

type Message = {
  id: string;
  senderId: string;
  text: string;
  timestamp: Timestamp | null;
};

type OtherUser = {
  id: string;
  displayName: string;
  photoURL: string;
};

export default function ChatPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chatId = params.chatId as string;
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [messages, setMessages] = useState<Message[]>([]);
  const [otherUser, setOtherUser] = useState<OtherUser | null>(() => {
    const displayName = searchParams.get('displayName');
    const photoURL = searchParams.get('photoURL');
    const otherUserId = searchParams.get('otherUserId');
    if (displayName && photoURL && otherUserId) {
        return {
            id: otherUserId,
            displayName: decodeURIComponent(displayName),
            photoURL: decodeURIComponent(photoURL),
        };
    }
    return null;
  });
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    if (!chatId || !currentUser) return;

    // Fetch fresh user data in the background to ensure it's up-to-date
    const fetchChatInfo = async () => {
      // No need to set loading to true for the header, it's pre-filled
      try {
        const chatRef = doc(db, 'chats', chatId);
        const chatSnap = await getDoc(chatRef);

        if (chatSnap.exists()) {
          const chatData = chatSnap.data();
          const otherUserId = chatData.members.find((id: string) => id !== currentUser.uid);
          
          if(otherUserId && (!otherUser || otherUser.id !== otherUserId)) { // Fetch only if not passed or mismatched
            const userRef = doc(db, 'users', otherUserId);
            const userSnap = await getDoc(userRef);

            if(userSnap.exists()){
                const userData = userSnap.data();
                 setOtherUser({
                    id: otherUserId,
                    displayName: userData.displayName,
                    photoURL: userData.photoURL,
                });
            }
          }
        }
      } catch (error) {
        console.error("Failed to fetch fresh chat info:", error)
        // Don't toast here as it might be annoying if it fails in the background
      }
    };

    fetchChatInfo();

    const messagesCol = collection(db, 'chats', chatId, 'messages');
    const q = query(messagesCol, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const msgs: Message[] = [];
      querySnapshot.forEach((doc) => {
        msgs.push({ id: doc.id, ...doc.data() } as Message);
      });
      setMessages(msgs);
      setLoading(false);
    }, (error) => {
        console.error('Error fetching messages: ', error);
        toast({ variant: 'destructive', title: 'Error', description: 'Could not load messages.'});
        setLoading(false);
    });

    return () => unsubscribe();
  }, [chatId, currentUser, toast, otherUser]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !currentUser) return;

    startTransition(async () => {
      try {
        await sendMessage(chatId, currentUser.uid, newMessage);
        setNewMessage('');
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to send message.',
        });
      }
    });
  };

  return (
    <div className="flex flex-col h-full">
      <header className="flex items-center gap-4 border-b p-4">
        <Button variant="ghost" size="icon" asChild>
            <Link href={'/chat'}>
                <ArrowLeft />
            </Link>
        </Button>
        {otherUser ? (
          <Link href={`/users/${otherUser.id}`} className="flex items-center gap-4 group">
            <Avatar>
              <AvatarImage src={otherUser.photoURL} alt={otherUser.displayName} />
              <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
            </Avatar>
            <h1 className="text-xl font-bold group-hover:underline">{otherUser.displayName}</h1>
          </Link>
        ) : (
            <div className="flex items-center gap-4">
                <Skeleton className="h-10 w-10 rounded-full" />
                <Skeleton className="h-6 w-32" />
            </div>
        )}
      </header>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && messages.length === 0 ? (
          <div className="space-y-4">
            <Skeleton className="h-16 w-3/4" />
            <Skeleton className="h-16 w-3/4 ml-auto" />
            <Skeleton className="h-16 w-1/2" />
          </div>
        ) : (
          messages.map((msg) => {
            const isCurrentUser = msg.senderId === currentUser?.uid;
            return (
              <div
                key={msg.id}
                className={cn('flex items-end gap-2', isCurrentUser && 'justify-end')}
              >
                {!isCurrentUser && otherUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={otherUser.photoURL} />
                     <AvatarFallback>{otherUser.displayName.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
                <div
                  className={cn(
                    'max-w-xs md:max-w-md lg:max-w-lg rounded-lg px-4 py-2 text-sm',
                    isCurrentUser
                      ? 'bg-primary text-primary-foreground'
                      : 'bg-muted'
                  )}
                >
                  <p className="whitespace-pre-wrap">{msg.text}</p>
                </div>
                 {isCurrentUser && (
                   <Avatar className="h-8 w-8">
                     <AvatarImage src={currentUser.photoURL ?? undefined} />
                     <AvatarFallback>{currentUser.displayName?.charAt(0)}</AvatarFallback>
                   </Avatar>
                )}
              </div>
            );
          })
        )}
        <div ref={messagesEndRef} />
      </div>

      <footer className="border-t p-4">
        <div className="flex items-center gap-2">
          <Input
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
            placeholder="Type a message..."
            disabled={isPending}
          />
          <Button onClick={handleSendMessage} disabled={isPending || !newMessage.trim()}>
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </footer>
    </div>
  );
}
