'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { matchesAPI } from '@/lib/api';
import { Match } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';

export default function LatestMatches() {
  const { data, isLoading } = useQuery({
    queryKey: ['latest-matches'],
    queryFn: () => matchesAPI.getLatest().then((r) => r.data.data as Match[]),
  });

  if (isLoading) return <Loading />;

  const matches = data || [];

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white">Latest Matches</h2>
          <Link href="/matches" className="text-cricket-600 hover:text-cricket-700 text-sm font-medium">
            View All →
          </Link>
        </div>

        {matches.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No matches yet. Check back soon!</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {matches.map((match) => (
              <Link key={match._id} href={`/matches/${match._id}`}>
                <Card hover>
                  <CardBody>
                    <div className="flex items-center justify-between mb-4">
                      <Badge variant={match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'info'}>
                        {match.status === 'live' ? '● LIVE' : match.status.toUpperCase()}
                      </Badge>
                      <span className="text-xs text-gray-500">{formatDate(match.date)}</span>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{match.teamA?.teamName}</span>
                        {match.innings?.[0] && (
                          <span className="font-bold text-cricket-600">
                            {match.innings[0].totalRuns}/{match.innings[0].totalWickets}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-gray-900 dark:text-white">{match.teamB?.teamName}</span>
                        {match.innings?.[1] && (
                          <span className="font-bold text-cricket-600">
                            {match.innings[1].totalRuns}/{match.innings[1].totalWickets}
                          </span>
                        )}
                      </div>
                    </div>

                    {match.result?.margin && (
                      <p className="mt-3 text-sm text-gray-500 border-t pt-3 dark:border-gray-700">
                        {typeof match.result.winner === 'object'
                          ? `${match.result.winner.teamName} won by ${match.result.margin}`
                          : match.result.margin}
                      </p>
                    )}

                    <p className="text-xs text-gray-400 mt-2">{match.ground}</p>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
