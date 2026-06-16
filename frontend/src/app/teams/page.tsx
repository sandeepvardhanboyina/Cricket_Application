'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { teamsAPI } from '@/lib/api';
import { Team } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Input, Select } from '@/components/ui/Input';
import { Loading } from '@/components/ui/Loading';
import { TeamFormIndicator } from '@/components/teams/TeamFormIndicator';
import { Search, MapPin, Trophy } from 'lucide-react';

export default function TeamsPage() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['teams', search, statusFilter],
    queryFn: () =>
      teamsAPI
        .getAll({ search, ...(statusFilter ? { status: statusFilter } : {}) })
        .then((r) => r.data),
  });

  const teams = (data?.data as Team[]) || [];

  return (
    <div className="page-container">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="page-title">Teams</h1>
          <p className="text-gray-500 mt-1">Browse all registered cricket teams</p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
          <Select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            options={[
              { value: '', label: 'All Teams' },
              { value: 'approved', label: 'Approved' },
              { value: 'pending', label: 'Pending Approval' },
            ]}
            className="sm:w-44"
          />
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <Input
              placeholder="Search teams..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
      </div>

      {isLoading ? (
        <Loading />
      ) : teams.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No teams found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 items-stretch">
          {teams.map((team) => (
            <Link key={team._id} href={`/teams/${team._id}`} className="h-full">
              <Card hover className="h-full">
                <CardBody className="flex h-full flex-col">
                  <div className="flex items-center gap-4 mb-4">
                    <Avatar src={team.logo} name={team.teamName} size="lg" />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h2 className="font-semibold text-gray-900 dark:text-white">{team.teamName}</h2>
                        {team.status === 'pending' && (
                          <Badge variant="warning">Pending Approval</Badge>
                        )}
                        {team.status === 'approved' && (
                          <Badge variant="success">Approved</Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 flex items-center gap-1">
                        <MapPin className="w-3 h-3" /> {team.city}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 text-center border-t dark:border-gray-700 pt-4">
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{team.statistics?.matches || 0}</p>
                      <p className="text-xs text-gray-500">Matches</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-cricket-600">{team.statistics?.wins || 0}</p>
                      <p className="text-xs text-gray-500">Wins</p>
                    </div>
                    <div>
                      <p className="text-lg font-bold text-gray-900 dark:text-white">{team.statistics?.winPercentage || 0}%</p>
                      <p className="text-xs text-gray-500">Win %</p>
                    </div>
                  </div>

                  <div className="mt-4">
                    <TeamFormIndicator form={team.recentForm} />
                  </div>

                  <p className="mt-auto text-sm text-gray-500 pt-4 flex items-center gap-1">
                    <Trophy className="w-3 h-3" /> Captain: {team.captain}
                  </p>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
