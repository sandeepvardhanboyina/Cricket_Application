import Link from 'next/link';
import { Trophy, Facebook, Twitter, Instagram, Youtube, Mail, Phone, MapPin } from 'lucide-react';

export default function Footer() {
  return (
    <footer className="bg-pitch-dark text-gray-300">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center gap-2 mb-4">
              <div className="w-9 h-9 bg-cricket-600 rounded-lg flex items-center justify-center">
                <Trophy className="w-5 h-5 text-white" />
              </div>
              <span className="font-display font-bold text-white">Cricket Tournament Hub</span>
            </div>
            <p className="text-sm text-gray-400 leading-relaxed">
              The premier platform for cricket tournament management, team registration, and live
              score tracking.
            </p>
            <div className="flex gap-3 mt-4">
              {[Facebook, Twitter, Instagram, Youtube].map((Icon, i) => (
                <a
                  key={i}
                  href="#"
                  className="w-9 h-9 rounded-lg bg-white/10 flex items-center justify-center hover:bg-cricket-600 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
            </div>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Quick Links</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/tournaments', label: 'Tournaments' },
                { href: '/teams', label: 'Teams' },
                { href: '/players', label: 'Players' },
                { href: '/register', label: 'Register Team' },
                { href: '/players/register', label: 'Register Player' },
                { href: '/about', label: 'About Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-cricket-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Resources</h3>
            <ul className="space-y-2 text-sm">
              {[
                { href: '/matches', label: 'Match Schedule' },
                { href: '/players?type=rankings', label: 'Player Rankings' },
                { href: '/teams?type=rankings', label: 'Team Rankings' },
                { href: '/contact', label: 'Contact Us' },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="hover:text-cricket-400 transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="font-semibold text-white mb-4">Contact</h3>
            <ul className="space-y-3 text-sm">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-cricket-400" />
                support@crickethub.com
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-cricket-400" />
                +91 98765 43210
              </li>
              <li className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-cricket-400 mt-0.5" />
                Mumbai, Maharashtra, India
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-white/10 mt-8 pt-8 text-center text-sm text-gray-500">
          <p>&copy; {new Date().getFullYear()} Cricket Tournament Hub. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
