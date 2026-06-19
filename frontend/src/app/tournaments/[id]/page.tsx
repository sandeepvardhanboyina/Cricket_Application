'use client';

import { use, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { tournamentsAPI } from '@/lib/api';
import { Tournament, Match, Player } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';
import { Calendar, IndianRupee, Trophy } from 'lucide-react';

type TournamentDetail = {
  tournament: Tournament;
  matches: Match[];
  topScorers: Player[];
  topWicketTakers: Player[];
};

export default function TournamentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [tab, setTab] = useState('teams');

  const { data, isLoading } = useQuery({
    queryKey: ['tournament', id],
    queryFn: () => tournamentsAPI.getById(id).then((r) => r.data.data as TournamentDetail),
  });

  useEffect(() => {
    console.log('Tournament details route loaded', { tournamentId: id, route: `/tournaments/${id}` });
  }, [id]);

  if (isLoading) return <PageLoading />;
  if (!data) return <div className="page-container text-center py-16">Tournament not found</div>;

  const { tournament, matches, topScorers, topWicketTakers } = data;
  const tabs = ['teams', 'fixtures', 'results', 'points', 'batting', 'bowling'];
  const totalTeams = tournament.teams?.length || 0;

  return (
    <div>
      <div className="bg-gradient-to-br from-pitch-dark to-cricket-800 text-white py-12">
        <div className="page-container">
          <Badge variant="success" className="mb-3">{tournament.status}</Badge>
          <h1 className="font-display text-4xl font-bold mb-3">{tournament.title}</h1>
          <p className="text-gray-300 max-w-2xl mb-4">{tournament.description}</p>
          <div className="flex flex-wrap gap-6 text-sm text-gray-300">
            <span className="flex items-center gap-2">
              <Calendar className="w-4 h-4" />
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </span>
            <span className="flex items-center gap-2">
              <IndianRupee className="w-4 h-4" />
              Fee: â‚¹{tournament.registrationFee}
            </span>
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Prize Pool: â‚¹{tournament.prizePool?.toLocaleString()}
            </span>
            <span className="flex items-center gap-2">
              <Trophy className="w-4 h-4" />
              Total Teams: {totalTeams}
            </span>
          </div>
        </div>
      </div>

      <div className="page-container">
        <div className="flex gap-1 border-b dark:border-gray-700 mb-6 overflow-x-auto">
          {tabs.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-2 text-sm font-medium capitalize whitespace-nowrap border-b-2 transition-colors ${
                tab === t
                  ? 'border-cricket-600 text-cricket-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {t === 'batting' ? 'Top Scorers' : t === 'bowling' ? 'Top Wickets' : t}
            </button>
          ))}
        </div>

        {tab === 'teams' && (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">Teams ({totalTeams})</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {tournament.teams?.map((entry) => {
                const team = typeof entry.team === 'object' ? entry.team : null;
                if (!team) return null;
                return (
                  <Link key={team._id} href={`/teams/${team._id}`}>
                    <Card hover>
                      <CardBody className="text-center p-4">
                        <h3 className="font-semibold">{team.teamName}</h3>
                        <p className="text-xs text-gray-500">{team.city}</p>
                        <Badge variant={entry.registrationStatus === 'approved' ? 'success' : 'warning'} className="mt-2">
                          {entry.registrationStatus}
                        </Badge>
                      </CardBody>
                    </Card>
                  </Link>
                );
              })}
            </div>
          </div>
        )}

        {tab === 'fixtures' && (
          <div className="space-y-3">
            {matches.filter((m) => m.status === 'scheduled' || m.status === 'live').map((m) => (
              <Link key={m._id} href={`/matches/${m._id}`}>
                <Card hover>
                  <CardBody className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">{m.teamA?.teamName} vs {m.teamB?.teamName}</p>
                      <p className="text-sm text-gray-500">{formatDate(m.date)} | {m.ground}</p>
                    </div>
                    <Badge variant={m.status === 'live' ? 'live' : 'info'}>{m.status}</Badge>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {tab === 'results' && (
          <div className="space-y-3">
            {matches.filter((m) => m.status === 'completed').map((m) => (
              <Link key={m._id} href={`/matches/${m._id}`}>
                <Card hover>
                  <CardBody>
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium">{m.teamA?.teamName} vs {m.teamB?.teamName}</p>
                        <p className="text-sm text-gray-500">{formatDate(m.date)}</p>
                      </div>
                      <p className="text-sm text-cricket-600 font-medium">
                        {typeof m.result?.winner === 'object' ? `${m.result.winner.teamName} won` : ''} {m.result?.margin}
                      </p>
                    </div>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {tab === 'points' && (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b dark:border-gray-700 text-gray-500">
                  <th className="pb-3 text-left">Team</th>
                  <th className="pb-3 text-center">M</th>
                  <th className="pb-3 text-center">W</th>
                  <th className="pb-3 text-center">L</th>
                  <th className="pb-3 text-center">Pts</th>
                  <th className="pb-3 text-center">NRR</th>
                </tr>
              </thead>
              <tbody>
                {tournament.pointsTable?.sort((a, b) => b.points - a.points || b.nrr - a.nrr).map((entry, i) => (
                  <tr key={i} className="border-b dark:border-gray-800">
                    <td className="py-3 font-medium">
                      {typeof entry.team === 'object' ? entry.team.teamName : '-'}
                    </td>
                    <td className="py-3 text-center">{entry.matches}</td>
                    <td className="py-3 text-center">{entry.won}</td>
                    <td className="py-3 text-center">{entry.lost}</td>
                    <td className="py-3 text-center font-bold text-cricket-600">{entry.points}</td>
                    <td className="py-3 text-center">{entry.nrr.toFixed(3)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === 'batting' && (
          <div className="space-y-2">
            {topScorers?.map((p, i) => (
              <Link key={p._id} href={`/players/${p._id}`}>
                <Card hover>
                  <CardBody className="flex items-center justify-between py-3">
                    <span className="font-medium">{i + 1}. {p.name}</span>
                    <span className="font-bold text-cricket-600">{p.statistics?.batting?.runs} runs</span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}

        {tab === 'bowling' && (
          <div className="space-y-2">
            {topWicketTakers?.map((p, i) => (
              <Link key={p._id} href={`/players/${p._id}`}>
                <Card hover>
                  <CardBody className="flex items-center justify-between py-3">
                    <span className="font-medium">{i + 1}. {p.name}</span>
                    <span className="font-bold text-cricket-600">{p.statistics?.bowling?.wickets} wickets</span>
                  </CardBody>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
