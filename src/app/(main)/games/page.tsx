import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { gameData } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import Image from 'next/image';

export default function GamesPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">IQ Games</h1>
        <p className="text-muted-foreground">
          Challenge your mind and improve your cognitive skills.
        </p>
      </header>
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {gameData.map((game) => {
          const image = PlaceHolderImages.find((img) => img.id === game.imageId);
          return (
            <Card
              key={game.id}
              className="group flex flex-col overflow-hidden transition-shadow hover:shadow-xl"
            >
              <CardHeader className="p-0">
                {image && (
                  <Image
                    src={image.imageUrl}
                    alt={image.description}
                    data-ai-hint={image.imageHint}
                    width={600}
                    height={400}
                    className="h-48 w-full object-cover"
                  />
                )}
              </CardHeader>
              <CardContent className="flex flex-1 flex-col p-4">
                <CardTitle className="mb-2 text-xl">{game.title}</CardTitle>
                <CardDescription className="flex-1">
                  {game.description}
                </CardDescription>
              </CardContent>
              <CardFooter className="p-4">
                <Button className="w-full">Play Now</Button>
              </CardFooter>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
