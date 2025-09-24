
'use client';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Coins } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useEffect, useState, useMemo } from 'react';
import { collection, onSnapshot, query } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type Post = {
    id: string;
    authorId: string;
    authorName: string;
    authorAvatarUrl: string;
    coins?: string[];
};

type UserRank = {
  id: string;
  name: string;
  avatarUrl: string;
  totalCoins: number;
};

export default function LeaderboardPage() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'posts'));
    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const postsData: Post[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            authorId: data.authorId,
            authorName: data.authorName,
            authorAvatarUrl: data.authorAvatarUrl,
            coins: data.coins || [],
          };
        });
        setPosts(postsData);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching posts data: ', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Could not load leaderboard data.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  const leaderboard = useMemo(() => {
    if (loading) return [];

    const userCoinTotals = new Map<string, UserRank>();

    posts.forEach(post => {
        if (!post.authorId) return;

        // Initialize user if not already in the map
        if (!userCoinTotals.has(post.authorId)) {
            userCoinTotals.set(post.authorId, {
                id: post.authorId,
                name: post.authorName,
                avatarUrl: post.authorAvatarUrl,
                totalCoins: 0,
            });
        }

        const user = userCoinTotals.get(post.authorId)!;
        
        // Update user info in case it changed on a newer post
        user.name = post.authorName;
        user.avatarUrl = post.authorAvatarUrl;

        // Add the coins from the current post to the user's total
        user.totalCoins += post.coins?.length || 0;
    });

    const sortedLeaderboard = Array.from(userCoinTotals.values())
        .sort((a, b) => b.totalCoins - a.totalCoins)
        .filter(user => user.totalCoins > 0); // Only show users who have earned coins

    return sortedLeaderboard;
  }, [posts, loading]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          See who's at the top of the game based on coins earned from posts and challenges.
        </p>
      </header>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">
                <div className="flex items-center justify-end gap-2">
                  <Coins className="h-4 w-4 text-amber-500" />
                  <span>Total Coins Earned</span>
                </div>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              Array.from({ length: 5 }).map((_, index) => (
                <TableRow key={index}>
                  <TableCell>
                    <Skeleton className="h-8 w-8 rounded-full mx-auto" />
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <Skeleton className="h-5 w-32" />
                    </div>
                  </TableCell>
                  <TableCell>
                    <Skeleton className="h-5 w-16 ml-auto" />
                  </TableCell>
                </TableRow>
              ))
            ) : (
              leaderboard.map((player, index) => {
                const rank = index + 1;
                return (
                  <TableRow key={player.id}>
                    <TableCell className="text-center font-bold">
                      <div className="flex justify-center">
                        {rank <= 3 ? (
                          <Badge
                            variant="default"
                            className={cn(
                              'flex h-8 w-8 items-center justify-center rounded-full p-0 text-base',
                              {
                                'bg-red-600 text-white hover:bg-red-600/90': rank === 1,
                                'bg-slate-300 text-slate-800 hover:bg-slate-300/90': rank === 2,
                                'bg-orange-400 text-orange-900 hover:bg-orange-400/90': rank === 3,
                              }
                            )}
                          >
                            {rank}
                          </Badge>
                        ) : (
                          rank
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Link href={`/users/${player.id}`} className="flex items-center gap-3 group">
                          <Avatar>
                            <AvatarImage
                              src={player.avatarUrl}
                              alt={player.name}
                            />
                            <AvatarFallback>
                              {player.name ? player.name.charAt(0) : 'U'}
                            </AvatarFallback>
                          </Avatar>
                        <span className="font-medium group-hover:underline">{player.name || 'Anonymous User'}</span>
                      </Link>
                    </TableCell>
                    <TableCell className="text-right font-mono">
                      {player.totalCoins.toLocaleString()}
                    </TableCell>
                  </TableRow>
                );
              })
            )}
          </TableBody>
        </Table>
        {!loading && leaderboard.length === 0 && (
            <div className='text-center p-8 text-muted-foreground'>
                No one has earned any coins yet.
            </div>
        )}
      </div>
    </div>
  );
}
