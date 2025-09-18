import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
} from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { socialFeedData } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { MessageCircle, Heart, Share2 } from 'lucide-react';

export default function FeedPage() {
  const userAvatar = PlaceHolderImages.find((i) => i.id === 'user-avatar-1');
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Social Feed</h1>
        <p className="text-muted-foreground">
          Connect with the community and share your thoughts.
        </p>
      </header>

      <Card>
        <CardContent className="p-4 flex gap-4">
          {userAvatar && <Avatar>
            <AvatarImage src={userAvatar.imageUrl} alt="Your avatar" />
            <AvatarFallback>U</AvatarFallback>
          </Avatar>}
          <div className='w-full space-y-2'>
            <Textarea placeholder="What's on your mind?" />
            <div className='flex justify-end'>
                <Button>Post</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="space-y-4">
        {socialFeedData.map((post) => {
          const avatar = PlaceHolderImages.find(
            (img) => img.id === post.authorAvatarId
          );
          return (
            <Card key={post.id} className="w-full">
              <CardHeader>
                <div className="flex items-center gap-3">
                  {avatar && <Avatar>
                    <AvatarImage
                      src={avatar.imageUrl}
                      alt={post.authorName}
                      data-ai-hint={avatar.imageHint}
                    />
                    <AvatarFallback>
                      {post.authorName.charAt(0)}
                    </AvatarFallback>
                  </Avatar>}
                  <div>
                    <p className="font-semibold">{post.authorName}</p>
                    <p className="text-xs text-muted-foreground">
                      {post.timestamp}
                    </p>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-sm">{post.content}</p>
              </CardContent>
              <CardFooter className="flex justify-between border-t p-2">
                <Button variant="ghost" className="flex-1">
                  <Heart className="mr-2 h-4 w-4" /> Like
                </Button>
                <Button variant="ghost" className="flex-1">
                  <MessageCircle className="mr-2 h-4 w-4" /> Comment
                </Button>
                <Button variant="ghost" className="flex-1">
                  <Share2 className="mr-2 h-4 w-4" /> Share
                </Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
