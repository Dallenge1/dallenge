
'use client';

import { useEffect, useState, useTransition } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Heart, Share2, CornerRightDown } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { createPost, likePost, addComment } from '@/app/actions';
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
import Comment from './comment';
import Link from 'next/link';

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

export default function FeedPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [content, setContent] = useState('');
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [commentContent, setCommentContent] = useState('');
  const [activeCommentBox, setActiveCommentBox] = useState<string | null>(null);

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));
    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const postsData: Post[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
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
      setPosts(postsData);
      setLoading(false);
    }, (error) => {
        console.error("Error fetching posts:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load feed. Check console for details.',
        });
        setLoading(false);
    });

    return () => unsubscribe();
  }, [toast]);

  const handlePost = () => {
    if (!content.trim() || !user) return;

    startTransition(async () => {
      try {
        await createPost(
          user.uid,
          user.displayName || 'Anonymous',
          user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
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
  
  const handleShare = async (postId: string) => {
    if (navigator.clipboard && window.isSecureContext) {
      try {
        const postUrl = `${window.location.origin}/feed#${postId}`;
        await navigator.clipboard.writeText(postUrl);
        toast({
            title: 'Link Copied',
            description: 'The link to the post has been copied to your clipboard.',
        });
      } catch (err) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not copy link.',
        });
      }
    } else {
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Could not copy link. Your browser may not support this feature or you are not on a secure connection (HTTPS).',
        });
    }
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentContent.trim() || !user) return;

    startTransition(async () => {
        try {
            await addComment(postId, {
                authorName: user.displayName || 'Anonymous',
                authorAvatarUrl: user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
                content: commentContent,
            });
            setCommentContent('');
            setActiveCommentBox(null);
            toast({
                title: 'Success',
                description: 'Your comment has been added.',
            });
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Failed to add comment. Please try again.',
            });
        }
    });
  };

  const toggleCommentBox = (postId: string) => {
    setActiveCommentBox(activeCommentBox === postId ? null : postId);
  }

  const renderProfileLink = (
    post: Post,
    children: React.ReactNode,
    className?: string
  ) => {
    if (post.authorId) {
      return (
        <Link href={`/users/${post.authorId}`} className={className}>
          {children}
        </Link>
      );
    }
    return <div className={cn('cursor-default', className)}>{children}</div>;
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
          <Avatar>
            <AvatarImage src={user?.photoURL ?? undefined} alt="Your avatar" />
            <AvatarFallback>
              {user?.displayName?.charAt(0) ?? 'U'}
            </AvatarFallback>
          </Avatar>
          <div className="w-full space-y-2">
            <Textarea
              placeholder="What's on your mind?"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              disabled={isPending || !user}
            />
            <div className="flex justify-end">
              <Button onClick={handlePost} disabled={isPending || !content.trim() || !user}>
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
              <Card key={post.id} id={post.id} className="w-full">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    {renderProfileLink(
                      post,
                      <Avatar>
                        <AvatarImage
                          src={post.authorAvatarUrl}
                          alt={post.authorName}
                        />
                        <AvatarFallback>
                          {post.authorName.charAt(0)}
                        </AvatarFallback>
                      </Avatar>
                    )}
                    <div>
                       {renderProfileLink(
                        post,
                        <p className="font-semibold hover:underline">
                          {post.authorName}
                        </p>
                      )}
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
                    disabled={isPending || !user}
                  >
                    <Heart
                      className={cn(
                        'mr-2 h-4 w-4',
                        hasLiked && 'fill-red-500 text-red-500'
                      )}
                    />
                    Like ({post.likes.length})
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => toggleCommentBox(post.id)} disabled={!user}>
                    <MessageCircle className="mr-2 h-4 w-4" /> Comment ({post.comments.length})
                  </Button>
                  <Button variant="ghost" className="flex-1" onClick={() => handleShare(post.id)}>
                    <Share2 className="mr-2 h-4 w-4" /> Share
                  </Button>
                </CardFooter>

                {activeCommentBox === post.id && (
                  <CardContent className="p-4 border-t">
                      <div className="flex gap-4">
                        <Avatar>
                          <AvatarImage src={user?.photoURL ?? undefined} alt="Your avatar" />
                          <AvatarFallback>
                            {user?.displayName?.charAt(0) ?? 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="w-full space-y-2">
                          <Textarea
                            placeholder="Write a comment..."
                            value={commentContent}
                            onChange={(e) => setCommentContent(e.target.value)}
                            disabled={isPending}
                          />
                          <div className="flex justify-end">
                            <Button onClick={() => handleCommentSubmit(post.id)} disabled={isPending || !commentContent.trim()}>
                              {isPending ? 'Commenting...' : 'Comment'}
                            </Button>
                          </div>
                        </div>
                      </div>

                    {post.comments.length > 0 && (
                        <div className="mt-4 space-y-4">
                            {post.comments.slice().sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis()).map((comment, index) => (
                                <Comment key={index} comment={comment} />
                            ))}
                        </div>
                    )}
                  </CardContent>
                )}
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

    
