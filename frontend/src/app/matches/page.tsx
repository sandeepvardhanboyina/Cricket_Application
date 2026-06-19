'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { BarChart3, Star } from 'lucide-react';
import { matchesAPI } from '@/lib/api';
import { Match } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { MatchWeatherCard } from '@/components/matches/MatchWeatherCard';
import { formatDate } from '@/lib/utils';

export default function MatchesPage() {
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
          <Link
            key={match._id}
            href={match.status === 'completed' ? `/matches/${match._id}/scorecard` : `/matches/${match._id}`}
            onClick={() => {
              console.log('Match clicked', match._id);
              console.log(
                'navigate called',
                match.status === 'completed' ? `/matches/${match._id}/scorecard` : `/matches/${match._id}`
              );
            }}
            className="block"
          >
            <Card
              hover
              className="cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-cricket-300 dark:hover:border-cricket-700"
            >
              <CardBody className="flex flex-col justify-between gap-4 lg:flex-row lg:items-start">
                <div className="min-w-0 flex-1">
                  <p className="text-lg font-semibold text-gray-900 dark:text-white">
                    {match.teamA?.teamName}{' '}
                    <span className="font-normal text-gray-400">vs</span> {match.teamB?.teamName}
                  </p>
                  <p className="mt-1 text-sm text-gray-500">
                    {formatDate(match.date)} | {match.ground} | {match.overs} overs
                  </p>
                  {typeof match.tournament === 'object' && (
                    <p className="mt-1 text-xs text-cricket-600">{match.tournament.title}</p>
                  )}
                </div>

                <div className="flex flex-col gap-4 sm:flex-row lg:min-w-[260px] lg:flex-col lg:items-end">
                  {match.innings?.length > 0 && (
                    <div className="text-sm text-right">
                      {match.innings.map((inn, i) => (
                        <p key={i} className="font-medium text-cricket-600">
                          {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)
                        </p>
                      ))}
                    </div>
                  )}

                  <div className="flex w-full flex-col items-start gap-3 lg:w-auto lg:items-end">
                    <Badge
                      variant={
                        match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'info'
                      }
                    >
                      {match.status}
                    </Badge>
                    <MatchWeatherCard weather={match.weather} className="w-full lg:w-[220px]" />

                    {match.status === 'completed' && (
                      <div className="w-full space-y-2 lg:text-right">
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
                        <span className="inline-flex items-center justify-center gap-2 rounded-lg border border-cricket-600 px-3 py-2 text-sm font-medium text-cricket-600 transition-colors hover:bg-cricket-50 dark:hover:bg-cricket-900/20">
                          <BarChart3 className="h-4 w-4" />
                          View Scorecard
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
