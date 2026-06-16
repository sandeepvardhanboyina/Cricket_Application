'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { BarChart3, Star } from 'lucide-react';
import { matchesAPI } from '@/lib/api';
import { Match } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { MatchWeatherCard } from '@/components/matches/MatchWeatherCard';
import { formatDate } from '@/lib/utils';

export default function MatchesPage() {
  const router = useRouter();
  const { data, isLoading } = useQuery({
    queryKey: ['matches'],
    queryFn: () => matchesAPI.getAll().then((r) => r.data.data as Match[]),
  });

  if (isLoading) return <Loading />;

  const matches = data || [];

  return (
    <div className="page-container">
      <h1 className="page-title mb-8">Match Schedule</h1>

      <div className="space-y-4">
        {matches.map((match) => (
          <Card
            key={match._id}
            hover
            className="cursor-pointer"
            role="button"
            tabIndex={0}
            onClick={() => router.push(`/matches/${match._id}`)}
            onKeyDown={(event) => {
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                router.push(`/matches/${match._id}`);
              }
            }}
          >
            <CardBody className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-gray-900 dark:text-white text-lg">
                  {match.teamA?.teamName}{' '}
                  <span className="text-gray-400 font-normal">vs</span> {match.teamB?.teamName}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {formatDate(match.date)} | {match.ground} | {match.overs} overs
                </p>
                {typeof match.tournament === 'object' && (
                  <p className="text-xs text-cricket-600 mt-1">{match.tournament.title}</p>
                )}
              </div>

              <div className="flex flex-col sm:flex-row lg:flex-col items-start lg:items-end gap-4 lg:min-w-[260px]">
                {match.innings?.length > 0 && (
                  <div className="text-sm text-right">
                    {match.innings.map((inn, i) => (
                      <p key={i} className="font-medium text-cricket-600">
                        {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)
                      </p>
                    ))}
                  </div>
                )}

                <div className="w-full lg:w-auto flex flex-col items-start lg:items-end gap-3">
                  <Badge
                    variant={match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'info'}
                  >
                    {match.status}
                  </Badge>
                  <MatchWeatherCard weather={match.weather} className="w-full lg:w-[220px]" />

                  {match.status === 'completed' && (
                    <div className="w-full lg:text-right space-y-2">
                      <p className="text-sm font-semibold text-gray-900 dark:text-white">
                        {typeof match.result?.winner === 'object'
                          ? match.result.winner.teamName
                          : 'Winner unavailable'}
                        {match.result?.margin ? ` won by ${match.result.margin}` : ''}
                      </p>
                      {match.result?.manOfTheMatch && (
                        <p className="flex items-center gap-1 text-xs text-gray-500 lg:justify-end">
                          <Star className="h-3.5 w-3.5 text-yellow-500" />
                          POTM:{' '}
                          {typeof match.result.manOfTheMatch === 'object'
                            ? match.result.manOfTheMatch.name
                            : 'Player of the Match'}
                        </p>
                      )}
                      <Link
                        href={`/matches/${match._id}/scorecard`}
                        onClick={(event) => event.stopPropagation()}
                        className="inline-flex items-center justify-center gap-2 rounded-lg border border-cricket-600 px-3 py-2 text-sm font-medium text-cricket-600 transition-colors hover:bg-cricket-50 dark:hover:bg-cricket-900/20"
                      >
                        <BarChart3 className="h-4 w-4" />
                        View Scorecard
                      </Link>
                    </div>
                  )}
                </div>
              </div>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
