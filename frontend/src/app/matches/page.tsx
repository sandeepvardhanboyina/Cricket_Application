'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { matchesAPI } from '@/lib/api';
import { Match } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
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
          <Link key={match._id} href={`/matches/${match._id}`}>
            <Card hover>
              <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-lg">
                    {match.teamA?.teamName} <span className="text-gray-400 font-normal">vs</span> {match.teamB?.teamName}
                  </p>
                  <p className="text-sm text-gray-500 mt-1">
                    {formatDate(match.date)} | {match.ground} | {match.overs} overs
                  </p>
                  {typeof match.tournament === 'object' && (
                    <p className="text-xs text-cricket-600 mt-1">{match.tournament.title}</p>
                  )}
                </div>
                <div className="flex items-center gap-4">
                  {match.innings?.length > 0 && (
                    <div className="text-sm text-right">
                      {match.innings.map((inn, i) => (
                        <p key={i} className="font-medium text-cricket-600">
                          {inn.totalRuns}/{inn.totalWickets} ({inn.totalOvers} ov)
                        </p>
                      ))}
                    </div>
                  )}
                  <Badge variant={match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'info'}>
                    {match.status}
                  </Badge>
                </div>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
