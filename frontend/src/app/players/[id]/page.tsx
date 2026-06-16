'use client';

import { use, useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';
import { Player } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Input, Select } from '@/components/ui/Input';
import { PlayerAvailabilityBadge } from '@/components/ui/PlayerAvailabilityBadge';
import { PageLoading } from '@/components/ui/Loading';
import { calculateAge, formatDate } from '@/lib/utils';
import { PLAYER_AVAILABILITY_STATUSES } from '@/lib/playerAvailability';
import { useAppSelector } from '@/store/hooks';
import toast from 'react-hot-toast';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Line } from 'react-chartjs-2';
import { PencilLine, Save, Trash2, UserX } from 'lucide-react';

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
const BOWLING_STYLES = [
  'Right-arm fast',
  'Right-arm medium',
  'Right-arm offbreak',
  'Right-arm legbreak',
  'Left-arm fast',
  'Left-arm medium',
  'Left-arm orthodox',
  'Left-arm chinaman',
  'Does not bowl',
];

const normalizeDateForInput = (value: string) => value.slice(0, 10);

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const queryClient = useQueryClient();
  const { user, isAuthenticated } = useAppSelector((state) => state.auth);

  const { data, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => playersAPI.getById(id).then((r) => r.data.data as Player),
  });

  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Does not bowl',
    jerseyNumber: '',
    availabilityStatus: 'AVAILABLE',
    isCaptain: false,
    isVerified: false,
  });

  useEffect(() => {
    if (!data) return;

    setForm({
      name: data.name || '',
      dateOfBirth: normalizeDateForInput(data.dateOfBirth),
      role: data.role || 'Batsman',
      battingStyle: data.battingStyle || 'Right-hand bat',
      bowlingStyle: data.bowlingStyle || 'Does not bowl',
      jerseyNumber: String(data.jerseyNumber ?? ''),
      availabilityStatus: data.availabilityStatus || 'AVAILABLE',
      isCaptain: Boolean(data.isCaptain),
      isVerified: Boolean(data.isVerified),
    });
    setProfileImage(null);
  }, [data]);

  if (isLoading) return <PageLoading />;
  if (!data) return <div className="page-container text-center py-16">Player not found</div>;

  const player = data;
  const batting = player.statistics?.batting;
  const bowling = player.statistics?.bowling;
  const fielding = player.statistics?.fielding;
  const teamName = typeof player.team === 'object' ? player.team?.teamName : '';
  const playerTeamId = typeof player.team === 'object' ? player.team?._id : null;
  const userTeamId = typeof user?.team === 'object' ? user.team?._id : null;
  const canManagePlayer =
    isAuthenticated &&
    (user?.role === 'admin' ||
      (user?.role === 'team_manager' && Boolean(playerTeamId) && userTeamId === playerTeamId));

  const careerData = player.careerHistory || [];
  const runsChart = {
    labels: careerData.map((_, index) => `M${index + 1}`),
    datasets: [
      {
        label: 'Runs',
        data: careerData.map((history) => history.runs),
        borderColor: '#16a34a',
        backgroundColor: 'rgba(22, 163, 74, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const wicketsChart = {
    labels: careerData.map((_, index) => `M${index + 1}`),
    datasets: [
      {
        label: 'Wickets',
        data: careerData.map((history) => history.wickets),
        borderColor: '#dc2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        tension: 0.3,
      },
    ],
  };

  const handleUpdate = async (event: React.FormEvent) => {
    event.preventDefault();

    if (!canManagePlayer) {
      toast.error('Not authorized to update this player');
      return;
    }

    setSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', form.name);
      formData.append('dateOfBirth', form.dateOfBirth);
      formData.append('role', form.role);
      formData.append('battingStyle', form.battingStyle);
      formData.append('bowlingStyle', form.bowlingStyle);
      formData.append('jerseyNumber', form.jerseyNumber);
      if (user?.role === 'admin') {
        formData.append('availabilityStatus', form.availabilityStatus);
      }
      formData.append('isCaptain', String(form.isCaptain));
      if (user?.role === 'admin') {
        formData.append('isVerified', String(form.isVerified));
      }
      if (profileImage) {
        formData.append('profileImage', profileImage);
      }

      await playersAPI.update(player._id, formData);
      await queryClient.invalidateQueries({ queryKey: ['player', id] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Player details updated');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to update player');
    } finally {
      setSaving(false);
    }
  };

  const handleRemoveFromTeam = async () => {
    try {
      await playersAPI.removeFromTeam(player._id);
      await queryClient.invalidateQueries({ queryKey: ['player', id] });
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Player removed from team');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to remove player from team');
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this player permanently? This cannot be undone.')) return;

    setDeleting(true);
    try {
      await playersAPI.delete(player._id);
      await queryClient.invalidateQueries({ queryKey: ['players'] });
      await queryClient.invalidateQueries({ queryKey: ['team'] });
      toast.success('Player deleted');
      router.push('/players');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Failed to delete player');
    } finally {
      setDeleting(false);
    }
  };

  const StatBox = ({ label, value }: { label: string; value: string | number }) => (
    <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3 text-center">
      <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
      <p className="text-xs text-gray-500">{label}</p>
    </div>
  );

  return (
    <div className="page-container">
      <Card className="mb-8">
        <CardBody className="flex flex-col sm:flex-row items-center gap-6 p-8">
          <Avatar src={player.profileImage} name={player.name} size="xl" />
          <div className="text-center sm:text-left">
            <h1 className="font-display text-3xl font-bold text-gray-900 dark:text-white">{player.name}</h1>
            <div className="flex flex-wrap gap-2 mt-2 justify-center sm:justify-start">
              <Badge>{player.role}</Badge>
              <PlayerAvailabilityBadge status={player.availabilityStatus} />
              {player.isCaptain && <Badge variant="warning">Captain</Badge>}
              {player.isVerified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-gray-500 mt-2">
              Age: {player.age || calculateAge(player.dateOfBirth)} | Team:{' '}
              {typeof player.team === 'object' && player.team ? (
                <Link href={`/teams/${player.team._id}`} className="text-cricket-600 hover:underline">
                  {teamName}
                </Link>
              ) : (
                <Badge variant="info">Unassigned</Badge>
              )}
            </p>
            {canManagePlayer && typeof player.team === 'object' && player.team && (
              <div className="mt-4 flex flex-wrap gap-3 justify-center sm:justify-start">
                <Button variant="outline" size="sm" onClick={handleRemoveFromTeam}>
                  <UserX className="w-4 h-4" />
                  Remove from Team
                </Button>
              </div>
            )}
            <p className="text-sm text-gray-400 mt-1">
              #{player.jerseyNumber} | {player.battingStyle} | {player.bowlingStyle}
            </p>
          </div>
        </CardBody>
      </Card>

      {canManagePlayer && (
        <Card className="mb-8">
          <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="section-title mb-0 flex items-center gap-2">
                <PencilLine className="w-5 h-5" />
                Edit Player Details
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                Update the player profile, jersey number, role, and photo.
              </p>
            </div>
            <Button variant="danger" size="sm" onClick={handleDelete} loading={deleting}>
              <Trash2 className="w-4 h-4" />
              Delete Player
            </Button>
          </CardHeader>
          <CardBody>
            <form onSubmit={handleUpdate} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input
                  label="Full Name *"
                  value={form.name}
                  onChange={(event) => setForm({ ...form, name: event.target.value })}
                  required
                />
                <Input
                  label="Date of Birth *"
                  type="date"
                  value={form.dateOfBirth}
                  onChange={(event) => setForm({ ...form, dateOfBirth: event.target.value })}
                  required
                />
                <Input
                  label="Jersey Number *"
                  type="number"
                  min="1"
                  max="99"
                  value={form.jerseyNumber}
                  onChange={(event) => setForm({ ...form, jerseyNumber: event.target.value })}
                  required
                />
                <Select
                  label="Role *"
                  value={form.role}
                  onChange={(event) => setForm({ ...form, role: event.target.value })}
                  options={ROLES.map((role) => ({ value: role, label: role }))}
                />
                {user?.role === 'admin' && (
                  <Select
                    label="Availability Status"
                    value={form.availabilityStatus}
                    onChange={(event) => setForm({ ...form, availabilityStatus: event.target.value })}
                    options={PLAYER_AVAILABILITY_STATUSES.map((status) => ({
                      value: status,
                      label: status[0] + status.slice(1).toLowerCase(),
                    }))}
                  />
                )}
                <Select
                  label="Batting Style"
                  value={form.battingStyle}
                  onChange={(event) => setForm({ ...form, battingStyle: event.target.value })}
                  options={BATTING_STYLES.map((style) => ({ value: style, label: style }))}
                />
                <Select
                  label="Bowling Style"
                  value={form.bowlingStyle}
                  onChange={(event) => setForm({ ...form, bowlingStyle: event.target.value })}
                  options={BOWLING_STYLES.map((style) => ({ value: style, label: style }))}
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Profile Picture
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(event) => setProfileImage(event.target.files?.[0] || null)}
                    className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cricket-50 file:text-cricket-700"
                  />
                </div>
              </div>

              <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <input
                  type="checkbox"
                  checked={form.isCaptain}
                  onChange={(event) => setForm({ ...form, isCaptain: event.target.checked })}
                  className="rounded border-gray-300 text-cricket-600 focus:ring-cricket-500"
                />
                Captain
              </label>

              {user?.role === 'admin' && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                  <input
                    type="checkbox"
                    checked={form.isVerified}
                    onChange={(event) => setForm({ ...form, isVerified: event.target.checked })}
                    className="rounded border-gray-300 text-cricket-600 focus:ring-cricket-500"
                  />
                  Verified
                </label>
              )}

              <div className="flex flex-wrap gap-3">
                <Button type="submit" loading={saving}>
                  <Save className="w-4 h-4" />
                  Save Changes
                </Button>
              </div>
            </form>
          </CardBody>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Batting</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3">
            <StatBox label="Matches" value={batting?.matches || 0} />
            <StatBox label="Innings" value={batting?.innings || 0} />
            <StatBox label="Runs" value={batting?.runs || 0} />
            <StatBox label="Highest" value={batting?.highestScore || 0} />
            <StatBox label="Average" value={batting?.average || 0} />
            <StatBox label="Strike Rate" value={batting?.strikeRate || 0} />
            <StatBox label="50s" value={batting?.fifties || 0} />
            <StatBox label="100s" value={batting?.hundreds || 0} />
            <StatBox label="4s/6s" value={`${batting?.fours || 0}/${batting?.sixes || 0}`} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Bowling</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3">
            <StatBox label="Wickets" value={bowling?.wickets || 0} />
            <StatBox label="Overs" value={bowling?.overs || 0} />
            <StatBox label="Economy" value={bowling?.economy || 0} />
            <StatBox label="Average" value={bowling?.average || 0} />
            <StatBox label="Best" value={bowling?.bestBowling || '0/0'} />
            <StatBox label="Maidens" value={bowling?.maidens || 0} />
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Fielding</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-3 gap-3">
            <StatBox label="Catches" value={fielding?.catches || 0} />
            <StatBox label="Run Outs" value={fielding?.runOuts || 0} />
            <StatBox label="Stumpings" value={fielding?.stumpings || 0} />
          </CardBody>
        </Card>
      </div>

      {careerData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          <Card>
            <CardHeader>
              <h2 className="section-title mb-0">Runs Progression</h2>
            </CardHeader>
            <CardBody>
              <Line data={runsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </CardBody>
          </Card>
          <Card>
            <CardHeader>
              <h2 className="section-title mb-0">Wickets Progression</h2>
            </CardHeader>
            <CardBody>
              <Line data={wicketsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
            </CardBody>
          </Card>
        </div>
      )}

      {careerData.length > 0 && (
        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Recent Match Performance</h2>
          </CardHeader>
          <CardBody>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b dark:border-gray-700 text-gray-500">
                    <th className="pb-2 text-left">Date</th>
                    <th className="pb-2 text-right">Runs</th>
                    <th className="pb-2 text-right">Balls</th>
                    <th className="pb-2 text-right">Wickets</th>
                  </tr>
                </thead>
                <tbody>
                  {careerData.slice(-5).reverse().map((history, index) => (
                    <tr key={index} className="border-b dark:border-gray-800">
                      <td className="py-2">{formatDate(history.date)}</td>
                      <td className="py-2 text-right font-semibold text-cricket-600">{history.runs}</td>
                      <td className="py-2 text-right">{history.balls}</td>
                      <td className="py-2 text-right">{history.wickets}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardBody>
        </Card>
      )}
    </div>
  );
}
