'use client';

import { use } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { playersAPI, teamsAPI } from '@/lib/api';
import { Team, Player } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { PlayerAvailabilityBadge } from '@/components/ui/PlayerAvailabilityBadge';
import { PageLoading } from '@/components/ui/Loading';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import { MapPin, Trophy, Users } from 'lucide-react';
import { UserX } from 'lucide-react';

export default function TeamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useQuery({
    queryKey: ['team', id],
    queryFn: () => teamsAPI.getById(id).then((r) => r.data.data as Team),
  });

  if (isLoading) return <PageLoading />;
  if (!data) return <div className="page-container text-center py-16">Team not found</div>;

  const team = data;
  const players = (team.players || []) as Player[];
  const canManageRoster =
    isAuthenticated &&
    (user?.role === 'admin' ||
      (user?.role === 'team_manager' &&
        typeof user.team === 'object' &&
        user.team?._id === team._id));

  const handleRemovePlayer = async (playerId: string) => {
    try {
      await playersAPI.removeFromTeam(playerId);
      toast.success('Player removed from team');
      queryClient.invalidateQueries({ queryKey: ['team', id] });
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to remove player');
    }
  };

  return (
    <div className="page-container">
      <Card className="mb-8">
        <CardBody className="flex flex-col sm:flex-row items-center gap-6 p-8">
          <Avatar src={team.logo} name={team.teamName} size="xl" />
          <div className="text-center sm:text-left flex-1">
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{team.teamName}</h1>
            <p className="text-gray-500 flex items-center justify-center sm:justify-start gap-1 mt-1">
              <MapPin className="w-4 h-4" /> {team.city}
            </p>
            <p className="text-gray-600 dark:text-gray-400 mt-2">
              <Trophy className="w-4 h-4 inline mr-1" />
              Captain: <strong>{team.captain}</strong>
            </p>
            <Badge variant={team.status === 'approved' ? 'success' : team.status === 'pending' ? 'warning' : 'danger'} className="mt-2">
              {team.status}
            </Badge>
            {team.status === 'pending' && (
              <p className="text-xs text-yellow-600 dark:text-yellow-400 mt-2">
                This team is awaiting admin approval before joining tournaments.
              </p>
            )}
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
            {[
              { label: 'Matches', value: team.statistics?.matches || 0 },
              { label: 'Wins', value: team.statistics?.wins || 0 },
              { label: 'Losses', value: team.statistics?.losses || 0 },
              { label: 'Win %', value: `${team.statistics?.winPercentage || 0}%` },
            ].map((stat) => (
              <div key={stat.label} className="bg-gray-50 dark:bg-gray-700/50 rounded-xl p-4">
                <p className="text-2xl font-bold text-cricket-600">{stat.value}</p>
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            ))}
          </div>
        </CardBody>
      </Card>

      <h2 className="section-title flex items-center gap-2">
        <Users className="w-5 h-5" /> Squad ({players.length} Players)
      </h2>

      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
        {players.map((player) => (
          <Card key={player._id} hover>
            <CardBody className="text-center p-4">
              <Link href={`/players/${player._id}`} className="block">
                <Avatar src={player.profileImage} name={player.name} size="lg" className="mx-auto mb-3" />
                <h3 className="font-semibold text-sm text-gray-900 dark:text-white">{player.name}</h3>
                <p className="text-xs text-gray-500">{player.role}</p>
                <div className="mt-2 flex justify-center">
                  <PlayerAvailabilityBadge status={player.availabilityStatus} />
                </div>
                <span className="inline-block mt-1 text-xs bg-cricket-100 dark:bg-cricket-900/30 text-cricket-700 dark:text-cricket-300 px-2 py-0.5 rounded-full">
                  #{player.jerseyNumber}
                </span>
                {player.isCaptain && <Badge variant="warning" className="mt-1">Captain</Badge>}
              </Link>
              {canManageRoster && (
                <Button
                  variant="danger"
                  size="sm"
                  className="mt-4 w-full"
                  onClick={() => handleRemovePlayer(player._id)}
                >
                  <UserX className="w-4 h-4" />
                  Remove from Team
                </Button>
              )}
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
