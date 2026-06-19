'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { matchesAPI } from '@/lib/api';
import { Match } from '@/types';
import { PageLoading } from '@/components/ui/Loading';
import { MatchScorecardView } from '@/components/matches/MatchScorecardView';
import { ScorecardEditorPanel } from '@/components/matches/ScorecardEditorPanel';
import { useAppSelector } from '@/store/hooks';

export default function MatchScorecardPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { user } = useAppSelector((state) => state.auth);

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['match-scorecard', id],
    queryFn: () => matchesAPI.getScorecard(id).then((response) => response.data.data as Match | null),
  });

  if (isLoading) return <PageLoading />;

  const canEdit =
    Boolean(user) &&
    (user?.role === 'admin' ||
      (['captain', 'team_manager'].includes(user?.role || '') &&
        Boolean(
          user?.team &&
            [data?.teamA?._id, data?.teamB?._id].includes(
              typeof user.team === 'object' ? user.team._id : user.team
            )
        )));
  const displayScorecard =
    canEdit && data?.scorecardStatus === 'pending_review' && data?.scorecardDraft
      ? data.scorecardDraft
      : data?.scorecard || null;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 md:bg-transparent">
      <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8 md:py-8">
        <div className="rounded-none border-0 bg-transparent md:rounded-2xl md:border md:border-gray-200 md:bg-white md:shadow-sm dark:md:border-gray-800 dark:md:bg-gray-900">
          <div className="p-4 sm:p-6 lg:p-8">
            {data ? (
              <div className="space-y-6">
                <ScorecardEditorPanel
                  match={data}
                  scorecard={displayScorecard}
                  scorecardStatus={data.scorecardStatus}
                  user={user}
                  onSaved={async () => {
                    await refetch();
                  }}
                />
                <MatchScorecardView match={data} scorecard={displayScorecard} />
                {!canEdit && data.scorecardStatus === 'pending_review' && (
                  <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
                    This scorecard is pending admin review.
                  </div>
                )}
              </div>
            ) : (
              <div className="py-16 text-center text-gray-500">Scorecard not available yet</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
