import type { Metadata } from 'next';
import './globals.css';
import Providers from '@/components/providers/Providers';
import Navbar from '@/components/layout/Navbar';
import Footer from '@/components/layout/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Cricket Tournament Hub',
    template: '%s | Cricket Tournament Hub',
  },
  description:
    'Professional cricket tournament management platform. Register teams, track live scores, view player statistics and tournament rankings.',
  keywords: ['cricket', 'tournament', 'live scores', 'team registration', 'player statistics'],
  authors: [{ name: 'Cricket Tournament Hub' }],
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: process.env.NEXT_PUBLIC_SITE_URL,
    siteName: 'Cricket Tournament Hub',
    title: 'Cricket Tournament Hub',
    description: 'Professional cricket tournament management platform',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Navbar />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  );
}
