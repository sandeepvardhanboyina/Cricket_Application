'use client';

import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tournamentsAPI } from '@/lib/api';
import { Tournament } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';
import { Trophy, Calendar, IndianRupee } from 'lucide-react';

const statusVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  upcoming: 'info',
  ongoing: 'success',
  completed: 'default',
  cancelled: 'danger',
};

export default function TournamentsPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsAPI.getAll().then((r) => r.data.data as Tournament[]),
  });

  if (isLoading) return <Loading />;

  const tournaments = data || [];

  const handleTournamentClick = (tournament: Tournament) => {
    console.log('Tournament clicked', tournament);
    console.log('Route found?', Boolean(tournament?._id));
    const targetRoute = `/tournaments/${tournament._id}`;
    console.log('navigate called', targetRoute);
    router.push(targetRoute);
  };

  return (
    <div className="page-container">
      <h1 className="page-title mb-8">Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No tournaments available.</p>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card
              key={tournament._id}
              hover
              className="h-full cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-cricket-300 dark:hover:border-cricket-700"
              onClick={() => handleTournamentClick(tournament)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  handleTournamentClick(tournament);
                }
              }}
            >
              <div className="flex h-40 items-center justify-center rounded-t-xl bg-gradient-to-br from-pitch to-cricket-700">
                {tournament.banner ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={tournament.banner}
                    alt={tournament.title}
                    className="h-full w-full rounded-t-xl object-cover"
                  />
                ) : (
                  <Trophy className="h-16 w-16 text-white/50" />
                )}
              </div>
              <CardBody>
                <div className="mb-2 flex items-start justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">{tournament.title}</h2>
                  <Badge variant={statusVariant[tournament.status] || 'info'}>{tournament.status}</Badge>
                </div>
                <p className="mb-4 line-clamp-2 text-sm text-gray-500">{tournament.description}</p>
                <div className="space-y-1 text-sm text-gray-500">
                  <p className="flex items-center gap-2">
                    <Calendar className="h-4 w-4" />
                    {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
                  </p>
                  <p className="flex items-center gap-2">
                    <IndianRupee className="h-4 w-4" />
                    Fee: ₹{tournament.registrationFee} | Prize: ₹{tournament.prizePool?.toLocaleString()}
                  </p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
