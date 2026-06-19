'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import Link from 'next/link';
import { matchesAPI, tournamentsAPI, teamsAPI } from '@/lib/api';
import { Match, Tournament, Team } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function AdminMatchesPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    tournament: '', teamA: '', teamB: '', date: '', ground: '', overs: '20',
  });

  const { data: matches, isLoading } = useQuery({
    queryKey: ['admin-matches'],
    queryFn: () => matchesAPI.getAll().then((r) => r.data.data as Match[]),
  });

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments-select'],
    queryFn: () => tournamentsAPI.getAll().then((r) => r.data.data as Tournament[]),
  });

  const { data: teams } = useQuery({
    queryKey: ['teams-select'],
    queryFn: () => teamsAPI.getAll({ status: 'approved' }).then((r) => r.data.data as Team[]),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await matchesAPI.create(form);
      toast.success('Match created');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-matches'] });
    } catch {
      toast.error('Failed to create match');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-title">Match Management</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Schedule Match
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Select
                label="Tournament"
                value={form.tournament}
                onChange={(e) => setForm({ ...form, tournament: e.target.value })}
                options={[
                  { value: '', label: 'Select Tournament' },
                  ...(tournaments || []).map((t) => ({ value: t._id, label: t.title })),
                ]}
              />
              <Select
                label="Team A"
                value={form.teamA}
                onChange={(e) => setForm({ ...form, teamA: e.target.value })}
                options={[
                  { value: '', label: 'Select Team A' },
                  ...(teams || []).map((t) => ({ value: t._id, label: t.teamName })),
                ]}
              />
              <Select
                label="Team B"
                value={form.teamB}
                onChange={(e) => setForm({ ...form, teamB: e.target.value })}
                options={[
                  { value: '', label: 'Select Team B' },
                  ...(teams || []).map((t) => ({ value: t._id, label: t.teamName })),
                ]}
              />
              <Input label="Date" type="datetime-local" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
              <Input label="Ground" value={form.ground} onChange={(e) => setForm({ ...form, ground: e.target.value })} required />
              <Input label="Overs" type="number" value={form.overs} onChange={(e) => setForm({ ...form, overs: e.target.value })} />
              <Button type="submit" loading={loading}>Create Match</Button>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {(matches || []).map((m) => (
          <Link
            key={m._id}
            href={`/matches/${m._id}`}
            onClick={() => {
              console.log('Match clicked', m._id);
              console.log('navigate called', `/matches/${m._id}`);
            }}
            className="block"
          >
            <Card
              hover
              className="cursor-pointer transition-all duration-200 hover:scale-[1.01] hover:shadow-lg hover:border-cricket-300 dark:hover:border-cricket-700"
            >
              <CardBody className="flex items-center justify-between">
                <div>
                  <p className="font-semibold">
                    {m.teamA?.teamName} vs {m.teamB?.teamName}
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatDate(m.date)} | {m.ground}
                  </p>
                </div>
                <Badge variant={m.status === 'live' ? 'live' : 'info'}>{m.status}</Badge>
              </CardBody>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
