'use client';

import { use, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { matchesAPI } from '@/lib/api';
import { Match, Player } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { MatchWeatherCard } from '@/components/matches/MatchWeatherCard';
import { formatDate, formatDateTime } from '@/lib/utils';

function getInningsTeamName(
  match: Match,
  innings: { team?: string | { _id?: string; teamName?: string } | null },
  index: number
) {
  if (innings.team && typeof innings.team === 'object') return innings.team.teamName || 'Team';
  const inningsTeamId = String(innings.team || '');
  if (match.teamA && inningsTeamId === match.teamA._id) return match.teamA.teamName;
  if (match.teamB && inningsTeamId === match.teamB._id) return match.teamB.teamName;
  if (index === 0) return match.teamA?.teamName || 'Team';
  if (index === 1) return match.teamB?.teamName || 'Team';
  return 'Team';
}

export default function MatchDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [openInnings, setOpenInnings] = useState<string | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['match', id],
    queryFn: () => matchesAPI.getById(id).then((r) => r.data.data as Match),
    refetchInterval: (query) => (query.state.data?.status === 'live' ? 10000 : false),
  });

  if (isLoading) return <PageLoading />;
  if (!data) return <div className="page-container text-center py-16">Match not found</div>;

  const match = data;
  const scorecardInnings = match.scorecard?.innings?.length ? match.scorecard.innings : match.innings || [];

  return (
    <div className="page-container">
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <Badge variant={match.status === 'live' ? 'live' : match.status === 'completed' ? 'success' : 'info'}>
            {match.status === 'live' ? '● LIVE' : match.status.toUpperCase()}
          </Badge>
          {typeof match.tournament === 'object' && (
            <span className="text-sm text-gray-500">{match.tournament.title}</span>
          )}
        </div>
        <h1 className="page-title">
          {match.teamA?.teamName} vs {match.teamB?.teamName}
        </h1>
        <p className="text-gray-500 mt-1">
          {formatDate(match.date)} | {match.ground} | {match.overs} overs
        </p>
        {match.result?.margin && (
          <div className="mt-2 space-y-2">
            <p className="text-cricket-600 font-medium">
              {typeof match.result.winner === 'object' ? match.result.winner.teamName : ''} won by {match.result.margin}
            </p>
            {match.status === 'completed' && (
              <Link
                href={`/matches/${match._id}/scorecard`}
                className="inline-flex items-center rounded-lg border border-cricket-600 px-3 py-2 text-sm font-medium text-cricket-600 transition-colors hover:bg-cricket-50 dark:hover:bg-cricket-900/20"
              >
                📊 View Scorecard
              </Link>
            )}
          </div>
        )}
      </div>

      {match.status === 'live' && match.liveScore && (
        <Card className="mb-6 border-red-300 dark:border-red-800">
          <CardBody className="text-center">
            <p className="text-sm text-red-500 font-medium mb-1">LIVE</p>
            <p className="text-2xl font-bold">
              Over {match.liveScore.currentOver}.{match.liveScore.currentBall}
            </p>
            <p className="text-xs text-gray-500 mt-1">
              Updated {match.liveScore.lastUpdated ? formatDateTime(match.liveScore.lastUpdated) : 'now'}
            </p>
          </CardBody>
        </Card>
      )}

      <div className="mb-6 max-w-md">
        <MatchWeatherCard weather={match.weather} />
      </div>

      {scorecardInnings.map((innings, idx) => {
        const inningsId = `innings-${idx + 1}`;
        const isOpen = openInnings === inningsId;
        const inningsTeamName = getInningsTeamName(match, innings, idx);
        const battingRows = 'battingStats' in innings ? innings.battingStats : innings.batting || [];
        const bowlingRows = 'bowlingStats' in innings ? innings.bowlingStats : innings.bowling || [];
        const scorecardLoaded = battingRows.length > 0 || bowlingRows.length > 0;

        return (
          <Card key={idx} className="mb-6 overflow-hidden">
            <CardHeader className="p-0">
              <button
                type="button"
                onClick={() => {
                  console.log('INNINGS CLICKED');
                  console.log('Innings clicked', inningsId);
                  console.log('Opening innings', inningsId);
                  console.log('innings', innings);
                  console.log('innings.batting', battingRows);
                  console.log('innings.bowling', bowlingRows);
                  console.log('innings.players', (innings as { players?: unknown }).players);
                  setOpenInnings((current) => {
                    const next = current === inningsId ? null : inningsId;
                    console.log('accordion state changed', { current, next });
                    return next;
                  });
                }}
                className="flex w-full cursor-pointer items-center justify-between gap-3 px-6 py-4 text-left transition-colors duration-200 hover:bg-gray-50 dark:hover:bg-gray-800/70"
                aria-expanded={isOpen}
              >
                <h2 className="section-title mb-0 flex items-center gap-3">
                  <span aria-hidden="true">{isOpen ? '▼' : '▶'}</span>
                  Innings {idx + 1} — {inningsTeamName}
                  <span className="ml-3 text-cricket-600">
                    {innings.totalRuns}/{innings.totalWickets} ({innings.totalOvers} ov)
                  </span>
                </h2>
              </button>
            </CardHeader>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-[4000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <CardBody>
                {!scorecardLoaded && (
                  <p className="text-sm text-gray-500">Scorecard data not available yet</p>
                )}

                {battingRows.length > 0 && (
                  <div className="mb-6">
                    <h3 className="mb-2 text-sm font-semibold text-gray-500">BATTING</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-500 dark:border-gray-700">
                          <th className="pb-2 text-left">Batsman</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">B</th>
                          <th className="pb-2 text-right">4s</th>
                          <th className="pb-2 text-right">6s</th>
                          <th className="pb-2 text-right">SR</th>
                        </tr>
                      </thead>
                      <tbody>
                        {battingRows.map((b, i) => (
                          <tr key={i} className="border-b dark:border-gray-800">
                            {(() => {
                              const battingEntry = b as {
                                player?: string | Player;
                                runs?: number;
                                balls?: number;
                                fours?: number;
                                sixes?: number;
                                strikeRate?: number;
                                isOut?: boolean;
                              };
                              const isOut = 'isOut' in battingEntry ? battingEntry.isOut : true;
                              return (
                                <>
                            <td className="py-2">
                                  {typeof battingEntry.player === 'object' ? (battingEntry.player as Player).name : '-'}
                                  {isOut ? '' : ' *'}
                            </td>
                                  <td className="py-2 text-right font-semibold">{battingEntry.runs}</td>
                                  <td className="py-2 text-right">{battingEntry.balls}</td>
                                  <td className="py-2 text-right">{battingEntry.fours}</td>
                                  <td className="py-2 text-right">{battingEntry.sixes}</td>
                                  <td className="py-2 text-right">{battingEntry.strikeRate}</td>
                                </>
                              );
                            })()}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}

                {bowlingRows.length > 0 && (
                  <div>
                    <h3 className="mb-2 text-sm font-semibold text-gray-500">BOWLING</h3>
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b text-gray-500 dark:border-gray-700">
                          <th className="pb-2 text-left">Bowler</th>
                          <th className="pb-2 text-right">O</th>
                          <th className="pb-2 text-right">M</th>
                          <th className="pb-2 text-right">R</th>
                          <th className="pb-2 text-right">W</th>
                          <th className="pb-2 text-right">Econ</th>
                        </tr>
                      </thead>
                      <tbody>
                        {bowlingRows.map((b, i) => (
                          <tr key={i} className="border-b dark:border-gray-800">
                            <td className="py-2">{typeof b.player === 'object' ? (b.player as Player).name : '-'}</td>
                            <td className="py-2 text-right">{b.overs}</td>
                            <td className="py-2 text-right">{b.maidens}</td>
                            <td className="py-2 text-right">{b.runs}</td>
                            <td className="py-2 text-right font-semibold">{b.wickets}</td>
                            <td className="py-2 text-right">{b.economy}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </CardBody>
            </div>
          </Card>
        );
      })}

      {match.commentary && match.commentary.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Commentary</h2>
          </CardHeader>
          <CardBody className="space-y-2 max-h-96 overflow-y-auto">
            {match.commentary.map((c, i) => (
              <div key={i} className="text-sm border-b dark:border-gray-800 pb-2">
                <span className="text-gray-500">
                  {c.over}.{c.ball}
                </span>{' '}
                <span className={c.isWicket ? 'text-red-500 font-medium' : ''}>{c.text}</span>
              </div>
            ))}
          </CardBody>
        </Card>
      )}
    </div>
  );
}
