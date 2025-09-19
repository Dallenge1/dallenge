
'use client';

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { formatDistanceToNow } from 'date-fns';
import { Timestamp } from "firebase/firestore";

type CommentProps = {
  comment: {
    authorName: string;
    authorAvatarUrl: string;
    content: string;
    timestamp: Timestamp;
  };
};

export default function Comment({ comment }: CommentProps) {
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
    </div>
  );
}
