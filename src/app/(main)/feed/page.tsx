
'use client';

import { useEffect, useState, useTransition, useRef } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MessageCircle, Heart, Share2, CornerRightDown, ImageIcon, X, Loader2, Trophy, CheckCircle, Reply, MoreHorizontal, Coins, Video, Clock } from 'lucide-react';
import { useAuth } from '@/components/providers/auth-provider';
import { createPost, likePost, addComment, acceptChallenge, replyToChallenge, deletePost, addCoin } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  Timestamp,
} from 'firebase/firestore';
import { db, storage } from '@/lib/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { formatDistanceToNow } from 'date-fns';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import Comment from './comment';
import Link from 'next/link';
import Image from 'next/image';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import ChallengeReply from './challenge-reply';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import ChallengeLeaderboard from './challenge-leaderboard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useCountdown } from '@/hooks/use-countdown';

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
  imageUrl?: string;
  videoUrl?: string;
  type: 'post' | 'challenge';
  challengeAcceptedBy?: string[];
  challengeReplies?: string[];
  isChallengeReply?: boolean;
  originalChallengeId?: string;
  coins?: string[];
  challengeEndsAt?: Timestamp;
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

  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [videoPreview, setVideoPreview] = useState<string | null>(null);

  const imageInputRef = useRef<HTMLInputElement>(null);
  const videoInputRef = useRef<HTMLInputElement>(null);

  const [isChallenge, setIsChallenge] = useState(false);
  const [challengeDuration, setChallengeDuration] = useState('8');
  const [replyStates, setReplyStates] = useState<{[key: string]: {content: string, imageFile: File | null, imagePreview: string | null, videoFile: File | null, videoPreview: string | null}}>({});
  const replyImageInputRef = useRef<HTMLInputElement>(null);
  const replyVideoInputRef = useRef<HTMLInputElement>(null);

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const [postToDelete, setPostToDelete] = useState<string | null>(null);
  
  const [activeTab, setActiveTab] = useState('posts');
  const hasScrolledRef = useRef(false);


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
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
          type: data.type || 'post',
          challengeAcceptedBy: data.challengeAcceptedBy || [],
          challengeReplies: data.challengeReplies || [],
          isChallengeReply: data.isChallengeReply || false,
          originalChallengeId: data.originalChallengeId,
          coins: data.coins || [],
          challengeEndsAt: data.challengeEndsAt,
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
  
  useEffect(() => {
    if (loading || posts.length === 0 || hasScrolledRef.current) {
      return;
    }
  
    const hash = window.location.hash;
    if (hash) {
      const postId = hash.substring(1);
      const post = posts.find(p => p.id === postId);
  
      if (post) {
        hasScrolledRef.current = true;
        
        const isChallenge = post.type === 'challenge';
        
        if (isChallenge && activeTab !== 'challenges') {
          setActiveTab('challenges');
        }

        // The timeout gives React time to re-render after a potential tab switch
        setTimeout(() => {
          const element = document.getElementById(postId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('bg-accent/20', 'transition-all', 'duration-1000');
            setTimeout(() => {
              element.classList.remove('bg-accent/20');
            }, 2000);
          }
        }, isChallenge ? 150 : 0); // Add slightly more delay if we are switching tabs
      }
    }
  }, [loading, posts, activeTab]);

  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>, postId?: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.onloadend = () => {
        if (postId) {
          const defaultReplyState = {content: '', imageFile: null, imagePreview: null, videoFile: null, videoPreview: null};
          setReplyStates(prev => ({...prev, [postId]: {...(prev[postId] || defaultReplyState), imageFile: file, imagePreview: reader.result as string, videoFile: null, videoPreview: null}}));
        } else {
          clearMedia(undefined, true);
          setImageFile(file);
          setImagePreview(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };
  
  const handleVideoSelect = (e: React.ChangeEvent<HTMLInputElement>, postId?: string) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      
      const video = document.createElement('video');
      video.preload = 'metadata';
      video.onloadedmetadata = () => {
        window.URL.revokeObjectURL(video.src);
        if (video.duration > 30) {
          toast({
            variant: 'destructive',
            title: 'Video Too Long',
            description: 'Please select a video that is 30 seconds or less.',
          });
          if (postId) {
            if(replyVideoInputRef.current) replyVideoInputRef.current.value = '';
          } else {
            if(videoInputRef.current) videoInputRef.current.value = '';
          }
          return;
        }

        const reader = new FileReader();
        reader.onloadend = () => {
           if (postId) {
              const defaultReplyState = {content: '', imageFile: null, imagePreview: null, videoFile: null, videoPreview: null};
              setReplyStates(prev => ({...prev, [postId]: {...(prev[postId] || defaultReplyState), videoFile: file, videoPreview: reader.result as string, imageFile: null, imagePreview: null}}));
           } else {
              clearMedia(true);
              setVideoFile(file);
              setVideoPreview(reader.result as string);
           }
        };
        reader.readAsDataURL(file);
      };
      video.src = URL.createObjectURL(file);
    }
  };

  const clearMedia = (clearImage: boolean = true, clearVideo: boolean = true, postId?: string) => {
    if(postId){
      const defaultReplyState = {content: '', imageFile: null, imagePreview: null, videoFile: null, videoPreview: null};
      const currentReplyState = replyStates[postId] || defaultReplyState;
      
      if (clearImage) {
        currentReplyState.imageFile = null;
        currentReplyState.imagePreview = null;
        if(replyImageInputRef.current) replyImageInputRef.current.value = '';
      }
      if (clearVideo) {
        currentReplyState.videoFile = null;
        currentReplyState.videoPreview = null;
        if(replyVideoInputRef.current) replyVideoInputRef.current.value = '';
      }
      setReplyStates(prev => ({...prev, [postId]: currentReplyState}));
    } else {
      if(clearImage){
        setImageFile(null);
        setImagePreview(null);
        if(imageInputRef.current) imageInputRef.current.value = '';
      }
      if(clearVideo){
        setVideoFile(null);
        setVideoPreview(null);
        if(videoInputRef.current) videoInputRef.current.value = '';
      }
    }
  }

  const uploadFile = async (file: File, folder: string): Promise<string | null> => {
    if (!user) {
        toast({ variant: 'destructive', title: 'Authentication Error', description: 'You must be logged in to upload a file.'});
        return null;
    }

    try {
        const fileRef = ref(storage, `${folder}/${user.uid}/${Date.now()}-${file.name}`);
        const snapshot = await uploadBytes(fileRef, file);
        const downloadURL = await getDownloadURL(snapshot.ref);
        return downloadURL;
    } catch (error) {
        console.error(`Error uploading to Firebase Storage in folder ${folder}:`, error);
        toast({
            variant: 'destructive',
            title: 'Upload Error',
            description: `Could not upload file.`,
        });
        return null;
    }
  }

  const handlePost = () => {
    if (!content.trim() && !imageFile && !videoFile) return;
    if (!user) return;

    startTransition(async () => {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;
      
      if (imageFile) {
        imageUrl = await uploadFile(imageFile, 'posts');
        if (!imageUrl) return;
      }
      
      if (videoFile) {
        videoUrl = await uploadFile(videoFile, 'videos');
        if (!videoUrl) return;
      }
      
      try {
        await createPost(
          user.uid,
          user.displayName || 'Anonymous',
          user.photoURL || `https://picsum.photos/seed/${user.uid}/100/100`,
          content,
          imageUrl,
          videoUrl,
          isChallenge ? 'challenge' : 'post',
          isChallenge ? parseInt(challengeDuration) : undefined
        );
        setContent('');
        clearMedia();
        setIsChallenge(false);
        setChallengeDuration('8');
        toast({
          title: 'Success',
          description: `Your ${isChallenge ? 'challenge' : 'post'} has been published.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: `Failed to create ${isChallenge ? 'challenge' : 'post'}. Please try again.`,
        });
      }
    });
  };

  const handleLike = (postId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to like a post.' });
      return;
    }
    startTransition(() => likePost(postId, user.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to update like status.' })));
  };

  const handleAddCoin = (postId: string) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'Error', description: 'You must be logged in to give coins.' });
      return;
    }
    startTransition(() => addCoin(postId, user.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to give coin.' })));
  };
  
  const handleShare = async (postId: string) => {
    const postUrl = `${window.location.origin}/feed#${postId}`;
    try {
      await navigator.clipboard.writeText(postUrl);
      toast({ title: 'Link Copied', description: 'Link to post copied to clipboard.' });
    } catch (err) {
      toast({ variant: 'destructive', title: 'Error', description: 'Could not copy link.' });
    }
  };

  const handleCommentSubmit = (postId: string) => {
    if (!commentContent.trim() || !user) return;
    startTransition(async () => {
        try {
            await addComment(postId, { authorName: user.displayName || 'Anonymous', authorAvatarUrl: user.photoURL || '', content: commentContent });
            setCommentContent('');
            setActiveCommentBox(null);
            toast({ title: 'Success', description: 'Your comment has been added.' });
        } catch (error) {
            toast({ variant: 'destructive', title: 'Error', description: 'Failed to add comment.' });
        }
    });
  };

  const toggleCommentBox = (postId: string) => {
    if (activeCommentBox === postId) {
      setActiveCommentBox(null);
    } else {
      setCommentContent('');
      setActiveCommentBox(postId);
    }
  };

  const handleAcceptChallenge = (postId: string) => {
    if (!user) return;
    startTransition(() => acceptChallenge(postId, user.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to accept challenge.'})));
  };

  const handleReplyToChallenge = (postId: string) => {
    if (!user) return;
    const { content: replyContent, imageFile: replyImageFile, videoFile: replyVideoFile } = replyStates[postId] || {};
    if (!replyContent?.trim() && !replyImageFile && !replyVideoFile) return;

    startTransition(async () => {
      let imageUrl: string | null = null;
      let videoUrl: string | null = null;

      if (replyImageFile) {
        imageUrl = await uploadFile(replyImageFile, 'posts');
        if (!imageUrl) return;
      }
      if (replyVideoFile) {
        videoUrl = await uploadFile(replyVideoFile, 'videos');
        if (!videoUrl) return;
      }

      try {
        await replyToChallenge(postId, {
          authorId: user.uid,
          authorName: user.displayName || 'Anonymous',
          authorAvatarUrl: user.photoURL || '',
          content: replyContent,
          imageUrl,
          videoUrl,
        });
        setReplyStates(prev => ({...prev, [postId]: {content: '', imageFile: null, imagePreview: null, videoFile: null, videoPreview: null}}));
        toast({ title: 'Success!', description: 'Your challenge reply has been posted.'});
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to post reply.'});
      }
    });
  };

  const handleDeletePost = (postId: string) => {
    setPostToDelete(postId);
    setDeleteAlertOpen(true);
  };

  const confirmDelete = () => {
    if (!postToDelete) return;
    startTransition(async () => {
      try {
        await deletePost(postToDelete);
        toast({ title: 'Post Deleted', description: 'Your post has been successfully deleted.' });
      } catch (error) {
        toast({ variant: 'destructive', title: 'Error', description: 'Failed to delete post.' });
      } finally {
        setDeleteAlertOpen(false);
        setPostToDelete(null);
      }
    });
  };

  const renderProfileLink = (post: Post, children: React.ReactNode, className?: string) => {
    if (!post.authorId) return <div className={className}>{children}</div>;
    return <Link href={`/users/${post.authorId}`} className={className}>{children}</Link>;
  };

  const ChallengeTimer = ({ endsAt }: { endsAt: Timestamp }) => {
    const { days, hours, minutes, seconds, isOver } = useCountdown(endsAt.toDate());

    if (isOver) {
      return <span className="text-sm font-semibold text-destructive">Challenge Ended</span>;
    }

    return (
      <span className="font-mono text-sm text-muted-foreground">
        {days > 0 && `${days}d `}
        {hours.toString().padStart(2, '0')}:
        {minutes.toString().padStart(2, '0')}:
        {seconds.toString().padStart(2, '0')}
      </span>
    );
  }

  const renderPostCard = (post: Post) => {
    const hasLiked = user ? post.likes.includes(user.uid) : false;
    const hasGivenCoin = user ? post.coins?.includes(user.uid) : false;
    
    const challengeHasEnded = post.challengeEndsAt ? post.challengeEndsAt.toDate() < new Date() : false;

    const hasAcceptedChallenge = user && post.type === 'challenge' ? post.challengeAcceptedBy?.includes(user.uid) : false;
    const replyState = replyStates[post.id] || {content: '', imageFile: null, imagePreview: null, videoFile: null, videoPreview: null};
    const isAuthor = user?.uid === post.authorId;
    
    const challengeReplies = post.challengeReplies
        ?.map(replyId => posts.find(p => p.id === replyId))
        .filter((p): p is Post => p !== undefined) || [];

    const leaderboardEntries = [post, ...challengeReplies];


    return (
      <Card key={post.id} id={post.id} className="w-full">
        {post.isChallengeReply && post.originalChallengeId && (
          <CardHeader className='p-2 pb-0'>
             <Link href={`#${post.originalChallengeId}`} className='text-xs text-muted-foreground hover:underline flex items-center gap-1'>
              <Reply className='h-3 w-3'/> Replying to a challenge
            </Link>
          </CardHeader>
        )}
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {renderProfileLink(post, <Avatar><AvatarImage src={post.authorAvatarUrl} alt={post.authorName} /><AvatarFallback>{post.authorName.charAt(0)}</AvatarFallback></Avatar>)}
              <div>
                 {renderProfileLink(post, <p className="font-semibold hover:underline">{post.authorName}</p>)}
                <p className="text-xs text-muted-foreground">{post.timestamp ? formatDistanceToNow(post.timestamp.toDate(), { addSuffix: true }) : 'just now'}</p>
              </div>
            </div>
            <div className='flex items-center gap-2'>
              {post.type === 'challenge' && (
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-500">
                  <Trophy className="h-5 w-5" />
                  <span>Challenge</span>
                </div>
              )}
               {isAuthor && post.type === 'post' && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreHorizontal className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => handleDeletePost(post.id)} className="text-destructive">
                      Delete
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.content && <p className="text-sm whitespace-pre-wrap">{post.content}</p>}
          {post.imageUrl && (<div className="relative mt-2 aspect-video overflow-hidden rounded-lg border"><Image src={post.imageUrl} alt="Post image" fill className="object-cover" /></div>)}
          {post.videoUrl && (<div className="relative mt-2 aspect-video overflow-hidden rounded-lg border"><video src={post.videoUrl} controls className="w-full h-full object-cover" /></div>)}
           {post.type === 'challenge' && post.challengeEndsAt && (
             <div className="flex items-center justify-end gap-2 pt-2 border-t mt-4">
                <Clock className="h-4 w-4 text-muted-foreground" />
                <ChallengeTimer endsAt={post.challengeEndsAt} />
             </div>
           )}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-2">
           {post.type === 'challenge' || post.isChallengeReply ? (
            <Button variant="ghost" className="flex-1" onClick={() => handleAddCoin(post.id)} disabled={isPending || !user}>
              <Coins className={cn('mr-2 h-4 w-4', hasGivenCoin && 'text-amber-500')} />
              Coin ({post.coins?.length ?? 0})
            </Button>
           ) : (
            <Button variant="ghost" className="flex-1" onClick={() => handleLike(post.id)} disabled={isPending || !user}>
              <Heart className={cn('mr-2 h-4 w-4', hasLiked && 'fill-red-500 text-red-500')} />
              Like ({post.likes.length})
            </Button>
           )}
          <Button variant="ghost" className="flex-1" onClick={() => toggleCommentBox(post.id)} disabled={!user}><MessageCircle className="mr-2 h-4 w-4" />Comment ({post.comments.length})</Button>
          {post.type === 'challenge' && user && user.uid !== post.authorId ? (
            <Button variant="ghost" className="flex-1" onClick={() => handleAcceptChallenge(post.id)} disabled={isPending || hasAcceptedChallenge || challengeHasEnded}>
              {hasAcceptedChallenge ? <><CheckCircle className="mr-2 h-4 w-4 text-green-500"/>Accepted</> : <><Trophy className="mr-2 h-4 w-4"/>Accept</>}
            </Button>
          ) : <Button variant="ghost" className="flex-1" onClick={() => handleShare(post.id)}><Share2 className="mr-2 h-4 w-4" />Share</Button>}
        </CardFooter>

        {activeCommentBox === post.id && (
          <CardContent className="p-4 border-t">
              <div className="flex gap-4">
                <Avatar><AvatarImage src={user?.photoURL ?? undefined} alt="Your avatar" /><AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback></Avatar>
                <div className="w-full space-y-2">
                  <Textarea placeholder="Write a comment..." value={commentContent} onChange={(e) => setCommentContent(e.target.value)} disabled={isPending}/>
                  <div className="flex justify-end"><Button onClick={() => handleCommentSubmit(post.id)} disabled={isPending || !commentContent.trim()}>{isPending ? 'Commenting...' : 'Comment'}</Button></div>
                </div>
              </div>
            {post.comments.length > 0 && (<div className="mt-4 space-y-4">{post.comments.slice().sort((a,b) => a.timestamp.toMillis() - b.timestamp.toMillis()).map((comment, index) => (<Comment key={index} comment={comment} />))}</div>)}
          </CardContent>
        )}

        {hasAcceptedChallenge && !challengeHasEnded && (
           <CardContent className="p-4 border-t bg-muted/50">
             <div className="flex gap-4">
                <Avatar><AvatarImage src={user?.photoURL ?? undefined} alt="Your avatar" /><AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback></Avatar>
                <div className="w-full space-y-2">
                  <Textarea placeholder="Post your reply to the challenge..." value={replyState.content} onChange={(e) => setReplyStates(prev => ({...prev, [post.id]: {...replyState, content: e.target.value}}))} disabled={isPending}/>
                  
                  {replyState.imagePreview && (
                      <div className="relative"><Image src={replyState.imagePreview} alt="Image preview" width={500} height={300} className="rounded-lg object-contain max-h-80 w-auto" />
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => clearMedia(true, false, post.id)} disabled={isPending}><X className="h-4 w-4" /></Button>
                      </div>
                  )}
                  {replyState.videoPreview && (
                      <div className="relative"><video src={replyState.videoPreview} controls className="rounded-lg max-h-80 w-auto" />
                          <Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => clearMedia(false, true, post.id)} disabled={isPending}><X className="h-4 w-4" /></Button>
                      </div>
                  )}

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <input type="file" ref={replyImageInputRef} onChange={(e) => handleImageSelect(e, post.id)} accept="image/*" className="hidden" />
                      <input type="file" ref={replyVideoInputRef} onChange={(e) => handleVideoSelect(e, post.id)} accept="video/*" className="hidden" />
                      <Button variant="outline" size="icon" onClick={() => replyImageInputRef.current?.click()} disabled={isPending || !!replyState.videoPreview}><ImageIcon className="h-5 w-5"/></Button>
                      <Button variant="outline" size="icon" onClick={() => replyVideoInputRef.current?.click()} disabled={isPending || !!replyState.imagePreview}><Video className="h-5 w-5"/></Button>
                    </div>
                    <Button onClick={() => handleReplyToChallenge(post.id)} disabled={isPending || (!replyState.content.trim() && !replyState.imageFile && !replyState.videoFile)}>{isPending ? 'Posting...' : 'Post Reply'}</Button>
                  </div>
                </div>
              </div>
           </CardContent>
        )}
        
        {post.type === 'challenge' && (challengeReplies.length > 0 || (post.coins && post.coins.length > 0)) && (
          <CardContent className='p-0 border-t'>
            <Tabs defaultValue="replies" className="w-full">
              <TabsList className="grid w-full grid-cols-2 rounded-none">
                <TabsTrigger value="replies">Replies ({challengeReplies.length})</TabsTrigger>
                <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
              </TabsList>
              <TabsContent value="replies" className="p-4 bg-muted/20">
                  <div className='space-y-4'>
                    {challengeReplies.map(reply => (
                        <ChallengeReply 
                            key={reply.id} 
                            postId={reply.id} 
                            currentUser={user} 
                            onDelete={handleDeletePost} 
                            onAddCoin={handleAddCoin} 
                            onShare={handleShare} 
                            isPending={isPending}
                            onComment={() => toggleCommentBox(reply.id)}
                            isCommentBoxOpen={activeCommentBox === reply.id}
                            commentContent={activeCommentBox === reply.id ? commentContent : ''}
                            onCommentContentChange={(text) => activeCommentBox === reply.id && setCommentContent(text)}
                            onCommentSubmit={() => handleCommentSubmit(reply.id)}
                            allComments={reply.comments}
                        />
                    ))}
                  </div>
              </TabsContent>
              <TabsContent value="leaderboard" className="p-4 bg-muted/20">
                <ChallengeLeaderboard replies={leaderboardEntries} challengeEnded={challengeHasEnded}/>
              </TabsContent>
            </Tabs>
          </CardContent>
        )}
      </Card>
    );
  }

  const regularPosts = posts.filter(p => !p.isChallengeReply && p.type !== 'challenge');
  const challengePosts = posts.filter(p => p.type === 'challenge');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete your post.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDelete} disabled={isPending}>
              {isPending ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <header>
        <h1 className="text-3xl font-bold tracking-tight">Social Feed</h1>
        <p className="text-muted-foreground">Connect with the community, share your thoughts, and take on challenges.</p>
      </header>

      <Card>
        <CardContent className="flex gap-4 p-4">
          <Avatar><AvatarImage src={user?.photoURL ?? undefined} alt="Your avatar" /><AvatarFallback>{user?.displayName?.charAt(0) ?? 'U'}</AvatarFallback></Avatar>
          <div className="w-full space-y-2">
            <Textarea placeholder={isChallenge ? "Describe your challenge..." : "What's on your mind?"} value={content} onChange={(e) => setContent(e.target.value)} disabled={isPending || !user}/>
            {imagePreview && (<div className="relative"><Image src={imagePreview} alt="Image preview" width={500} height={300} className="rounded-lg object-contain max-h-80 w-auto" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => clearMedia(true, false)} disabled={isPending}><X className="h-4 w-4" /></Button></div>)}
            {videoPreview && (<div className="relative"><video src={videoPreview} controls className="rounded-lg max-h-80 w-auto" /><Button variant="destructive" size="icon" className="absolute top-2 right-2 h-6 w-6" onClick={() => clearMedia(false, true)} disabled={isPending}><X className="h-4 w-4" /></Button></div>)}
            
            {isChallenge && (
              <div className='pt-2'>
                <Label htmlFor='duration-select'>Challenge Duration</Label>
                <Select value={challengeDuration} onValueChange={setChallengeDuration} disabled={isPending || !user}>
                  <SelectTrigger id='duration-select' className="w-48">
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent position="popper" className="max-h-60">
                    {Array.from({ length: 24 }, (_, i) => i + 1).map(hour => (
                      <SelectItem key={hour} value={String(hour)}>{hour} {hour > 1 ? 'hours' : 'hour'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
            
            <div className="flex justify-between items-center gap-2 pt-2">
              <div className="flex items-center space-x-2">
                <Switch id="challenge-mode" checked={isChallenge} onCheckedChange={setIsChallenge} disabled={isPending || !user}/><Label htmlFor="challenge-mode" className={cn(isChallenge && "text-amber-500 font-semibold")}>Challenge</Label>
              </div>
              <div className='flex items-center gap-2'>
                <input type="file" ref={imageInputRef} onChange={handleImageSelect} accept="image/*" className="hidden" disabled={isPending}/>
                <input type="file" ref={videoInputRef} onChange={handleVideoSelect} accept="video/*" className="hidden" disabled={isPending}/>
                <Button variant="outline" size="icon" onClick={() => imageInputRef.current?.click()} disabled={isPending || !user || !!videoFile}><ImageIcon className="h-5 w-5" /></Button>
                <Button variant="outline" size="icon" onClick={() => videoInputRef.current?.click()} disabled={isPending || !user || !!imageFile}><Video className="h-5 w-5" /></Button>
                <Button onClick={handlePost} disabled={isPending || (!content.trim() && !imageFile && !videoFile) || !user}>{isPending ? <Loader2 className="animate-spin"/> : (isChallenge ? 'Post Challenge' : 'Post')}</Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2"><TabsTrigger value="posts">Posts</TabsTrigger><TabsTrigger value="challenges">Challenges</TabsTrigger></TabsList>
        <TabsContent value="posts" className="space-y-4 mt-4">
          {loading ? (Array.from({ length: 3 }).map((_, index) => (<Card key={index}><CardHeader><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /><Skeleton className="h-3 w-[100px]" /></div></div></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /></div></CardContent><CardFooter className="flex justify-between border-t p-2"><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /><Skeleton className="h-8 w-24" /></CardFooter></Card>))) : (regularPosts.length > 0 ? (regularPosts.map(renderPostCard)) : (<Card className="flex flex-col items-center justify-center p-8 text-center"><CardHeader><CornerRightDown className="h-12 w-12 text-muted-foreground mx-auto" /></CardHeader><CardContent><h3 className="text-lg font-semibold">No posts yet</h3><p className="text-muted-foreground">Be the first to share something with the community!</p></CardContent></Card>))}
        </TabsContent>
        <TabsContent value="challenges" className="space-y-4 mt-4">
          {loading ? (Array.from({ length: 2 }).map((_, index) => (<Card key={index}><CardHeader><div className="flex items-center gap-3"><Skeleton className="h-10 w-10 rounded-full" /><div className="space-y-2"><Skeleton className="h-4 w-[150px]" /><Skeleton className="h-3 w-[100px]" /></div></div></CardHeader><CardContent><div className="space-y-2"><Skeleton className="h-4 w-full" /></div></CardContent></Card>))) : (challengePosts.length > 0 ? (challengePosts.map(renderPostCard)) : (<Card className="flex flex-col items-center justify-center p-8 text-center"><CardHeader><Trophy className="h-12 w-12 text-muted-foreground mx-auto" /></CardHeader><CardContent><h3 className="text-lg font-semibold">No challenges yet</h3><p className="text-muted-foreground">Be the first to post a challenge for the community!</p></CardContent></Card>))}
        </TabsContent>
      </Tabs>
    </div>
  );
}

