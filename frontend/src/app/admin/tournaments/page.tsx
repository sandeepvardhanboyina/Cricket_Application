'use client';

import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { tournamentsAPI } from '@/lib/api';
import { Tournament } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Input, Textarea } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';
import toast from 'react-hot-toast';
import { Plus } from 'lucide-react';

export default function AdminTournamentsPage() {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    title: '', description: '', registrationFee: '', prizePool: '',
    startDate: '', endDate: '', overs: '20', maxTeams: '16',
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-tournaments'],
    queryFn: () => tournamentsAPI.getAll().then((r) => r.data.data as Tournament[]),
  });

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const formData = new FormData();
      Object.entries(form).forEach(([k, v]) => formData.append(k, v));
      await tournamentsAPI.create(formData);
      toast.success('Tournament created');
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ['admin-tournaments'] });
    } catch {
      toast.error('Failed to create tournament');
    } finally {
      setLoading(false);
    }
  };

  if (isLoading) return <PageLoading />;

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <h1 className="page-title">Tournaments</h1>
        <Button onClick={() => setShowForm(!showForm)}>
          <Plus className="w-4 h-4" /> Create Tournament
        </Button>
      </div>

      {showForm && (
        <Card className="mb-6">
          <CardBody>
            <form onSubmit={handleCreate} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required />
              <Input label="Registration Fee" type="number" value={form.registrationFee} onChange={(e) => setForm({ ...form, registrationFee: e.target.value })} />
              <Input label="Prize Pool" type="number" value={form.prizePool} onChange={(e) => setForm({ ...form, prizePool: e.target.value })} />
              <Input label="Overs" type="number" value={form.overs} onChange={(e) => setForm({ ...form, overs: e.target.value })} />
              <Input label="Start Date" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} required />
              <Input label="End Date" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} required />
              <div className="sm:col-span-2">
                <Textarea label="Description" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} required rows={3} />
              </div>
              <Button type="submit" loading={loading}>Create</Button>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="space-y-3">
        {(data || []).map((t) => (
          <Card key={t._id}>
            <CardBody className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{t.title}</h3>
                <p className="text-sm text-gray-500">{formatDate(t.startDate)} - {formatDate(t.endDate)}</p>
              </div>
              <Badge>{t.status}</Badge>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
