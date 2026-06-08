'use client';

import { useQuery, useQueryClient } from '@tanstack/react-query';
import { adminAPI, teamsAPI } from '@/lib/api';
import { Team } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import toast from 'react-hot-toast';

export default function AdminTeamsPage() {
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['admin-pending-teams'],
    queryFn: () => adminAPI.getPendingTeams().then((r) => r.data.data as Team[]),
  });

  const handleApprove = async (id: string) => {
    try {
      await teamsAPI.approve(id);
      toast.success('Team approved — now visible as approved on Teams page');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    } catch {
      toast.error('Failed to approve team');
    }
  };

  const handleReject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    try {
      await teamsAPI.reject(id, reason);
      toast.success('Team rejected');
      queryClient.invalidateQueries({ queryKey: ['admin-pending-teams'] });
      queryClient.invalidateQueries({ queryKey: ['teams'] });
    } catch {
      toast.error('Failed to reject team');
    }
  };

  if (isLoading) return <PageLoading />;

  const teams = data || [];

  return (
    <div>
      <h1 className="page-title mb-8">Team Approvals</h1>

      {teams.length === 0 ? (
        <p className="text-gray-500">No pending team registrations.</p>
      ) : (
        <div className="space-y-4">
          {teams.map((team) => (
            <Card key={team._id}>
              <CardBody className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{team.teamName}</h3>
                  <p className="text-sm text-gray-500">
                    Captain: {team.captain} | {team.city} | {team.captainEmail}
                  </p>
                  <p className="text-sm text-gray-500">Players: {team.players?.length || 0}</p>
                  <Badge variant="warning" className="mt-2">{team.status}</Badge>
                </div>
                <div className="flex gap-2">
                  <Button size="sm" onClick={() => handleApprove(team._id)}>Approve</Button>
                  <Button size="sm" variant="danger" onClick={() => handleReject(team._id)}>Reject</Button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
