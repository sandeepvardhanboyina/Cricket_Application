'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI, playersAPI, teamsAPI } from '@/lib/api';
import { Player, Team } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Select } from '@/components/ui/Input';
import { PageLoading } from '@/components/ui/Loading';
import { Avatar } from '@/components/ui/Avatar';
import { PlayerAvailabilityBadge } from '@/components/ui/PlayerAvailabilityBadge';
import { isBlockedAvailabilityStatus } from '@/lib/playerAvailability';
import toast from 'react-hot-toast';

export default function AdminPlayersPage() {
  const [tab, setTab] = useState<'unverified' | 'unassigned'>('unverified');
  const [assigning, setAssigning] = useState<Record<string, string>>({});
  const queryClient = useQueryClient();

  const { data: unverified, isLoading: loadingUnverified } = useQuery({
    queryKey: ['admin-unverified-players'],
    queryFn: () => adminAPI.getUnverifiedPlayers().then((r) => r.data.data as Player[]),
    enabled: tab === 'unverified',
  });

  const { data: unassigned, isLoading: loadingUnassigned } = useQuery({
    queryKey: ['admin-unassigned-players'],
    queryFn: () => playersAPI.getUnassigned().then((r) => r.data.data as Player[]),
    enabled: tab === 'unassigned',
  });

  const { data: teams } = useQuery({
    queryKey: ['teams-for-assign'],
    queryFn: () => teamsAPI.getAll({ status: 'approved' }).then((r) => r.data.data as Team[]),
    enabled: tab === 'unassigned',
  });

  const handleVerify = async (id: string) => {
    try {
      await playersAPI.verify(id);
      toast.success('Player verified');
      queryClient.invalidateQueries({ queryKey: ['admin-unverified-players'] });
    } catch {
      toast.error('Failed to verify player');
    }
  };

  const handleAssign = async (playerId: string) => {
    const teamId = assigning[playerId];
    if (!teamId) {
      toast.error('Please select a team');
      return;
    }
    try {
      await playersAPI.assignToTeam(playerId, teamId);
      toast.success('Player assigned to team');
      queryClient.invalidateQueries({ queryKey: ['admin-unassigned-players'] });
      setAssigning((prev) => ({ ...prev, [playerId]: '' }));
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to assign player');
    }
  };

  const isLoading = tab === 'unverified' ? loadingUnverified : loadingUnassigned;
  if (isLoading) return <PageLoading />;

  const players = tab === 'unverified' ? unverified || [] : unassigned || [];

  return (
    <div>
      <h1 className="page-title mb-6">Player Management</h1>

      <div className="flex gap-1 border-b dark:border-gray-700 mb-6">
        {(['unverified', 'unassigned'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-4 py-2 text-sm font-medium capitalize border-b-2 transition-colors ${
              tab === t
                ? 'border-cricket-600 text-cricket-600'
                : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            {t === 'unverified' ? 'Pending Verification' : 'Unassigned Players'}
          </button>
        ))}
      </div>

      {players.length === 0 ? (
        <p className="text-gray-500">
          {tab === 'unverified' ? 'All players are verified.' : 'No unassigned players.'}
        </p>
      ) : (
        <div className="space-y-3">
          {players.map((player) => (
            <Card key={player._id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                  <Avatar src={player.profileImage} name={player.name} size="md" />
                  <div>
                    <h3 className="font-semibold">{player.name}</h3>
                    <p className="text-sm text-gray-500">
                      {player.role} | #{player.jerseyNumber}
                      {typeof player.team === 'object' && player.team
                        ? ` | ${player.team.teamName}`
                        : ''}
                    </p>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {!player.isVerified && <Badge variant="warning">Unverified</Badge>}
                      {!player.team && <Badge variant="info">No Team</Badge>}
                      {player.registrationType === 'individual' && (
                        <Badge variant="default">Individual</Badge>
                      )}
                      <PlayerAvailabilityBadge status={player.availabilityStatus} />
                    </div>
                  </div>
                </div>

                {tab === 'unverified' ? (
                  <Button size="sm" onClick={() => handleVerify(player._id)}>
                    Verify
                  </Button>
                ) : (
                  <div className="flex items-end gap-2 w-full sm:w-auto">
                    <Select
                      value={assigning[player._id] || ''}
                      disabled={isBlockedAvailabilityStatus(player.availabilityStatus)}
                      onChange={(e) =>
                        setAssigning((prev) => ({ ...prev, [player._id]: e.target.value }))
                      }
                      options={[
                        { value: '', label: 'Select Team' },
                        ...(teams || []).map((t) => ({ value: t._id, label: t.teamName })),
                      ]}
                      className="min-w-[180px]"
                    />
                    <Button
                      size="sm"
                      onClick={() => handleAssign(player._id)}
                      disabled={isBlockedAvailabilityStatus(player.availabilityStatus)}
                      title={
                        isBlockedAvailabilityStatus(player.availabilityStatus)
                          ? 'Unavailable, injured, and suspended players cannot be assigned'
                          : undefined
                      }
                    >
                      Assign
                    </Button>
                  </div>
                )}
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
