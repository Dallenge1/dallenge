
'use client';

import { useEffect, useState, useTransition } from 'react';
import { useParams, useRouter } from 'next/navigation';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
  Timestamp,
  doc,
  getDoc,
  limit,
  getDocs,
} from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent, CardFooter, CardHeader } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow, format } from 'date-fns';
import { Heart, MessageCircle, Share2, Coins, Trophy, CalendarIcon, Upload, Loader2, Video, User, Lock, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/components/providers/auth-provider';
import { likePost, addCoin } from '@/app/actions';
import { useToast } from '@/hooks/use-toast';
import Link from 'next/link';
import { getOrCreateChat } from '@/app/chat-actions';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { CardDescription, CardTitle } from '@/components/ui/card';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import React from 'react';
import { Area } from 'react-easy-crop';
import ImageCropDialog from '@/app/(main)/profile/image-crop-dialog';
import { getCroppedImg } from '@/app/(main)/profile/crop-image';
import Image from 'next/image';
import EditProfileModal from './edit-profile-modal';
import ChangePasswordModal from './change-password-modal';
import DangerZoneModal from './danger-zone-modal';


type UserData = {
  displayName: string;
  photoURL: string;
  email?: string;
  creationTime?: string;
  bio?: string;
  dob?: Date;
  phone?: string;
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
  type: 'post' | 'challenge';
  title?: string;
  isChallengeReply?: boolean;
  coins?: string[];
  imageUrl?: string;
  videoUrl?: string;
};

const profileFormSchema = z.object({
  displayName: z.string().min(1, 'Display name is required.'),
  phone: z.string().optional(),
  dob: z.date().optional(),
  bio: z.string().max(200, "Bio can't be longer than 200 characters.").optional(),
});

export type ProfileFormValues = z.infer<typeof profileFormSchema>;


export default function UserProfilePage() {
  const params = useParams();
  const userId = params.userId as string;
  const router = useRouter();

  const { user: currentUser, updateUserPhoto, updateUserProfile, loading: authLoading } = useAuth();
  const { toast } = useToast();

  const [user, setUser] = useState<UserData | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  const isCurrentUserProfile = currentUser?.uid === userId;
  
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const [modalOpen, setModalOpen] = useState< 'edit' | 'password' | 'danger' | null>(null);
  
  const form = useForm<ProfileFormValues>({
    resolver: zodResolver(profileFormSchema),
  });

  useEffect(() => {
    if (user) {
        form.reset({
            displayName: user.displayName ?? '',
            phone: user.phone ?? '', 
            bio: user.bio ?? 'Lover of technology, wellness, and continuous learning. Excited to be on the Dallenge platform!',
            dob: user.dob ? new Date(user.dob) : (user.creationTime ? new Date(user.creationTime) : undefined),
        });
    }
  }, [user, form]);
  
  const { watch } = form;
  const bioValue = watch('bio');
  const dobValue = watch('dob');

  useEffect(() => {
    if (!userId) return;

    // Fetch user data from 'users' collection
    const userRef = doc(db, 'users', userId);
    const unsubscribeUser = onSnapshot(userRef, async (docSnap) => {
        if (docSnap.exists()) {
            const userData = docSnap.data();
            setUser({
                displayName: userData.displayName,
                photoURL: userData.photoURL,
                email: userData.email,
                creationTime: userData.creationTime,
                bio: userData.bio,
                dob: userData.dob?.toDate(),
                phone: userData.phone,
            });
            setLoading(false);
        } else {
            // Fallback: If user not in 'users', get info from their latest post
            const postsQuery = query(
                collection(db, 'posts'),
                where('authorId', '==', userId),
                orderBy('timestamp', 'desc'),
                limit(1)
            );
            const postsSnapshot = await getDocs(postsQuery);
            if (!postsSnapshot.empty) {
                const postData = postsSnapshot.docs[0].data();
                setUser({
                    displayName: postData.authorName,
                    photoURL: postData.authorAvatarUrl,
                });
            }
            setLoading(false);
        }
    }, (error) => {
        console.error("Error fetching user data:", error);
        toast({
            variant: 'destructive',
            title: 'Error',
            description: 'Failed to load user profile.',
        });
        setLoading(false);
    });

    const q = query(
      collection(db, 'posts'),
      where('authorId', '==', userId),
      orderBy('timestamp', 'desc')
    );

    const unsubscribePosts = onSnapshot(q, (querySnapshot) => {
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
          type: data.type || 'post',
          title: data.title,
          isChallengeReply: data.isChallengeReply || false,
          coins: data.coins || [],
          imageUrl: data.imageUrl,
          videoUrl: data.videoUrl,
        });
      });
      setPosts(postsData);
    });

    return () => {
        unsubscribeUser();
        unsubscribePosts();
    };
  }, [userId, toast]);
  
  const totalCoins = React.useMemo(() => {
    return posts.reduce((acc, post) => acc + (post.coins?.length || 0), 0);
  }, [posts]);

  const onProfileSubmit = (data: ProfileFormValues) => {
    startTransition(async () => {
      try {
        await updateUserProfile(data);
        toast({
          title: 'Profile Updated',
          description: 'Your personal information has been updated.',
        });
        setModalOpen(null);
      } catch (error) {
         toast({
          variant: 'destructive',
          title: 'Update Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };
  
  const handleAvatarClick = () => {
    if (!isCurrentUserProfile) return;
    fileInputRef.current?.click();
  };

  const onFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0];
      const reader = new FileReader();
      reader.addEventListener('load', () => {
        setImageSrc(reader.result as string);
      });
      reader.readAsDataURL(file);
    }
  };
  
  const onCloseCrop = () => {
    setImageSrc(null);
    if (fileInputRef.current) {
        fileInputRef.current.value = '';
    }
  };

  const onCroppedAreaChange = (croppedArea: Area, croppedAreaPixels: Area) => {
    setCroppedAreaPixels(croppedAreaPixels);
  };

  const handleSaveCrop = async () => {
    if (!imageSrc || !croppedAreaPixels) return;

    setIsUploading(true);
    try {
        const croppedImageBlob = await getCroppedImg(imageSrc, croppedAreaPixels);
        await updateUserPhoto(croppedImageBlob);
        toast({
            title: 'Success',
            description: 'Profile picture updated successfully!',
        });
    } catch (error) {
        toast({
            variant: 'destructive',
            title: 'Upload Failed',
            description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
    } finally {
        setIsUploading(false);
        onCloseCrop();
    }
  };

  const isMutationPending = isPending || authLoading || isUploading;

  const handleLike = (postId: string) => {
    if (!currentUser) return;
    likePost(postId, currentUser.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to like post.'}));
  };
  
  const handleAddCoin = (postId: string) => {
    if (!currentUser) return;
    addCoin(postId, currentUser.uid).catch(() => toast({ variant: 'destructive', title: 'Error', description: 'Failed to add coin.' }));
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
            <p className="text-muted-foreground">This user may not exist.</p>
            <Button asChild variant="link" className="mt-4">
                <Link href="/feed">Return to Feed</Link>
            </Button>
        </div>
    );
  }
  
  const handleMessage = () => {
    if (!currentUser) return;
    startTransition(async () => {
        try {
            const chatId = await getOrCreateChat(currentUser.uid, userId);
            router.push(`/chat/${chatId}`);
        } catch (error) {
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not start chat. Please try again.',
            });
        }
    });
  };

  const renderPostCard = (post: Post) => {
    const hasLiked = currentUser ? post.likes.includes(currentUser.uid) : false;
    const hasGivenCoin = currentUser ? post.coins?.includes(currentUser.uid) : false;

    return (
      <Card key={post.id} id={post.id} className="w-full">
        <CardHeader>
           <div className="flex items-center justify-between">
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
             {post.type === 'challenge' && !post.isChallengeReply && (<div className="flex items-center gap-2 text-sm font-semibold text-amber-500"><Trophy className="h-5 w-5" /><span>Challenge</span></div>)}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.title && <h3 className="font-bold">{post.title}</h3>}
          <p className="text-sm whitespace-pre-wrap">{post.content}</p>
          {post.imageUrl && (<div className="relative mt-2 aspect-video overflow-hidden rounded-lg border"><Image src={post.imageUrl} alt="Post image" fill className="object-cover" /></div>)}
          {post.videoUrl && (<div className="relative mt-2 aspect-video overflow-hidden rounded-lg border"><video src={post.videoUrl} controls className="w-full h-full object-cover" /></div>)}
        </CardContent>
        <CardFooter className="flex justify-between border-t p-2">
           {post.type === 'challenge' || post.isChallengeReply ? (
            <Button variant="ghost" className="flex-1" onClick={() => handleAddCoin(post.id)} disabled={isPending || !currentUser}>
              <Coins className={cn('mr-2 h-4 w-4', hasGivenCoin && 'text-yellow-400')} />
              Coin ({post.coins?.length ?? 0})
            </Button>
           ) : (
            <Button variant="ghost" className="flex-1" onClick={() => handleLike(post.id)} disabled={!currentUser}>
              <Heart className={cn('mr-2 h-4 w-4', hasLiked && 'fill-red-500 text-red-500')} />
              Like ({post.likes.length})
            </Button>
           )}
          <Button variant="ghost" className="flex-1" disabled>
            <MessageCircle className="mr-2 h-4 w-4" /> Comment ({post.comments.length})
          </Button>
          <Button variant="ghost" className="flex-1" onClick={() => handleShare(post.id)}>
            <Share2 className="mr-2 h-4 w-4" /> Share
          </Button>
        </CardFooter>
      </Card>
    );
  };

  const regularPosts = posts.filter(p => p.type === 'post' && !p.isChallengeReply);
  const myChallenges = posts.filter(p => p.type === 'challenge' && !p.isChallengeReply);
  const acceptedChallenges = posts.filter(p => p.isChallengeReply);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
        {imageSrc && (
            <ImageCropDialog
            imageSrc={imageSrc}
            crop={crop}
            zoom={zoom}
            setCrop={setCrop}
            setZoom={setZoom}
            onCroppedAreaChange={onCroppedAreaChange}
            onClose={onCloseCrop}
            onSave={handleSaveCrop}
            isLoading={isUploading}
            />
        )}
      <header className="flex items-start gap-4">
        <div className={cn("relative group", isCurrentUserProfile && "cursor-pointer")} onClick={handleAvatarClick}>
            <Avatar className="h-24 w-24 border-2">
                <AvatarImage src={user.photoURL} alt={user.displayName} />
                <AvatarFallback className="text-3xl">{user.displayName?.charAt(0)}</AvatarFallback>
            </Avatar>
             {isCurrentUserProfile && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                     {isMutationPending ? (
                        <Loader2 className="h-8 w-8 text-white animate-spin" />
                        ) : (
                        <Upload className="h-8 w-8 text-white" />
                        )}
                </div>
            )}
             <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                className="hidden"
                accept="image/png, image/jpeg"
                disabled={isMutationPending}
            />
        </div>
        <div className="flex-1">
            <div className='flex items-center gap-4'>
                <h1 className="text-3xl font-bold tracking-tight">{user.displayName}</h1>
                <div className="flex items-center gap-2 text-lg font-mono text-yellow-400">
                    <Coins className="h-6 w-6" />
                    <span className="font-semibold">{totalCoins.toLocaleString()}</span>
                </div>
            </div>
          <p className="text-muted-foreground">
             {isCurrentUserProfile ? user.email : `Viewing ${user.displayName}'s posts.`}
          </p>
           {bioValue && <p className="text-sm max-w-prose mt-2">{bioValue}</p>}
           {dobValue && <p className="text-sm text-muted-foreground">Born {format(dobValue, 'MMMM d, yyyy')}</p>}
        </div>
         {currentUser && !isCurrentUserProfile && (
            <Button onClick={handleMessage} disabled={isPending}>
                {isPending ? 'Starting chat...' : 'Message'}
            </Button>
        )}
      </header>
        
        {isCurrentUserProfile && (
             <>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    <Card onClick={() => setModalOpen('edit')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <User className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Edit Profile</CardTitle>
                                <CardDescription>Update your personal details.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card onClick={() => setModalOpen('password')} className="cursor-pointer hover:bg-muted/50 transition-colors">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <Lock className="w-8 h-8 text-primary" />
                            <div>
                                <CardTitle>Change Password</CardTitle>
                                <CardDescription>Update your security.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                    <Card onClick={() => setModalOpen('danger')} className="cursor-pointer hover:bg-destructive/10 transition-colors group">
                        <CardHeader className="flex flex-row items-center gap-4">
                            <ShieldAlert className="w-8 h-8 text-destructive" />
                            <div>
                                <CardTitle className="text-destructive group-hover:text-destructive">Danger Zone</CardTitle>
                                <CardDescription>Permanently delete account.</CardDescription>
                            </div>
                        </CardHeader>
                    </Card>
                </div>

                <EditProfileModal
                    isOpen={modalOpen === 'edit'}
                    onClose={() => setModalOpen(null)}
                    onSubmit={onProfileSubmit}
                    isPending={isMutationPending}
                    form={form}
                />
                <ChangePasswordModal
                    isOpen={modalOpen === 'password'}
                    onClose={() => setModalOpen(null)}
                />
                <DangerZoneModal
                    isOpen={modalOpen === 'danger'}
                    onClose={() => setModalOpen(null)}
                />
             </>
        )}


      {posts.length > 0 ? (
         <Tabs defaultValue="posts" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="posts">Posts ({regularPosts.length})</TabsTrigger>
              <TabsTrigger value="challenges">Challenges</TabsTrigger>
            </TabsList>
            <TabsContent value="posts" className="space-y-4 mt-4">
              {regularPosts.length > 0 ? (
                regularPosts.map(renderPostCard)
              ) : (
                <p className="text-muted-foreground text-center py-4">No posts yet.</p>
              )}
            </TabsContent>
            <TabsContent value="challenges" className="space-y-4 mt-4">
                 <Tabs defaultValue="my-challenges" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="my-challenges">My Challenges ({myChallenges.length})</TabsTrigger>
                        <TabsTrigger value="accepted-challenges">Accepted Challenges ({acceptedChallenges.length})</TabsTrigger>
                    </TabsList>
                    <TabsContent value="my-challenges" className="space-y-4 mt-4">
                        {myChallenges.length > 0 ? (
                            myChallenges.map(renderPostCard)
                        ) : (
                            <p className="text-muted-foreground text-center py-4">No challenges posted yet.</p>
                        )}
                    </TabsContent>
                    <TabsContent value="accepted-challenges" className="space-y-4 mt-4">
                        {acceptedChallenges.length > 0 ? (
                            acceptedChallenges.map(renderPostCard)
                        ) : (
                             <p className="text-muted-foreground text-center py-4">No accepted challenges yet.</p>
                        )}
                    </TabsContent>
                 </Tabs>
            </TabsContent>
          </Tabs>
      ) : (
          <div className="text-center py-10 border rounded-lg">
              <h3 className="text-lg font-semibold">No Posts Yet</h3>
              <p className="text-muted-foreground">{isCurrentUserProfile ? "You haven't posted anything yet. Head to the feed to get started!" : "This user hasn't posted anything yet."}</p>
               {isCurrentUserProfile && (
                    <Button asChild className="mt-4">
                        <Link href="/feed">Go to Feed</Link>
                    </Button>
               )}
          </div>
      )}
    </div>
  );
}
