
'use client';

import { useEffect, useState, useTransition } from 'react';
import {
  collection,
  query,
  onSnapshot,
  orderBy,
  limit,
  Timestamp,
} from 'firebase/firestore';
import { useAuth } from '@/components/providers/auth-provider';
import { db } from '@/lib/firebase';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatDistanceToNow } from 'date-fns';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { markActivityAsRead } from '@/app/actions';
import { Coins, Heart, MessageCircle, UserPlus, Trophy } from 'lucide-react';

type Activity = {
  id: string;
  type: 'COIN_RECEIVED' | 'NEW_FOLLOWER' | 'NEW_COMMENT' | 'LIKE' | 'CHALLENGE_REPLY' | 'COMMENT_LIKE' | 'CHALLENGE_INVITE';
  fromUserId: string;
  fromUserName: string;
  fromUserAvatarUrl: string;
  postId?: string;
  postTitle?: string;
  commentContent?: string;
  replyId?: string;
  timestamp: Timestamp;
  isRead: boolean;
};

const ActivityIcon = ({ type }: { type: Activity['type'] }) => {
    switch (type) {
        case 'COIN_RECEIVED':
            return <Coins className="h-4 w-4 text-amber-500" />;
        case 'NEW_FOLLOWER':
            return <UserPlus className="h-4 w-4 text-blue-500" />;
        case 'NEW_COMMENT':
        case 'CHALLENGE_REPLY':
            return <MessageCircle className="h-4 w-4 text-green-500" />;
        case 'LIKE':
        case 'COMMENT_LIKE':
            return <Heart className="h-4 w-4 text-red-500" />;
        case 'CHALLENGE_INVITE':
            return <Trophy className="h-4 w-4 text-primary" />;
        default:
            return null;
    }
};

const ActivityItem = ({ activity, onRead }: { activity: Activity; onRead: (activityId: string) => void }) => {
    const linkHref = activity.postId ? `/feed#${activity.postId}` : `/users/${activity.fromUserId}`;

    const renderText = () => {
        switch (activity.type) {
            case 'COIN_RECEIVED':
                return <>gave you a coin on <strong>{activity.postTitle || 'your post'}</strong></>;
            case 'NEW_FOLLOWER':
                return <>started following you.</>;
            case 'NEW_COMMENT':
                return <>commented on <strong>{activity.postTitle || 'your post'}</strong>: <em>"{activity.commentContent}"</em></>;
            case 'CHALLENGE_REPLY':
                 return <>replied to your challenge: <strong>{activity.postTitle}</strong></>;
            case 'LIKE':
                return <>liked your post: <strong>{activity.postTitle}</strong></>;
            case 'COMMENT_LIKE':
                return <>liked your comment: <em>"{activity.commentContent}"</em></>
            case 'CHALLENGE_INVITE':
                return <>invited you to the challenge: <strong>{activity.postTitle}</strong></>;
            default:
                return null;
        }
    }

    return (
        <Link href={linkHref} onClick={() => onRead(activity.id)} className="block p-3 -mx-3 rounded-lg hover:bg-muted/50 transition-colors">
            <div className="flex items-start gap-3">
                 <div className="relative">
                    <Avatar className="h-9 w-9">
                        <AvatarImage src={activity.fromUserAvatarUrl} alt={activity.fromUserName} />
                        <AvatarFallback>{activity.fromUserName.charAt(0)}</AvatarFallback>
                    </Avatar>
                    <div className="absolute -bottom-1 -right-1 bg-background p-0.5 rounded-full">
                        <ActivityIcon type={activity.type} />
                    </div>
                </div>
                <div className="flex-1 text-sm space-y-1">
                    <p className="text-muted-foreground">
                        <strong className="text-foreground">{activity.fromUserName}</strong> {renderText()}
                    </p>
                    <p className="text-xs text-muted-foreground/80">
                        {formatDistanceToNow(activity.timestamp.toDate(), { addSuffix: true })}
                    </p>
                </div>
                {!activity.isRead && <div className="h-2 w-2 rounded-full bg-primary mt-1" title="Unread"></div>}
            </div>
        </Link>
    );
};


export default function RecentActivity() {
  const { user } = useAuth();
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    const activityQuery = query(
      collection(db, 'users', user.uid, 'activity'),
      orderBy('timestamp', 'desc'),
      limit(15)
    );

    const unsubscribe = onSnapshot(activityQuery, (snapshot) => {
      const activitiesData: Activity[] = [];
      snapshot.forEach((doc) => {
        activitiesData.push({ id: doc.id, ...doc.data() } as Activity);
      });
      setActivities(activitiesData);
      setLoading(false);
    }, (error) => {
      console.error("Error fetching activities:", error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const handleMarkAsRead = (activityId: string) => {
    if (!user) return;
    const activity = activities.find(a => a.id === activityId);
    if(activity && !activity.isRead) {
        startTransition(() => {
            markActivityAsRead(user.uid, activityId);
        });
    }
  };

  return (
    <Card className="h-full">
        <CardHeader>
            <CardTitle>Your Journey</CardTitle>
            <CardDescription>Recent activity from the community.</CardDescription>
        </CardHeader>
        <CardContent>
            {loading ? (
                <div className="space-y-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3">
                            <Skeleton className="h-9 w-9 rounded-full" />
                            <div className="flex-1 space-y-2">
                                <Skeleton className="h-3 w-4/5" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : activities.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-4">
                    No recent activity yet.
                </p>
            ) : (
                <div className="space-y-2">
                    {activities.map((activity) => (
                        <ActivityItem key={activity.id} activity={activity} onRead={handleMarkAsRead} />
                    ))}
                </div>
            )}
        </CardContent>
    </Card>
  );
}

    
