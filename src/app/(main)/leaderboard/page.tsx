
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
import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Skeleton } from '@/components/ui/skeleton';
import Link from 'next/link';

type UserRank = {
  id: string;
  name: string;
  avatarUrl: string;
  totalCoins: number;
};

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState<UserRank[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const calculateLeaderboard = async () => {
        setLoading(true);
        try {
            const postsQuery = query(collection(db, 'posts'));
            const postsSnapshot = await getDocs(postsQuery);
            
            const userCoinCounts: Record<string, { name: string; avatarUrl: string; totalCoins: number }> = {};
            const userSet = new Set<string>();

            postsSnapshot.forEach((doc) => {
                const post = doc.data();
                const authorId = post.authorId;

                if (!authorId) return;

                if (!userSet.has(authorId)) {
                   userCoinCounts[authorId] = {
                        name: post.authorName,
                        avatarUrl: post.authorAvatarUrl,
                        totalCoins: 0,
                    };
                    userSet.add(authorId);
                }
                
                if (userCoinCounts[authorId]) {
                    userCoinCounts[authorId].totalCoins += post.coins?.length || 0;
                }
            });

            const usersData: UserRank[] = Object.entries(userCoinCounts).map(([id, data]) => ({
                id,
                ...data,
            })).filter(user => user.totalCoins > 0);

            usersData.sort((a, b) => b.totalCoins - a.totalCoins);

            setLeaderboard(usersData);
            setLoading(false);

        } catch (error) {
             console.error('Error calculating leaderboard: ', error);
            toast({
                variant: 'destructive',
                title: 'Error',
                description: 'Could not load leaderboard data.',
            });
            setLoading(false);
        }
    };
    
    calculateLeaderboard();
    
    // Set up a listener to recalculate when posts change
    const unsubscribe = onSnapshot(collection(db, 'posts'), (snapshot) => {
        calculateLeaderboard();
    });

    return () => unsubscribe();
  }, [toast]);

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
                  <span>Total Coins Earned From Posts</span>
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
                No one has earned any coins from posts yet.
            </div>
        )}
      </div>
    </div>
  );
}
