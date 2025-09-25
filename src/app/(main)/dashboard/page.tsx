
'use client';

import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from '@/components/ui/card';
import { NAV_LINKS } from '@/lib/placeholder-data';
import Link from 'next/link';
import { useAuth } from '@/components/providers/auth-provider';
import { useEffect, useState } from 'react';
import { doc, onSnapshot, collection, query, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Award, Coins, Users, Trophy } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

type UserStats = {
  coins: number;
  followers: number;
  rank: number | null;
};

export default function DashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  const featureLinks = NAV_LINKS.filter(
    (link) =>
      link.href !== '/dashboard' &&
      link.href !== '/profile' &&
      link.href !== '/users/all'
  );

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }

    let unsubscribeUser: () => void;
    let unsubscribePosts: () => void;

    const fetchStats = async () => {
      // Get coins and followers from user doc
      const userRef = doc(db, 'users', user.uid);
      unsubscribeUser = onSnapshot(userRef, (docSnap) => {
        if (docSnap.exists()) {
          const userData = docSnap.data();
          setStats((prev) => ({
            ...prev,
            coins: userData.coins || 0,
            followers: userData.following?.length || 0,
            rank: prev?.rank ?? null,
          }));
        }
      });

      // Calculate rank from all posts
      const postsQuery = query(collection(db, 'posts'));
      const calculateRank = async () => {
         const postsSnapshot = await getDocs(postsQuery);
         const userCoinCounts: Record<string, number> = {};

         postsSnapshot.forEach((doc) => {
            const post = doc.data();
            const authorId = post.authorId;
            if (authorId) {
                if (!userCoinCounts[authorId]) {
                    userCoinCounts[authorId] = 0;
                }
                userCoinCounts[authorId] += post.coins?.length || 0;
            }
        });

        const leaderboard = Object.entries(userCoinCounts)
            .sort(([, a], [, b]) => b - a)
            .map(([id]) => id);
        
        const rank = leaderboard.indexOf(user.uid) + 1;
        setStats(prev => ({...prev, rank: rank > 0 ? rank : null, coins: prev?.coins ?? 0, followers: prev?.followers ?? 0}));
        setLoading(false);
      }
      
      await calculateRank();
      unsubscribePosts = onSnapshot(postsQuery, calculateRank);
    };

    fetchStats();

    return () => {
      if (unsubscribeUser) unsubscribeUser();
      if (unsubscribePosts) unsubscribePosts();
    };
  }, [user]);

  const statCards = [
    {
      title: 'Total Coins',
      value: stats?.coins,
      icon: Coins,
      color: 'text-amber-500',
    },
    {
      title: 'Leaderboard Rank',
      value: stats?.rank ? `#${stats.rank}` : 'N/A',
      icon: Award,
      color: 'text-red-500',
    },
    {
      title: 'Following',
      value: stats?.followers,
      icon: Users,
      color: 'text-blue-500',
    },
  ];

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back, {user?.displayName?.split(' ')[0] || 'User'}!
        </h1>
        <p className="text-muted-foreground">
          Here's a snapshot of your journey on Dallenge.
        </p>
      </div>
      
      <div className="grid gap-6 md:grid-cols-3">
        {statCards.map(card => (
            <Card key={card.title}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                    <card.icon className={`h-5 w-5 ${card.color}`} />
                </CardHeader>
                <CardContent>
                    {loading ? (
                       <Skeleton className="h-8 w-20" />
                    ) : (
                      <div className="text-2xl font-bold">{card.value?.toLocaleString() ?? 0}</div>
                    )}
                </CardContent>
            </Card>
        ))}
      </div>

      <div>
        <h2 className="text-2xl font-bold tracking-tight">Explore Features</h2>
        <p className="text-muted-foreground">
            Dive into the core experiences of Dallenge.
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {featureLinks.map((feature) => (
          <Link href={feature.href} key={feature.href}>
            <Card className="group h-full transition-all duration-300 hover:border-primary hover:shadow-lg hover:-translate-y-1">
              <CardContent className="flex flex-col items-center justify-center p-6 text-center">
                  <div className="mb-4 rounded-full bg-primary/10 p-3 ring-2 ring-primary/20 transition-all group-hover:scale-110 group-hover:bg-primary/20">
                    <feature.icon className="h-8 w-8 text-primary" />
                  </div>
                  <CardTitle className="text-lg mb-1 group-hover:text-primary">
                    {feature.label}
                  </CardTitle>
                  <CardDescription className="text-xs">{feature.description}</CardDescription>
              </CardContent>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
