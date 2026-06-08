'use client';

import { useState } from 'react';
import { contactAPI } from '@/lib/api';
import { Input, Textarea } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card, CardBody } from '@/components/ui/Card';
import toast from 'react-hot-toast';
import { Mail, Phone, MapPin, Send } from 'lucide-react';

export default function ContactPage() {
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', phone: '', subject: '', message: '' });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await contactAPI.submit(form);
      toast.success('Message sent successfully!');
      setForm({ name: '', email: '', phone: '', subject: '', message: '' });
    } catch {
      toast.error('Failed to send message');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-container max-w-5xl">
      <h1 className="page-title mb-8">Contact Us</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="space-y-4">
          {[
            { icon: Mail, label: 'Email', value: 'support@crickethub.com' },
            { icon: Phone, label: 'Phone', value: '+91 98765 43210' },
            { icon: MapPin, label: 'Address', value: 'Mumbai, Maharashtra, India' },
          ].map((item) => (
            <Card key={item.label}>
              <CardBody className="flex items-center gap-4">
                <div className="w-10 h-10 bg-cricket-100 dark:bg-cricket-900/30 rounded-lg flex items-center justify-center">
                  <item.icon className="w-5 h-5 text-cricket-600" />
                </div>
                <div>
                  <p className="text-sm text-gray-500">{item.label}</p>
                  <p className="font-medium text-gray-900 dark:text-white">{item.value}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>

        <Card className="lg:col-span-2">
          <CardBody className="p-8">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Input label="Name *" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
                <Input label="Email *" type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
              </div>
              <Input label="Phone *" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} required />
              <Input label="Subject *" value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} required />
              <Textarea label="Message *" rows={5} value={form.message} onChange={(e) => setForm({ ...form, message: e.target.value })} required />
              <Button type="submit" loading={loading}>
                <Send className="w-4 h-4" /> Send Message
              </Button>
            </form>
          </CardBody>
        </Card>
      </div>
    </div>
  );
}
