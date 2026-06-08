'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { tournamentsAPI } from '@/lib/api';
import { Tournament } from '@/types';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Loading } from '@/components/ui/Loading';
import { formatDate } from '@/lib/utils';
import { Trophy, Calendar, IndianRupee } from 'lucide-react';

const statusVariant: Record<string, 'info' | 'success' | 'warning' | 'danger' | 'default'> = {
  upcoming: 'info',
  ongoing: 'success',
  completed: 'default',
  cancelled: 'danger',
};

export default function TournamentsPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['tournaments'],
    queryFn: () => tournamentsAPI.getAll().then((r) => r.data.data as Tournament[]),
  });

  if (isLoading) return <Loading />;

  const tournaments = data || [];

  return (
    <div className="page-container">
      <h1 className="page-title mb-8">Tournaments</h1>

      {tournaments.length === 0 ? (
        <p className="text-center text-gray-500 py-16">No tournaments available.</p>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tournaments.map((t) => (
            <Link key={t._id} href={`/tournaments/${t._id}`}>
              <Card hover className="h-full">
                <div className="h-40 bg-gradient-to-br from-pitch to-cricket-700 rounded-t-xl flex items-center justify-center">
                  {t.banner ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={t.banner} alt={t.title} className="w-full h-full object-cover rounded-t-xl" />
                  ) : (
                    <Trophy className="w-16 h-16 text-white/50" />
                  )}
                </div>
                <CardBody>
                  <div className="flex items-start justify-between mb-2">
                    <h2 className="font-semibold text-gray-900 dark:text-white">{t.title}</h2>
                    <Badge variant={statusVariant[t.status] || 'info'}>{t.status}</Badge>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2 mb-4">{t.description}</p>
                  <div className="space-y-1 text-sm text-gray-500">
                    <p className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      {formatDate(t.startDate)} - {formatDate(t.endDate)}
                    </p>
                    <p className="flex items-center gap-2">
                      <IndianRupee className="w-4 h-4" />
                      Fee: ₹{t.registrationFee} | Prize: ₹{t.prizePool?.toLocaleString()}
                    </p>
                  </div>
                </CardBody>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
