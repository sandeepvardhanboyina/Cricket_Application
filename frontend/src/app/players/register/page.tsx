'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';
import { Input, Select } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { UserPlus } from 'lucide-react';

const ROLES = ['Batsman', 'Bowler', 'All-Rounder', 'Wicket Keeper'];
const BATTING_STYLES = ['Right-hand bat', 'Left-hand bat'];
const BOWLING_STYLES = [
  'Right-arm fast', 'Right-arm medium', 'Right-arm offbreak', 'Right-arm legbreak',
  'Left-arm fast', 'Left-arm medium', 'Left-arm orthodox', 'Left-arm chinaman', 'Does not bowl',
];

export default function PlayerRegisterPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [form, setForm] = useState({
    name: '',
    dateOfBirth: '',
    role: 'Batsman',
    battingStyle: 'Right-hand bat',
    bowlingStyle: 'Does not bowl',
    jerseyNumber: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const formData = new FormData();
      Object.entries(form).forEach(([key, value]) => formData.append(key, value));
      if (profileImage) formData.append('profileImage', profileImage);

      await playersAPI.register(formData);
      toast.success('Player registered! Awaiting verification and team assignment.');
      router.push('/players');
    } catch (err: unknown) {
      const error = err as { response?: { data?: { message?: string } } };
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-2xl">
      <div className="mb-8">
        <h1 className="page-title flex items-center gap-2">
          <UserPlus className="w-8 h-8 text-cricket-600" />
          Player Registration
        </h1>
        <p className="text-gray-500 mt-2">
          Register as an individual player. After verification, an admin or team manager can assign you to a team.
        </p>
      </div>

      <Card>
        <CardHeader>
          <h2 className="section-title mb-0">Player Details</h2>
        </CardHeader>
        <CardBody>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              label="Full Name *"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
            <Input
              label="Date of Birth *"
              type="date"
              value={form.dateOfBirth}
              onChange={(e) => setForm({ ...form, dateOfBirth: e.target.value })}
              required
            />
            <Input
              label="Jersey Number *"
              type="number"
              min="1"
              max="99"
              value={form.jerseyNumber}
              onChange={(e) => setForm({ ...form, jerseyNumber: e.target.value })}
              required
            />
            <Select
              label="Role *"
              value={form.role}
              onChange={(e) => setForm({ ...form, role: e.target.value })}
              options={ROLES.map((r) => ({ value: r, label: r }))}
            />
            <Select
              label="Batting Style"
              value={form.battingStyle}
              onChange={(e) => setForm({ ...form, battingStyle: e.target.value })}
              options={BATTING_STYLES.map((s) => ({ value: s, label: s }))}
            />
            <Select
              label="Bowling Style"
              value={form.bowlingStyle}
              onChange={(e) => setForm({ ...form, bowlingStyle: e.target.value })}
              options={BOWLING_STYLES.map((s) => ({ value: s, label: s }))}
            />
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Profile Picture
              </label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setProfileImage(e.target.files?.[0] || null)}
                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:bg-cricket-50 file:text-cricket-700"
              />
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="submit" loading={loading}>
                <UserPlus className="w-4 h-4" />
                Register Player
              </Button>
              <Link href="/register">
                <Button type="button" variant="outline" className="w-full sm:w-auto">
                  Register Full Team Instead
                </Button>
              </Link>
            </div>
          </form>
        </CardBody>
      </Card>
    </div>
  );
}
