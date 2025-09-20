
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Coins } from "lucide-react";
import Link from "next/link";
import { useMemo } from "react";

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  coins?: string[];
};

type ChallengeLeaderboardProps = {
  replies: Post[];
};

export default function ChallengeLeaderboard({ replies }: ChallengeLeaderboardProps) {
  const sortedReplies = useMemo(() => {
    return [...replies].sort((a, b) => (b.coins?.length || 0) - (a.coins?.length || 0));
  }, [replies]);

  if (sortedReplies.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No replies yet. Be the first to reply to get on the leaderboard!
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {sortedReplies.map((reply, index) => {
        const rank = index + 1;
        return (
          <Card key={reply.id} className="p-3">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-8">
                 {rank <= 3 ? (
                  <Badge
                    variant="default"
                    className={cn(
                      'flex h-7 w-7 items-center justify-center rounded-full p-0 text-base',
                      {
                        'bg-yellow-400 text-yellow-900 hover:bg-yellow-400/90': rank === 1,
                        'bg-slate-300 text-slate-800 hover:bg-slate-300/90': rank === 2,
                        'bg-orange-400 text-orange-900 hover:bg-orange-400/90': rank === 3,
                      }
                    )}
                  >
                    {rank}
                  </Badge>
                ) : (
                  <span className="font-bold text-lg">{rank}</span>
                )}
              </div>
              <Link href={`/users/${reply.authorId}`}>
                <Avatar className="h-9 w-9">
                    <AvatarImage src={reply.authorAvatarUrl} alt={reply.authorName} />
                    <AvatarFallback>{reply.authorName.charAt(0)}</AvatarFallback>
                </Avatar>
              </Link>
              <div className="flex-1">
                <Link href={`/users/${reply.authorId}`}>
                    <p className="font-semibold text-sm hover:underline">{reply.authorName}</p>
                </Link>
              </div>
              <div className="flex items-center gap-1 font-mono text-sm text-amber-500">
                <Coins className="h-4 w-4" />
                <span>{reply.coins?.length ?? 0}</span>
              </div>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
