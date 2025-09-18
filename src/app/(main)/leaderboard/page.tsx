import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { leaderboardData } from '@/lib/placeholder-data';
import { PlaceHolderImages } from '@/lib/placeholder-images';
import { Trophy } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

export default function LeaderboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight">Leaderboard</h1>
        <p className="text-muted-foreground">
          See who's at the top of the game.
        </p>
      </header>
      <div className="overflow-hidden rounded-lg border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16 text-center">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Points</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map((player) => {
              const avatar = PlaceHolderImages.find(
                (img) => img.id === player.avatarId
              );
              return (
                <TableRow key={player.id}>
                  <TableCell className="text-center font-bold">
                    <div className="flex justify-center">
                      {player.rank <= 3 ? (
                        <Badge
                          variant="default"
                          className={cn(
                            'flex h-8 w-8 items-center justify-center rounded-full p-0 text-base',
                            {
                              'bg-yellow-400 text-yellow-900':
                                player.rank === 1,
                              'bg-slate-300 text-slate-800': player.rank === 2,
                              'bg-orange-400 text-orange-900': player.rank === 3,
                            }
                          )}
                        >
                          {player.rank}
                        </Badge>
                      ) : (
                        player.rank
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      {avatar && (
                        <Avatar>
                          <AvatarImage
                            src={avatar.imageUrl}
                            alt={player.name}
                            data-ai-hint={avatar.imageHint}
                          />
                          <AvatarFallback>
                            {player.name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                      )}
                      <span className="font-medium">{player.name}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-mono">
                    {player.points.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
