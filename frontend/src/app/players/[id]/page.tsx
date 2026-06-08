'use client';

import { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { playersAPI } from '@/lib/api';
import { Player } from '@/types';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { Avatar } from '@/components/ui/Avatar';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { calculateAge, formatDate } from '@/lib/utils';
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

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function PlayerProfilePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  const { data, isLoading } = useQuery({
    queryKey: ['player', id],
    queryFn: () => playersAPI.getById(id).then((r) => r.data.data as Player),
  });

  if (isLoading) return <PageLoading />;
  if (!data) return <div className="page-container text-center py-16">Player not found</div>;

  const player = data;
  const batting = player.statistics?.batting;
  const bowling = player.statistics?.bowling;
  const fielding = player.statistics?.fielding;
  const teamName = typeof player.team === 'object' ? player.team?.teamName : '';

  const careerData = player.careerHistory || [];
  const runsChart = {
    labels: careerData.map((_, i) => `M${i + 1}`),
    datasets: [{
      label: 'Runs',
      data: careerData.map((h) => h.runs),
      borderColor: '#16a34a',
      backgroundColor: 'rgba(22, 163, 74, 0.1)',
      tension: 0.3,
    }],
  };

  const wicketsChart = {
    labels: careerData.map((_, i) => `M${i + 1}`),
    datasets: [{
      label: 'Wickets',
      data: careerData.map((h) => h.wickets),
      borderColor: '#dc2626',
      backgroundColor: 'rgba(220, 38, 38, 0.1)',
      tension: 0.3,
    }],
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
              {player.isCaptain && <Badge variant="warning">Captain</Badge>}
              {player.isVerified && <Badge variant="success">Verified</Badge>}
            </div>
            <p className="text-gray-500 mt-2">
              Age: {player.age || calculateAge(player.dateOfBirth)} | Team:{' '}
              {typeof player.team === 'object' && player.team ? (
                <Link href={`/teams/${player.team._id}`} className="text-cricket-600 hover:underline">{teamName}</Link>
              ) : (
                <Badge variant="info">Unassigned</Badge>
              )}
            </p>
            <p className="text-sm text-gray-400 mt-1">
              #{player.jerseyNumber} | {player.battingStyle} | {player.bowlingStyle}
            </p>
          </div>
        </CardBody>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader><h2 className="section-title mb-0">Batting</h2></CardHeader>
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
          <CardHeader><h2 className="section-title mb-0">Bowling</h2></CardHeader>
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
          <CardHeader><h2 className="section-title mb-0">Fielding</h2></CardHeader>
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
            <CardHeader><h2 className="section-title mb-0">Runs Progression</h2></CardHeader>
            <CardBody><Line data={runsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} /></CardBody>
          </Card>
          <Card>
            <CardHeader><h2 className="section-title mb-0">Wickets Progression</h2></CardHeader>
            <CardBody><Line data={wicketsChart} options={{ responsive: true, plugins: { legend: { display: false } } }} /></CardBody>
          </Card>
        </div>
      )}

      {careerData.length > 0 && (
        <Card>
          <CardHeader><h2 className="section-title mb-0">Recent Match Performance</h2></CardHeader>
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
                  {careerData.slice(-5).reverse().map((h, i) => (
                    <tr key={i} className="border-b dark:border-gray-800">
                      <td className="py-2">{formatDate(h.date)}</td>
                      <td className="py-2 text-right font-semibold text-cricket-600">{h.runs}</td>
                      <td className="py-2 text-right">{h.balls}</td>
                      <td className="py-2 text-right">{h.wickets}</td>
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
