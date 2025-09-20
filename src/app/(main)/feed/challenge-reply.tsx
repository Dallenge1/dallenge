
'use client';

import { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from "firebase/firestore";
import { User } from 'firebase/auth';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Coins, MessageCircle, MoreHorizontal, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  timestamp: Timestamp;
  imageUrl?: string;
  videoUrl?: string;
  coins?: string[];
  comments?: any[];
};

type ChallengeReplyProps = {
  postId: string;
  currentUser: User | null;
  onDelete: (postId: string) => void;
  onAddCoin: (postId: string) => void;
  onShare: (postId: string) => void;
  isPending: boolean;
};

export default function ChallengeReply({ postId, currentUser, onDelete, onAddCoin, onShare, isPending }: ChallengeReplyProps) {
  const [post, setPost] = useState<Post | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (postId) {
      const postRef = doc(db, 'posts', postId);
      const unsubscribe = onSnapshot(postRef, (docSnap) => {
        if (docSnap.exists()) {
          const data = docSnap.data();
          setPost({ id: docSnap.id, ...data } as Post);
        }
        setIsLoading(false);
      }, () => {
        setIsLoading(false);
      });
      return () => unsubscribe();
    }
  }, [postId]);

  if (isLoading) {
    return (
        <Card className="bg-background/50">
            <CardHeader className="p-3">
                <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-2">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-3 w-16" />
                    </div>
                </div>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-20 w-full" />
            </CardContent>
             <CardFooter className="flex justify-between border-t p-2">
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
                <Skeleton className="h-8 w-24" />
            </CardFooter>
        </Card>
    );
  }

  if (!post) {
    return null; // Or some fallback UI for a post that couldn't be loaded
  }

  const isAuthor = currentUser?.uid === post.authorId;
  const hasGivenCoin = currentUser ? post.coins?.includes(currentUser.uid) : false;

  return (
    <Card className="bg-background/50">
      <CardHeader className="p-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href={`/users/${post.authorId}`}>
              <Avatar className="h-9 w-9">
                <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
                <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
              </Avatar>
            </Link>
            <div>
              <Link href={`/users/${post.authorId}`}>
                <p className="font-semibold text-sm hover:underline">{post.authorName}</p>
              </Link>
              <p className="text-xs text-muted-foreground">
                {post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'just now'}
              </p>
            </div>
          </div>
          {isAuthor && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={() => onDelete(post.id)} className="text-destructive">
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {post.content && <p className="text-sm">{post.content}</p>}
        {post.imageUrl && (
          <div className="relative mt-2 aspect-video overflow-hidden rounded-lg border">
            <Image src={post.imageUrl} alt="Reply image" fill className="object-cover" />
          </div>
        )}
        {post.videoUrl && (
          <div className="relative mt-2 aspect-video overflow-hidden rounded-lg border">
            <video src={post.videoUrl} controls className="w-full h-full object-cover" />
          </div>
        )}
      </CardContent>
       <CardFooter className="flex justify-between border-t p-2">
            <Button variant="ghost" className="flex-1" onClick={() => onAddCoin(post.id)} disabled={isPending || !currentUser}>
              <Coins className={cn('mr-2 h-4 w-4', hasGivenCoin && 'text-amber-500')} />
              Coin ({post.coins?.length ?? 0})
            </Button>
            <Button variant="ghost" className="flex-1" disabled><MessageCircle className="mr-2 h-4 w-4" />Comment ({post.comments?.length ?? 0})</Button>
            <Button variant="ghost" className="flex-1" onClick={() => onShare(post.id)}><Share2 className="mr-2 h-4 w-4" />Share</Button>
      </CardFooter>
    </Card>
  );
}
