import { Metadata } from 'next';
import DirectoryPageClient from './DirectoryPageClient';

export const metadata: Metadata = {
  title: 'Minnesota Counties Directory - MNUDA',
  description: 'Explore the top 10 most populous counties in Minnesota with population data, county seats, and key information.',
  openGraph: {
    title: 'Minnesota Counties Directory - MNUDA',
    description: 'Explore the top 10 most populous counties in Minnesota with population data, county seats, and key information.',
    url: 'https://mnuda.com/directory',
  },
};

export default function DirectoryPage() {
  return <DirectoryPageClient />;
}

