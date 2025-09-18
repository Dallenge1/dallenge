import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { videoData } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Clock, PlayCircle } from 'lucide-react';
import Image from 'next/image';

export default function VideosPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Videos</h1>
        <p className="text-muted-foreground">
          Expand your knowledge with our curated video library.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {videoData.map((video) => {
          const image = PlaceHolderImages.find((img) => img.id === video.imageId);
          return (
            <Card key={video.id} className="group flex flex-col overflow-hidden">
              <CardHeader className="relative h-48 w-full p-0">
                {image && (
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    data-ai-hint={image.imageHint}
                    width={400}
                    height={225}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  />
                )}
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <PlayCircle className="h-16 w-16 text-white/80 transition-all group-hover:text-white group-hover:scale-110" />
                </div>
              </CardHeader>
              <CardContent className="flex-1 p-4">
                <CardTitle className="mb-2 text-lg leading-tight">
                  {video.title}
                </CardTitle>
                <p className="text-sm text-muted-foreground">
                  {video.description}
                </p>
              </CardContent>
              <CardFooter className="p-4 pt-0 text-sm text-muted-foreground">
                <div className="flex w-full items-center justify-between">
                  <span>By {video.author}</span>
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    <span>{video.duration}</span>
                  </div>
                </div>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
