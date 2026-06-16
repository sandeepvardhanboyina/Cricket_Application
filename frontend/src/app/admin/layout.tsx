'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import { useAppSelector } from '@/store/hooks';
import {
  LayoutDashboard,
  Users,
  Trophy,
  Calendar,
  UserCheck,
  MessageSquare,
  BarChart3,
  Menu,
  X,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { LogoutButton } from '@/components/layout/LogoutButton';

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
  const [hydrated, setHydrated] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    setHydrated(true);
  }, []);

  const token = useMemo(() => {
    if (!hydrated || typeof window === 'undefined') return null;
    return localStorage.getItem('token');
  }, [hydrated]);

  useEffect(() => {
    if (!hydrated) return;
    if (!token || !isAuthenticated || user?.role !== 'admin') {
      router.replace('/login');
    }
  }, [hydrated, token, isAuthenticated, user?.role, router]);

  if (!hydrated || !token || !isAuthenticated || user?.role !== 'admin') {
    return null;
  }

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950 lg:flex">
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-gray-200 bg-white px-4 py-3 shadow-sm dark:border-gray-800 dark:bg-gray-900 lg:hidden">
        <div>
          <h2 className="font-display font-bold text-gray-900 dark:text-white">Admin Panel</h2>
          <p className="text-xs text-gray-500">{user?.name}</p>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(true)}
          className="rounded-lg p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-800"
          aria-label="Open admin menu"
        >
          <Menu className="h-5 w-5" />
        </button>
      </header>

      <aside className="hidden w-64 flex-shrink-0 border-r border-gray-800 bg-gray-900 text-gray-300 lg:flex lg:flex-col">
        <div className="border-b border-gray-800 p-4">
          <h2 className="font-display font-bold text-white">Admin Panel</h2>
          <p className="mt-1 text-xs text-gray-500">{user?.name}</p>
        </div>

        <nav className="flex flex-1 flex-col gap-1 p-3">
          {sidebarLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                pathname === link.href
                  ? 'bg-cricket-600 text-white'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-white'
              )}
            >
              <link.icon className="h-4 w-4" />
              {link.label}
            </Link>
          ))}

          <div className="mt-auto border-t border-gray-800 pt-3">
            <LogoutButton />
          </div>
        </nav>
      </aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/50"
            aria-label="Close admin menu overlay"
            onClick={() => setMobileOpen(false)}
          />
          <div className="absolute right-0 top-0 h-full w-[84vw] max-w-xs bg-gray-900 text-gray-300 shadow-2xl">
            <div className="flex items-center justify-between border-b border-gray-800 p-4">
              <div>
                <h2 className="font-display font-bold text-white">Admin Panel</h2>
                <p className="text-xs text-gray-500">{user?.name}</p>
              </div>
              <button
                type="button"
                onClick={() => setMobileOpen(false)}
                className="rounded-lg p-2 text-gray-400 hover:bg-gray-800 hover:text-white"
                aria-label="Close admin menu"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <nav className="flex h-[calc(100%-4.5rem)] flex-col gap-1 p-3">
              {sidebarLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMobileOpen(false)}
                  className={cn(
                    'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm transition-colors',
                    pathname === link.href
                      ? 'bg-cricket-600 text-white'
                      : 'text-gray-400 hover:bg-gray-800 hover:text-white'
                  )}
                >
                  <link.icon className="h-4 w-4" />
                  {link.label}
                </Link>
              ))}

              <div className="mt-auto border-t border-gray-800 pt-3">
                <LogoutButton
                  className="hover:bg-gray-800 hover:text-white text-gray-400"
                  onClick={() => setMobileOpen(false)}
                />
              </div>
            </nav>
          </div>
        </div>
      )}

      <div className="flex-1 overflow-auto bg-gray-50 p-6 dark:bg-gray-950 lg:p-8">
        {children}
      </div>
    </div>
  );
}
