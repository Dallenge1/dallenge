
'use client';

import { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';
import Image from 'next/image';
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from "firebase/firestore";

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  timestamp: Timestamp;
  imageUrl?: string;
};

type ChallengeReplyProps = {
  postId: string;
  post?: Post;
  isLoading?: boolean;
};

export default function ChallengeReply({ postId, post: initialPost, isLoading: initialLoading = false }: ChallengeReplyProps) {
  const [post, setPost] = useState<Post | null>(initialPost || null);
  const [isLoading, setIsLoading] = useState(initialLoading || !initialPost);

  useEffect(() => {
    if (!initialPost && postId) {
      const fetchPost = async () => {
        setIsLoading(true);
        const postRef = doc(db, 'posts', postId);
        const postSnap = await getDoc(postRef);
        if (postSnap.exists()) {
          const data = postSnap.data();
          setPost({ id: postSnap.id, ...data } as Post);
        }
        setIsLoading(false);
      };
      fetchPost();
    }
  }, [postId, initialPost]);

  if (isLoading) {
    return (
      <div className="flex items-center gap-3">
        <Skeleton className="h-10 w-10 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
    );
  }

  if (!post) {
    return null; // Or some fallback UI for a post that couldn't be loaded
  }

  return (
    <Card className="bg-background/50">
      <CardHeader className="p-3">
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
      </CardHeader>
      <CardContent className="p-3 pt-0 space-y-2">
        {post.content && <p className="text-sm">{post.content}</p>}
        {post.imageUrl && (
          <div className="relative mt-2 aspect-video overflow-hidden rounded-lg border">
            <Image src={post.imageUrl} alt="Reply image" fill className="object-cover" />
          </div>
        )}
      </CardContent>
    </Card>
  );
}
