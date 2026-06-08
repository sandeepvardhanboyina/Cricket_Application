import HeroSection from '@/components/home/HeroSection';
import FeaturesSection from '@/components/home/FeaturesSection';
import LatestMatches from '@/components/home/LatestMatches';
import TopPlayers from '@/components/home/TopPlayers';
import Testimonials from '@/components/home/Testimonials';

export default function HomePage() {
  return (
    <>
      <HeroSection />
      <FeaturesSection />
      <LatestMatches />
      <TopPlayers />
      <Testimonials />
    </>
  );
}
