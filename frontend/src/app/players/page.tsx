'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';
import { Player } from '@/types';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { PlayerAvailabilityBadge } from '@/components/ui/PlayerAvailabilityBadge';
import { PLAYER_AVAILABILITY_STATUSES } from '@/lib/playerAvailability';
import { Search, UserPlus } from 'lucide-react';

export default function PlayersPage() {
  const [search, setSearch] = useState('');
  const [role, setRole] = useState('');
  const [availability, setAvailability] = useState('');
  const [rankingType, setRankingType] = useState('batting');
  const hasFilters = Boolean(search || role || availability);

  const { data, isLoading } = useQuery({
    queryKey: ['players', search, role, availability, rankingType],
    queryFn: () => {
      if (hasFilters) {
        return playersAPI.getAll({ search, role, availabilityStatus: availability }).then((r) => r.data);
      }
      return playersAPI.getRankings(rankingType).then((r) => ({ data: r.data.data }));
    },
  });

  const players = (data?.data as Player[]) || [];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Players</h1>
          <p className="text-gray-500 mt-1">Search players and view rankings</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <Link href="/players/register">
            <Button size="sm">
              <UserPlus className="w-4 h-4" />
              Register Player
            </Button>
          </Link>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input placeholder="Search players..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 w-full sm:w-56" />
          </div>
          <Select
            value={role}
            onChange={(e) => setRole(e.target.value)}
            options={[
              { value: '', label: 'All Roles' },
              { value: 'Batsman', label: 'Batsman' },
              { value: 'Bowler', label: 'Bowler' },
              { value: 'All-Rounder', label: 'All-Rounder' },
              { value: 'Wicket Keeper', label: 'Wicket Keeper' },
            ]}
          />
          <Select
            value={availability}
            onChange={(e) => setAvailability(e.target.value)}
            options={[
              { value: '', label: 'All Availability' },
              ...PLAYER_AVAILABILITY_STATUSES.map((status) => ({ value: status, label: status[0] + status.slice(1).toLowerCase() })),
            ]}
          />
          <Select
            value={rankingType}
            onChange={(e) => setRankingType(e.target.value)}
            options={[
              { value: 'batting', label: 'Batting Rank' },
              { value: 'bowling', label: 'Bowling Rank' },
            ]}
          />
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b dark:border-gray-700 text-left text-sm text-gray-500">
                <th className="pb-3 pl-4">#</th>
                <th className="pb-3">Player</th>
                <th className="pb-3">Team</th>
                <th className="pb-3">Role</th>
                <th className="pb-3">Availability</th>
                <th className="pb-3 text-right">Runs</th>
                <th className="pb-3 text-right pr-4">Wickets</th>
              </tr>
            </thead>
            <tbody>
              {players.map((player, index) => (
                <tr key={player._id} className="border-b dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50">
                  <td className="py-3 pl-4 text-gray-500">{index + 1}</td>
                  <td className="py-3">
                    <Link href={`/players/${player._id}`} className="flex items-center gap-3 hover:text-cricket-600">
                      <Avatar src={player.profileImage} name={player.name} size="sm" />
                      <span className="font-medium text-gray-900 dark:text-white">{player.name}</span>
                    </Link>
                  </td>
                  <td className="py-3 text-sm text-gray-500">
                    {typeof player.team === 'object' && player.team ? (
                      player.team.teamName
                    ) : (
                      <Badge variant="info">Unassigned</Badge>
                    )}
                  </td>
                  <td className="py-3 text-sm">{player.role}</td>
                  <td className="py-3">
                    <PlayerAvailabilityBadge status={player.availabilityStatus} />
                  </td>
                  <td className="py-3 text-right font-semibold text-cricket-600">
                    {player.statistics?.batting?.runs || 0}
                  </td>
                  <td className="py-3 text-right font-semibold pr-4">
                    {player.statistics?.bowling?.wickets || 0}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
