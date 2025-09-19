
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Heart, Share2, CornerRightDown } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { createPost, likePost } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';

type Post = {
  id: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  timestamp: Timestamp;
  likes: string[];
};

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  const userAvatar = PlaceHolderImages.find((i) => i.id === 'user-avatar-1');

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        postsData.push({
          id: doc.id,
          authorName: data.authorName,
          authorAvatarUrl: data.authorAvatarUrl,
          content: data.content,
          timestamp: data.timestamp,
          likes: data.likes || [],
        });
      });
      setPosts(postsData);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handlePost = () => {
    if (!content.trim() || !user || !userAvatar) return;

    startTransition(async () => {
      try {
        await createPost(
          user.displayName || 'Anonymous',
          userAvatar.imageUrl,
          content
        );
        setContent('');
        toast({
          title: 'Success',
          description: 'Your post has been published.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to create post. Please try again.',
        });
      }
    });
  };

  const handleLike = (postId: string) => {
    if (!user) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'You must be logged in to like a post.',
      });
      return;
    }
    startTransition(async () => {
      try {
        await likePost(postId, user.uid);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to update like status. Please try again.',
        });
      }
    });
  };

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Social Feed</h1>
        <p className="text-muted-foreground">
          Connect with the community and share your thoughts.
        </p>
      </header>

      <Card>
        <CardContent className="flex gap-4 p-4">
          {userAvatar && (
            <Avatar>
              <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" />
              <AvatarFallback>
                {user?.displayName?.charAt(0) ?? 'U'}
              </AvatarFallback>
            </Avatar>
          )}
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending}
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={isPending || !content.trim()}>
                {isPending ? 'Posting...' : 'Post'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {loading ? (
           Array.from({ length: 3 }).map((_, index) => (
             <Card key={index}>
               <CardHeader>
                 <div className="flex items-center gap-3">
                   <Skeleton className="h-10 w-10 rounded-full" />
                   <div className="space-y-2">
                     <Skeleton className="h-4 w-[150px]" />
                     <Skeleton className="h-3 w-[100px]" />
                   </div>
                 </div>
               </CardHeader>
               <CardContent>
                 <div className="space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                 </div>
               </CardContent>
               <CardFooter className="flex justify-between border-t p-2">
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
                    <Skeleton className="h-8 w-24" />
               </CardFooter>
             </Card>
           ))
        ) : (
          posts.map((post) => {
            const hasLiked = user ? post.likes.includes(user.uid) : false;
            return (
              <Card key={post.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <Avatar>
                      <AvatarImage
                        src={post.authorAvatarUrl}
                        alt={post.authorName}
                      />
                      <AvatarFallback>
                        {post.authorName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{post.authorName}</p>
                      <p className="text-xs text-muted-foreground">
                        {post.timestamp
                          ? formatDistanceToNow(post.timestamp.toDate(), {
                              addSuffix: true,
                            })
                          : 'just now'}
                      </p>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm whitespace-pre-wrap">{post.content}</p>
                </CardContent>
                <CardFooter className="flex justify-between border-t p-2">
                  <Button
                    variant="ghost"
                    className="flex-1"
                    onClick={() => handleLike(post.id)}
                    disabled={isPending}
                  >
                    <Heart
                      className={cn(
                        'mr-2 h-4 w-4',
                        hasLiked && 'fill-red-500 text-red-500'
                      )}
                    />
                    Like ({post.likes.length})
                  </Button>
                  <Button variant="ghost" className="flex-1" disabled>
                    <MessageCircle className="mr-2 h-4 w-4" /> Comment
                  </Button>
                  <Button variant="ghost" className="flex-1" disabled>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </CardFooter>
              </Card>
            );
          })
        )}
         {!loading && posts.length === 0 && (
            <Card className="flex flex-col items-center justify-center p-8 text-center">
                <CardHeader>
                    <CornerRightDown className="h-12 w-12 text-muted-foreground mx-auto" />
                </CardHeader>
                <CardContent>
                    <h3 className="text-lg font-semibold">No posts yet</h3>
                    <p className="text-muted-foreground">Be the first to share something with the community!</p>
                </CardContent>
            </Card>
        )}
      </div>
    </div>
  );
}
