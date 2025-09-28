
'use client';

import { WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function OfflinePage() {
  const handleRetry = () => {
    window.location.reload();
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-background text-center p-4">
      <WifiOff className="h-24 w-24 text-destructive mb-6" />
      <h1 className="text-3xl font-bold mb-2">You're Offline</h1>
      <p className="text-muted-foreground mb-6 max-w-md">
        It seems you've lost your internet connection. Please check your network settings and try again.
      </p>
      <Button onClick={handleRetry}>
        Retry Connection
      </Button>
    </div>
  );
}
