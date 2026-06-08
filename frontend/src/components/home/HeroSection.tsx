import Link from 'next/link';
import { Button } from '@/components/ui/Button';
import { Trophy, Calendar, Users } from 'lucide-react';

export default function HeroSection() {
  return (
    <section className="relative bg-gradient-to-br from-pitch-dark via-pitch to-cricket-800 text-white overflow-hidden">
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-10 right-10 w-64 h-64 rounded-full bg-cricket-400 blur-3xl" />
        <div className="absolute bottom-10 left-10 w-96 h-96 rounded-full bg-cricket-600 blur-3xl" />
      </div>

      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
        <div className="max-w-3xl">
          <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur rounded-full px-4 py-1.5 text-sm mb-6">
            <Trophy className="w-4 h-4 text-cricket-300" />
            <span>Premier Cricket Tournament Platform</span>
          </div>

          <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-bold leading-tight mb-6">
            Welcome to{' '}
            <span className="text-cricket-300">Cricket Tournament Hub</span>
          </h1>

          <p className="text-lg text-gray-300 mb-8 leading-relaxed max-w-2xl">
            Register your team, track live scores, explore player statistics, and compete in
            professional cricket tournaments across the nation.
          </p>

          <div className="flex flex-wrap gap-4">
            <Link href="/register">
              <Button size="lg" className="bg-cricket-500 hover:bg-cricket-400">
                <Users className="w-5 h-5" />
                Register Team
              </Button>
            </Link>
            <Link href="/players/register">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                Register Player
              </Button>
            </Link>
            <Link href="/tournaments">
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white/10">
                <Calendar className="w-5 h-5" />
                Upcoming Tournaments
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-6 mt-12 pt-8 border-t border-white/20">
            {[
              { value: '50+', label: 'Tournaments' },
              { value: '200+', label: 'Teams' },
              { value: '2000+', label: 'Players' },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-2xl sm:text-3xl font-bold text-cricket-300">{stat.value}</p>
                <p className="text-sm text-gray-400">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
