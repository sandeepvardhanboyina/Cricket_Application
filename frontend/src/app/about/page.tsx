import { Card, CardBody } from '@/components/ui/Card';
import { Trophy, Target, Users, Award } from 'lucide-react';

export const metadata = {
  title: 'About Us',
  description: 'Learn about Cricket Tournament Hub - the premier platform for cricket tournament management.',
};

export default function AboutPage() {
  return (
    <div className="page-container max-w-4xl">
      <h1 className="page-title mb-4">About Cricket Tournament Hub</h1>
      <p className="text-gray-600 dark:text-gray-400 text-lg leading-relaxed mb-8">
        Cricket Tournament Hub is a professional cricket tournament management platform designed
        to bring the excitement of organized cricket to teams, players, and fans across the nation.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12">
        {[
          { icon: Trophy, title: 'Our Mission', text: 'To provide a world-class platform for cricket tournament organization, making it easy for teams to register, compete, and track their performance.' },
          { icon: Target, title: 'Our Vision', text: 'To become the leading cricket tournament platform in India, connecting thousands of teams and players through technology.' },
          { icon: Users, title: 'Community', text: 'We believe cricket is more than a sport — it is a community. Our platform fosters connections between teams, organizers, and fans.' },
          { icon: Award, title: 'Excellence', text: 'From live scoring to detailed statistics, we deliver professional-grade features comparable to global cricket platforms.' },
        ].map((item) => (
          <Card key={item.title}>
            <CardBody>
              <div className="w-12 h-12 bg-cricket-100 dark:bg-cricket-900/30 rounded-xl flex items-center justify-center mb-4">
                <item.icon className="w-6 h-6 text-cricket-600" />
              </div>
              <h2 className="font-semibold text-gray-900 dark:text-white mb-2">{item.title}</h2>
              <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">{item.text}</p>
            </CardBody>
          </Card>
        ))}
      </div>

      <Card>
        <CardBody className="p-8">
          <h2 className="section-title">What We Offer</h2>
          <ul className="space-y-3 text-gray-600 dark:text-gray-400">
            <li>• Complete team registration with 11-player squad management</li>
            <li>• Tournament creation and management with points tables and NRR</li>
            <li>• Live score updates with ball-by-ball commentary</li>
            <li>• Comprehensive player statistics with career progression graphs</li>
            <li>• Admin dashboard with analytics and approval workflows</li>
            <li>• Mobile-responsive design for on-the-go access</li>
          </ul>
        </CardBody>
      </Card>
    </div>
  );
}
