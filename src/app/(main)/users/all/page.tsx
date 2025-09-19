
'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { collection, query, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useToast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

type User = {
  id: string;
  name: string;
  avatarUrl: string;
};

export default function AllUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const q = query(collection(db, 'posts'), orderBy('timestamp', 'desc'));

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const uniqueUsers = new Map<string, User>();
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.authorId && !uniqueUsers.has(data.authorId)) {
            uniqueUsers.set(data.authorId, {
              id: data.authorId,
              name: data.authorName,
              avatarUrl: data.authorAvatarUrl,
            });
          }
        });
        setUsers(Array.from(uniqueUsers.values()));
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching users:', error);
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'Failed to load users. Please try again.',
        });
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [toast]);

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">All Users</h1>
        <p className="text-muted-foreground">
          Browse all the active users in the community.
        </p>
      </header>

      {loading ? (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {Array.from({ length: 12 }).map((_, index) => (
            <div key={index} className="flex flex-col items-center gap-2">
              <Skeleton className="h-24 w-24 rounded-full" />
              <Skeleton className="h-5 w-32" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-6 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
          {users.map((user) => (
            <Link href={`/users/${user.id}`} key={user.id} className="group">
              <Card className="transform transition-transform duration-300 hover:-translate-y-1 hover:shadow-lg">
                <CardContent className="flex flex-col items-center gap-4 p-6">
                  <Avatar className="h-24 w-24 border-2 border-transparent group-hover:border-primary">
                    <AvatarImage src={user.avatarUrl} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <p className="text-center font-semibold text-sm">{user.name}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
       {!loading && users.length === 0 && (
          <div className="text-center py-10">
              <p className="text-muted-foreground">No users have posted anything yet.</p>
          </div>
      )}
    </div>
  );
}
