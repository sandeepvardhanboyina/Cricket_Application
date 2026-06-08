'use client';

import Link from 'next/link';
import { useState } from 'react';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { toggleDarkMode } from '@/store/themeSlice';
import { logout } from '@/store/authSlice';
import {
  Menu,
  X,
  Sun,
  Moon,
  Trophy,
  Users,
  Calendar,
  BarChart3,
  LogIn,
  LogOut,
  LayoutDashboard,
} from 'lucide-react';

const navLinks = [
  { href: '/tournaments', label: 'Tournaments', icon: Trophy },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/players', label: 'Players', icon: BarChart3 },
  { href: '/matches', label: 'Matches', icon: Calendar },
  { href: '/about', label: 'About' },
  { href: '/contact', label: 'Contact' },
];

export default function Navbar() {
  const [open, setOpen] = useState(false);
  const { user, isAuthenticated } = useAppSelector((s) => s.auth);
  const { darkMode } = useAppSelector((s) => s.theme);
  const dispatch = useAppDispatch();

  return (
    <nav className="sticky top-0 z-50 bg-white/95 dark:bg-gray-900/95 backdrop-blur border-b border-gray-200 dark:border-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center gap-2">
            <div className="w-9 h-9 bg-cricket-600 rounded-lg flex items-center justify-center">
              <Trophy className="w-5 h-5 text-white" />
            </div>
            <span className="font-display font-bold text-lg text-gray-900 dark:text-white hidden sm:block">
              Cricket Tournament Hub
            </span>
          </Link>

          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-cricket-600 dark:hover:text-cricket-400 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(toggleDarkMode())}
              className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
              aria-label="Toggle dark mode"
            >
              {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
            </button>

            {isAuthenticated ? (
              <>
                {user?.role === 'admin' && (
                  <Link
                    href="/admin"
                    className="hidden sm:flex items-center gap-1 px-3 py-2 text-sm font-medium text-cricket-600 hover:bg-cricket-50 dark:hover:bg-cricket-900/20 rounded-lg"
                  >
                    <LayoutDashboard className="w-4 h-4" />
                    Admin
                  </Link>
                )}
                <span className="hidden sm:block text-sm text-gray-600 dark:text-gray-400">
                  {user?.name}
                </span>
                <button
                  onClick={() => dispatch(logout())}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
                >
                  <LogOut className="w-5 h-5" />
                </button>
              </>
            ) : (
              <Link
                href="/login"
                className="flex items-center gap-1 px-4 py-2 bg-cricket-600 text-white text-sm font-medium rounded-lg hover:bg-cricket-700 transition-colors"
              >
                <LogIn className="w-4 h-4" />
                Login
              </Link>
            )}

            <button
              className="md:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300"
              onClick={() => setOpen(!open)}
            >
              {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {open && (
          <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-800">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block px-3 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-cricket-600"
                onClick={() => setOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/register"
              className="block px-3 py-2 mt-2 text-sm font-medium text-cricket-600"
              onClick={() => setOpen(false)}
            >
              Register Team
            </Link>
            <Link
              href="/players/register"
              className="block px-3 py-2 text-sm font-medium text-cricket-600"
              onClick={() => setOpen(false)}
            >
              Register Player
            </Link>
          </div>
        )}
      </div>
    </nav>
  );
}
