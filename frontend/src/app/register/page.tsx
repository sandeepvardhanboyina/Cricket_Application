'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { tournamentsAPI, teamsAPI } from '@/lib/api';
import { Tournament } from '@/types';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { Plus, Users } from 'lucide-react';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
const BOWLING_STYLES = [
  'Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak',
  'Left-arm fast', 'Left-arm medium', 'Left-arm orthodox', 'Left-arm chinaman', 'Does not bowl',
];

interface PlayerForm {
  name: string;
  dateOfBirth: string;
  role: string;
  battingStyle: string;
  bowlingStyle: string;
  jerseyNumber: string;
  isCaptain: boolean;
  profileImage?: File;
}

const emptyPlayer = (): PlayerForm => ({
  name: '',
  dateOfBirth: '',
  role: 'Batsman',
  battingStyle: 'Right-hand bat',
  bowlingStyle: 'Does not bowl',
  jerseyNumber: '',
  isCaptain: false,
});

export default function RegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [teamName, setTeamName] = useState('');
  const [captain, setCaptain] = useState('');
  const [mobileNumber, setMobileNumber] = useState('');
  const [email, setEmail] = useState('');
  const [city, setCity] = useState('');
  const [tournamentId, setTournamentId] = useState('');
  const [logo, setLogo] = useState<File | null>(null);
  const [players, setPlayers] = useState<PlayerForm[]>(Array.from({ length: 11 }, emptyPlayer));

  const { data: tournaments } = useQuery({
    queryKey: ['tournaments-upcoming'],
    queryFn: () => tournamentsAPI.getUpcoming().then((r) => r.data.data as Tournament[]),
  });

  const updatePlayer = (index: number, field: keyof PlayerForm, value: string | boolean | File) => {
    const updated = [...players];
    updated[index] = { ...updated[index], [field]: value };
    setPlayers(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const captainInSquad = players.some(
      (p) => p.name.toLowerCase() === captain.toLowerCase() || p.isCaptain
    );
    if (!captainInSquad) {
      toast.error('Captain must be one of the 11 players');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      formData.append('teamName', teamName);
      formData.append('captain', captain);
      formData.append('captainEmail', email);
      formData.append('mobileNumber', mobileNumber);
      formData.append('city', city);
      if (tournamentId) formData.append('tournamentId', tournamentId);
      if (logo) formData.append('logo', logo);

      const playersData = players.map((p) => ({
        name: p.name,
        dateOfBirth: p.dateOfBirth,
        role: p.role,
        battingStyle: p.battingStyle,
        bowlingStyle: p.bowlingStyle,
        jerseyNumber: parseInt(p.jerseyNumber),
        isCaptain: p.name.toLowerCase() === captain.toLowerCase() || p.isCaptain,
      }));
      formData.append('players', JSON.stringify(playersData));

      players.forEach((p, i) => {
        if (p.profileImage) formData.append(`playerImage_${i}`, p.profileImage);
      });

      await teamsAPI.register(formData);
      toast.success('Team registered! Pending admin approval.');
      router.push('/teams');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-4xl">
      <div className="mb-8">
        <h1 className="page-title flex items-center gap-2">
          <Users className="w-8 h-8 text-cricket-600" />
          Team Registration
        </h1>
        <p className="text-gray-500 mt-2">Register your team with exactly 11 players for tournament participation.</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">
        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Team Details</h2>
          </CardHeader>
          <CardBody className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Team Name *" value={teamName} onChange={(e) => setTeamName(e.target.value)} required />
            <Input label="Captain Name *" value={captain} onChange={(e) => setCaptain(e.target.value)} required />
            <Input label="Mobile Number *" value={mobileNumber} onChange={(e) => setMobileNumber(e.target.value)} required />
            <Input label="Email *" type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
            <Input label="City *" value={city} onChange={(e) => setCity(e.target.value)} required />
            <Select
              label="Tournament"
              value={tournamentId}
              onChange={(e) => setTournamentId(e.target.value)}
              options={[
                { value: '', label: 'Select Tournament (Optional)' },
                ...(tournaments || []).map((t) => ({ value: t._id, label: t.title })),
              ]}
            />
            <div className="sm:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Team Logo</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setLogo(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cricket-50 file:text-cricket-700"
              />
            </div>
          </CardBody>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="section-title mb-0">Players (11 Required)</h2>
          </CardHeader>
          <CardBody className="space-y-6">
            {players.map((player, index) => (
              <div key={index} className="p-4 border border-gray-200 dark:border-gray-700 rounded-xl">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-medium text-gray-900 dark:text-white">Player {index + 1}</h3>
                  <label className="flex items-center gap-2 text-sm">
                    <input
                      type="checkbox"
                      checked={player.isCaptain}
                      onChange={(e) => updatePlayer(index, 'isCaptain', e.target.checked)}
                      className="rounded text-cricket-600"
                    />
                    Captain
                  </label>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  <Input label="Full Name *" value={player.name} onChange={(e) => updatePlayer(index, 'name', e.target.value)} required />
                  <Input label="Date of Birth *" type="date" value={player.dateOfBirth} onChange={(e) => updatePlayer(index, 'dateOfBirth', e.target.value)} required />
                  <Input label="Jersey Number *" type="number" min="1" max="99" value={player.jerseyNumber} onChange={(e) => updatePlayer(index, 'jerseyNumber', e.target.value)} required />
                  <Select label="Role *" value={player.role} onChange={(e) => updatePlayer(index, 'role', e.target.value)} options={ROLES.map((r) => ({ value: r, label: r }))} />
                  <Select label="Batting Style" value={player.battingStyle} onChange={(e) => updatePlayer(index, 'battingStyle', e.target.value)} options={BATTING_STYLES.map((s) => ({ value: s, label: s }))} />
                  <Select label="Bowling Style" value={player.bowlingStyle} onChange={(e) => updatePlayer(index, 'bowlingStyle', e.target.value)} options={BOWLING_STYLES.map((s) => ({ value: s, label: s }))} />
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Profile Picture</label>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={(e) => updatePlayer(index, 'profileImage', e.target.files?.[0] as File)}
                      className="w-full text-sm"
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardBody>
        </Card>

        <Button type="submit" size="lg" loading={loading} className="w-full sm:w-auto">
          <Plus className="w-5 h-5" />
          Submit Registration
        </Button>
      </form>
    </div>
  );
}
