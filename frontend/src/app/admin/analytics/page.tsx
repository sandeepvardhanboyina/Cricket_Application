'use client';

import { useQuery } from '@tanstack/react-query';
import { adminAPI } from '@/lib/api';
import { Card, CardBody, CardHeader } from '@/components/ui/Card';
import { PageLoading } from '@/components/ui/Loading';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

interface Analytics {
  tournamentRegistrations: Array<{ title: string; registrations: number }>;
  runsStats: { totalRuns: number; avgRuns: number; maxRuns: number };
  wicketsStats: { totalWickets: number; avgWickets: number; maxWickets: number };
  monthlyMatches: Array<{ _id: string; count: number }>;
}

export default function AdminAnalyticsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-analytics'],
    queryFn: () => adminAPI.getAnalytics().then((r) => r.data.data as Analytics),
  });

  if (isLoading) return <PageLoading />;

  const analytics = data!;

  const registrationChart = {
    labels: analytics.tournamentRegistrations.map((t) => t.title),
    datasets: [{
      label: 'Registrations',
      data: analytics.tournamentRegistrations.map((t) => t.registrations),
      backgroundColor: '#16a34a',
    }],
  };

  const matchesChart = {
    labels: analytics.monthlyMatches.map((m) => m._id),
    datasets: [{
      label: 'Matches',
      data: analytics.monthlyMatches.map((m) => m.count),
      backgroundColor: '#2563eb',
    }],
  };

  return (
    <div>
      <h1 className="page-title mb-8">Analytics</h1>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-cricket-600">{analytics.runsStats.totalRuns}</p>
            <p className="text-sm text-gray-500">Total Runs</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-blue-600">{analytics.wicketsStats.totalWickets}</p>
            <p className="text-sm text-gray-500">Total Wickets</p>
          </CardBody>
        </Card>
        <Card>
          <CardBody className="text-center">
            <p className="text-2xl font-bold text-purple-600">{analytics.runsStats.maxRuns}</p>
            <p className="text-sm text-gray-500">Highest Individual Score</p>
          </CardBody>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><h2 className="section-title mb-0">Tournament Registrations</h2></CardHeader>
          <CardBody>
            <Bar data={registrationChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </CardBody>
        </Card>
        <Card>
          <CardHeader><h2 className="section-title mb-0">Monthly Matches</h2></CardHeader>
          <CardBody>
            <Bar data={matchesChart} options={{ responsive: true, plugins: { legend: { display: false } } }} />
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
