
'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { Heart, MessageCircle, Share2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { likePost, addComment } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Comment from '../../feed/comment';
import Link from 'next/link';

type UserData = {
  displayName: string;
  photoURL: string;
  email: string;
};

type CommentData = {
    authorName: string;
    authorAvatarUrl: string;
    content: string;
    timestamp: Timestamp;
};

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  content: string;
  timestamp: Timestamp;
  likes: string[];
  comments: CommentData[];
};

export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;

  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!userId) return;

    // Fetch user data
    const fetchUserData = async () => {
      try {
        // We can't get user data directly from Auth by UID on the client
        // So, we'll get it from the first post they made.
        // In a real app, you'd store user profiles in Firestore.
      } catch (error) {
        console.error("Error fetching user data:", error);
      }
    };
    
    fetchUserData();

    // Fetch user's posts
    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      let userData: UserData | null = null;
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        if (!userData) {
          userData = {
            displayName: data.authorName,
            photoURL: data.authorAvatarUrl,
            email: 'Not available' // Email is private
          };
        }
        postsData.push({
          id: doc.id,
          authorId: data.authorId,
          authorName: data.authorName,
          authorAvatarUrl: data.authorAvatarUrl,
          content: data.content,
          timestamp: data.timestamp,
          likes: data.likes || [],
          comments: data.comments || [],
        });
      });
      setUser(userData);
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching user posts:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load user profile. Check console for details.',
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [userId, toast]);
  

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    likePost(postId, currentUser.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to like post.'}));
  };

  const handleShare = async (postId: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      const postUrl = `${window.location.origin}/feed#${postId}`;
      await navigator.clipboard.writeText(postUrl);
      toast({
          title: 'Link Copied',
          description: 'The link to the post has been copied to your clipboard.',
      });
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not copy link.',
        });
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Skeleton className="h-24 w-24 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64" />
          </div>
        </div>
        <div className="space-y-4">
          <Skeleton className="h-40 w-full" />
          <Skeleton className="h-40 w-full" />
        </div>
      </div>
    );
  }

  if (!user) {
    return (
        <div className="text-center py-10">
            <h2 className="text-xl font-semibold">User not found</h2>
            <p className="text-muted-foreground">This user may not exist or has not posted anything yet.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/feed">Return to Feed</Link>
            </Button>
        </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header className="flex items-center gap-4">
        <Avatar className="h-24 w-24 border-2">
          <AvatarImage src={user.photoURL} alt={user.displayName} />
          <AvatarFallback>{user.displayName?.charAt(0)}</AvatarFallback>
        </Avatar>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
          <p className="text-muted-foreground">Viewing user's posts</p>
        </div>
      </header>

      <div className="space-y-4">
        {posts.map((post) => {
          const hasLiked = currentUser ? post.likes.includes(currentUser.uid) : false;
          return (
            <Card key={post.id} id={post.id} className="w-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Avatar>
                    <AvatarImage src={post.authorAvatarUrl} alt={post.authorName} />
                    <AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.timestamp
                        ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true })
                        : 'just now'}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm whitespace-pre-wrap">{post.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-2">
                <Button variant="ghost" className="flex-1" onClick={() => handleLike(post.id)} disabled={!currentUser}>
                  <Heart className={cn('mr-2 h-4 w-4', hasLiked && 'fill-red-500 text-red-500')} />
                  Like ({post.likes.length})
                </Button>
                <Button variant="ghost" className="flex-1" disabled>
                  <MessageCircle className="mr-2 h-4 w-4" /> Comment ({post.comments.length})
                </Button>
                <Button variant="ghost" className="flex-1" onClick={() => handleShare(post.id)}>
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </CardFooter>
            </Card>
          );
        })}
        {posts.length === 0 && (
            <div className="text-center py-10">
                <p className="text-muted-foreground">This user hasn't posted anything yet.</p>
            </div>
        )}
      </div>
    </div>
  );
}
