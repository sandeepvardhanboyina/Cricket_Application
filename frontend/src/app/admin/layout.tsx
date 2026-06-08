'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppSelector } from '@/store/hooks';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  UserCheck,
  MessageSquare,
  BarChart3,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const sidebarLinks = [
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/teams', label: 'Teams', icon: Users },
  { href: '/admin/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/admin/matches', label: 'Matches', icon: Calendar },
  { href: '/admin/players', label: 'Players', icon: UserCheck },
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin/messages', label: 'Messages', icon: MessageSquare },
];

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'admin') {
      router.push('/login');
    }
  }, [isAuthenticated, user, router]);

  if (!isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="flex min-h-[calc(100vh-4rem)]">
      <aside className="w-64 bg-gray-900 text-gray-300 flex-shrink-0 hidden lg:block">
        <div className="p-4 border-b border-gray-800">
          <h2 className="font-display font-bold text-white">Admin Panel</h2>
          <p className="text-xs text-gray-500 mt-1">{user?.name}</p>
        </div>
        <nav className="p-3 space-y-1">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors',
                pathname === link.href
                  ? 'bg-cricket-600 text-white'
                  : 'hover:bg-gray-800 text-gray-400 hover:text-white'
              )}
            >
              <link.icon className="w-4 h-4" />
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>

      <div className="flex-1 bg-gray-50 dark:bg-gray-950 p-6 lg:p-8 overflow-auto">
        {children}
      </div>
    </div>
  );
}
