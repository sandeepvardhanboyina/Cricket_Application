'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';
import { Player } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Loading } from '@/components/ui/Loading';
import { PlayerAvailabilityBadge } from '@/components/ui/PlayerAvailabilityBadge';

export default function TopPlayers() {
  const { data, isLoading } = useQuery({
    queryKey: ['top-batsmen'],
    queryFn: () => playersAPI.getTopBatsmen(6).then((r) => r.data.data as Player[]),
  });

  if (isLoading) return <Loading />;

  const players = data || [];

  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Top Players</h2>
          <Link href="/players" className="text-cricket-600 hover:text-cricket-700 text-sm font-medium">
            View Rankings →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {players.map((player, index) => (
            <Link key={player._id} href={`/players/${player._id}`}>
              <Card hover>
                <CardBody className="text-center p-4">
                  <div className="relative inline-block mb-3">
                    <Avatar src={player.profileImage} name={player.name} size="lg" className="mx-auto" />
                    <span className="absolute -top-1 -right-1 w-6 h-6 bg-cricket-600 text-white text-xs font-bold rounded-full flex items-center justify-center">
                      {index + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold text-sm text-gray-900 dark:text-white truncate">{player.name}</h3>
                  <p className="text-xs text-gray-500">{player.role}</p>
                  <div className="mt-2 flex justify-center">
                    <PlayerAvailabilityBadge status={player.availabilityStatus} />
                  </div>
                  <p className="text-lg font-bold text-cricket-600 mt-1">
                    {player.statistics?.batting?.runs || 0}
                    <span className="text-xs font-normal text-gray-400 ml-1">runs</span>
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
