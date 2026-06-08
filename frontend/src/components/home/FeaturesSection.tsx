import { Users, Radio, BarChart3, Trophy } from 'lucide-react';
import { Card, CardBody } from '@/components/ui/Card';

const features = [
  {
    icon: Users,
    title: 'Team Registration',
    description: 'Register your team with 11 players, upload photos, and get approved for tournaments.',
    color: 'bg-blue-500',
  },
  {
    icon: Radio,
    title: 'Live Scores',
    description: 'Follow matches in real-time with live scores, ball-by-ball commentary, and updates.',
    color: 'bg-red-500',
  },
  {
    icon: BarChart3,
    title: 'Player Statistics',
    description: 'Comprehensive batting, bowling, and fielding stats with career progression graphs.',
    color: 'bg-purple-500',
  },
  {
    icon: Trophy,
    title: 'Tournament Rankings',
    description: 'Points tables, NRR calculations, top scorers, and wicket-taker leaderboards.',
    color: 'bg-cricket-600',
  },
];

export default function FeaturesSection() {
  return (
    <section className="py-16 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="font-display text-3xl font-bold text-gray-900 dark:text-white mb-3">
            Everything You Need
          </h2>
          <p className="text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
            A complete cricket tournament management platform built for teams, players, and fans.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature) => (
            <Card key={feature.title} hover>
              <CardBody className="text-center">
                <div className={`w-14 h-14 ${feature.color} rounded-2xl flex items-center justify-center mx-auto mb-4`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">{feature.description}</p>
              </CardBody>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
