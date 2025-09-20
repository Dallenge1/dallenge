
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import { Coins, Loader2, Trophy, Award, Download } from "lucide-react";
import Link from "next/link";
import { useMemo, useState, useTransition } from "react";
import { generateWinnerImage, GenerateWinnerImageInput } from "./leaderboard-actions";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import Image from "next/image";
import { useToast } from "@/hooks/use-toast";

type Post = {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatarUrl: string;
  coins?: string[];
  title?: string;
};

type ChallengeLeaderboardProps = {
  replies: Post[];
  challengeEnded: boolean;
};

export default function ChallengeLeaderboard({ replies, challengeEnded }: ChallengeLeaderboardProps) {
  const { toast } = useToast();
  const [isGenerating, setIsGenerating] = useState<string | null>(null);
  const [generatedImage, setGeneratedImage] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  const sortedReplies = useMemo(() => {
    return [...replies].sort((a, b) => (b.coins?.length || 0) - (a.coins?.length || 0));
  }, [replies]);

  const handleGenerateImage = async (input: GenerateWinnerImageInput) => {
    setIsGenerating(input.userName);
    try {
      const result = await generateWinnerImage(input);
      setGeneratedImage(result.imageUrl);
      setIsDialogOpen(true);
    } catch (error) {
      console.error("Image generation failed:", error);
      toast({
        variant: 'destructive',
        title: "Generation Failed",
        description: "Could not generate the winner's certificate. Please try again."
      });
    } finally {
      setIsGenerating(null);
    }
  };

  if (sortedReplies.length === 0) {
    return (
      <div className="text-center text-sm text-muted-foreground py-4">
        No replies yet. Be the first to reply to get on the leaderboard!
      </div>
    );
  }

  return (
    <>
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Challenge Complete!</DialogTitle>
            <DialogDescription>
              Congratulations! Here is your winner's certificate. You can save and share it.
            </DialogDescription>
          </DialogHeader>
          <div className="relative aspect-square w-full">
            {generatedImage ? (
                <Image src={generatedImage} alt="Winner's certificate" fill className="object-contain" />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <Loader2 className="h-8 w-8 animate-spin" />
                </div>
            )}
          </div>
           <DialogFooter>
            {generatedImage && (
              <a href={generatedImage} download={`dallenge-challenge-winner.png`}>
                <Button>
                  <Download className="mr-2 h-4 w-4" />
                  Download
                </Button>
              </a>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
      <div className="space-y-3">
          <CardHeader className="p-3 pb-0">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-5 w-5"/> Leaderboard</CardTitle>
              {challengeEnded && <Badge variant="secondary">Final</Badge>}
            </div>
          </CardHeader>
        <CardContent className="p-3">
        {sortedReplies.map((reply, index) => {
          const rank = index + 1;
          const isGeneratingThis = isGenerating === reply.authorName;

          return (
            <Card key={reply.id} className="p-3 mb-2 shadow-sm">
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
                 {challengeEnded && rank <= 3 && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={() => handleGenerateImage({
                          rank: rank,
                          userName: reply.authorName,
                          userAvatarUrl: reply.authorAvatarUrl,
                          challengeTitle: reply.title || 'Challenge'
                      })}
                      disabled={isGeneratingThis}
                      className="h-8"
                    >
                      {isGeneratingThis ? <Loader2 className="h-4 w-4 animate-spin"/> : <Award className="h-4 w-4" />}
                    </Button>
                 )}
              </div>
            </Card>
          );
        })}
        </CardContent>
      </div>
    </>
  );
}
