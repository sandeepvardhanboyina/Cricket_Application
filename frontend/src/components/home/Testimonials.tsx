import { Card, CardBody } from '@/components/ui/Card';
import { Star } from 'lucide-react';

const testimonials = [
  {
    name: 'Rajesh Kumar',
    role: 'Team Captain, Mumbai Strikers',
    text: 'Cricket Tournament Hub made team registration seamless. We registered our full squad in under 30 minutes!',
    rating: 5,
  },
  {
    name: 'Priya Sharma',
    role: 'Tournament Organizer',
    text: 'The admin dashboard is fantastic. Managing matches, scores, and team approvals has never been easier.',
    rating: 5,
  },
  {
    name: 'Amit Patel',
    role: 'Cricket Fan',
    text: 'Love the live scores and player statistics. It feels like having Cricbuzz for our local tournaments.',
    rating: 5,
  },
];

export default function Testimonials() {
  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white text-center mb-12">
          What People Say
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((t) => (
            <Card key={t.name}>
              <CardBody>
                <div className="flex gap-1 mb-4">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                  ))}
                </div>
                <p className="text-gray-600 dark:text-gray-400 text-sm leading-relaxed mb-4">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div>
                  <p className="font-semibold text-gray-900 dark:text-white text-sm">{t.name}</p>
                  <p className="text-xs text-gray-500">{t.role}</p>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
