
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { formatDistanceToNow } from 'date-fns';
import { User } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import { Heart } from "lucide-react";
import { CommentData } from "./page";

type CommentProps = {
  comment: CommentData;
  currentUser: User | null;
  onLikeComment: () => void;
  isPending: boolean;
};

export default function Comment({ comment, currentUser, onLikeComment, isPending }: CommentProps) {
  const hasLiked = currentUser && comment.likes?.includes(currentUser.uid);

  return (
    <div className="flex items-start gap-3">
      <Avatar className="h-9 w-9">
        <AvatarImage src={comment.authorAvatarUrl} alt={comment.authorName} />
        <AvatarFallback>{comment.authorName.charAt(0)}</AvatarFallback>
      </Avatar>
      <div className="flex-1 space-y-1">
        <div className="flex items-center gap-2">
          <p className="font-semibold text-sm">{comment.authorName}</p>
          <p className="text-xs text-muted-foreground">
            {comment.timestamp
              ? formatDistanceToNow(comment.timestamp.toDate(), { addSuffix: true })
              : 'just now'}
          </p>
        </div>
        <p className="text-sm text-muted-foreground whitespace-pre-wrap">{comment.content}</p>
      </div>
       <div className="flex items-center gap-1 text-muted-foreground">
            <Button variant="ghost" size="icon" className="h-7 w-7 group" onClick={onLikeComment} disabled={isPending || !currentUser}>
                <Heart className={cn('h-3.5 w-3.5 group-hover:text-red-500', hasLiked && 'fill-red-500 text-red-500')} />
            </Button>
            {comment.likes?.length > 0 && (
                <span className="text-xs">{comment.likes.length}</span>
            )}
        </div>
    </div>
  );
}
