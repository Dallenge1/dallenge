
'use client';

import { useState, useTransition } from 'react';
import { useAuth } from '@/components/providers/auth-provider';
import { useToast } from '@/hooks/use-toast';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { STORE_ITEMS, StoreItem } from '@/lib/store-items';
import { CheckCircle, Coins, Loader2, Star } from 'lucide-react';
import { purchaseItem } from '@/app/store-actions';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useEffect } from 'react';

export default function StorePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isPending, startTransition] = useTransition();
  const [inventory, setInventory] = useState<string[]>([]);
  const [userCoins, setUserCoins] = useState(0);

  useEffect(() => {
    if (!user) return;
    const userRef = doc(db, 'users', user.uid);
    const unsubscribe = onSnapshot(userRef, (docSnap) => {
      if (docSnap.exists()) {
        const userData = docSnap.data();
        setInventory(userData.inventory || []);
        setUserCoins(userData.coins || 0);
      }
    });
    return () => unsubscribe();
  }, [user]);

  const handlePurchase = (item: StoreItem) => {
    if (!user) {
      toast({ variant: 'destructive', title: 'You must be logged in to purchase items.' });
      return;
    }
    if (userCoins < item.price) {
        toast({ variant: 'destructive', title: 'Not enough coins!', description: `You need ${item.price} coins to purchase this item.`});
        return;
    }

    startTransition(async () => {
      try {
        await purchaseItem(user.uid, item.id);
        toast({
          title: 'Purchase Successful!',
          description: `You've successfully purchased the ${item.name}.`,
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Purchase Failed',
          description: error instanceof Error ? error.message : 'An unknown error occurred.',
        });
      }
    });
  };

  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Store</h1>
        <p className="text-muted-foreground">
          Use your coins to purchase exclusive cosmetic items.
        </p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {STORE_ITEMS.map((item) => {
          const hasItem = inventory.includes(item.id);
          const canAfford = userCoins >= item.price;

          return (
            <Card key={item.id}>
              <CardHeader>
                <div className='flex justify-center items-center bg-muted rounded-md h-40'>
                    <Star className="h-20 w-20 text-primary" />
                </div>
              </CardHeader>
              <CardContent className="text-center">
                <CardTitle>{item.name}</CardTitle>
                <CardDescription>{item.description}</CardDescription>
              </CardContent>
              <CardFooter className="flex flex-col gap-2">
                <div className="flex items-center gap-2 text-lg font-bold text-primary">
                    <Coins className="h-5 w-5" />
                    <span>{item.price.toLocaleString()}</span>
                </div>
                <Button
                  onClick={() => handlePurchase(item)}
                  disabled={isPending || hasItem || !canAfford}
                  className="w-full"
                >
                  {isPending ? <Loader2 className="animate-spin" /> : hasItem ? <><CheckCircle className='mr-2'/> Owned</> : 'Purchase'}
                </Button>
                {!hasItem && !canAfford && <p className='text-xs text-destructive'>You don't have enough coins.</p>}
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
