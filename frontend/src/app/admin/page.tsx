'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { adminAPI } from '@/lib/api';
import { DashboardStats } from '@/types';
import { StatCard } from '@/components/ui/StatCard';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { PageLoading } from '@/components/ui/Loading';
import { Users, UserCheck, Calendar, Trophy, AlertCircle, Mail } from 'lucide-react';

export default function AdminDashboard() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-dashboard'],
    queryFn: () => adminAPI.getDashboard().then((r) => r.data.data as DashboardStats),
  });

  if (isLoading) return <PageLoading />;

  const stats = data!;

  return (
    <div>
      <h1 className="page-title mb-8">Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard title="Total Teams" value={stats.totalTeams} icon={Users} />
        <StatCard title="Total Players" value={stats.totalPlayers} icon={UserCheck} color="bg-blue-600" />
        <StatCard title="Total Matches" value={stats.totalMatches} icon={Calendar} color="bg-purple-600" />
        <StatCard title="Tournaments" value={stats.totalTournaments} icon={Trophy} color="bg-orange-600" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader className="flex items-center justify-between">
            <h2 className="section-title mb-0 flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Pending Approvals
            </h2>
          </CardHeader>
          <CardBody>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                <span className="text-sm">Teams awaiting approval</span>
                <span className="font-bold text-yellow-600">{stats.pendingTeams}</span>
              </div>
              <Link href="/admin/teams">
                <Button variant="outline" size="sm">Review Teams</Button>
              </Link>
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="section-title mb-0 flex items-center gap-2">
              <Mail className="w-5 h-5 text-blue-500" />
              Messages
            </h2>
          </CardHeader>
          <CardBody>
            <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <span className="text-sm">Unread contact messages</span>
              <span className="font-bold text-blue-600">{stats.unreadMessages}</span>
            </div>
            <Link href="/admin/messages" className="mt-3 inline-block">
              <Button variant="outline" size="sm">View Messages</Button>
            </Link>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
