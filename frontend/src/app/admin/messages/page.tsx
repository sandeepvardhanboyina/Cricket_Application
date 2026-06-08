'use client';

import { useQuery } from '@tanstack/react-query';
import { contactAPI } from '@/lib/api';
import { Card, CardBody } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { PageLoading } from '@/components/ui/Loading';
import { formatDateTime } from '@/lib/utils';

interface ContactMessage {
  _id: string;
  name: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export default function AdminMessagesPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-messages'],
    queryFn: () => contactAPI.getMessages().then((r) => r.data.data as ContactMessage[]),
  });

  if (isLoading) return <PageLoading />;

  const messages = data || [];

  return (
    <div>
      <h1 className="page-title mb-8">Contact Messages</h1>

      {messages.length === 0 ? (
        <p className="text-gray-500">No messages yet.</p>
      ) : (
        <div className="space-y-4">
          {messages.map((msg) => (
            <Card key={msg._id}>
              <CardBody>
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <h3 className="font-semibold">{msg.subject}</h3>
                    <p className="text-sm text-gray-500">
                      {msg.name} | {msg.email} | {msg.phone}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!msg.isRead && <Badge variant="info">New</Badge>}
                    <span className="text-xs text-gray-400">{formatDateTime(msg.createdAt)}</span>
                  </div>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">{msg.message}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
