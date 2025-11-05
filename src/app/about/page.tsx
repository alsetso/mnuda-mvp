import { Metadata } from 'next';
import AboutPageClient from './AboutPageClient';

export const metadata: Metadata = {
  title: 'About MNUDA - Minnesota Under Distress and Acquisition',
  description: "Learn about MNUDA's mission to transform distressed properties into valuable assets that strengthen Minnesota's economic foundation.",
  openGraph: {
    title: 'About MNUDA - Minnesota Under Distress and Acquisition',
    description: "Learn about MNUDA's mission to transform distressed properties into valuable assets that strengthen Minnesota's economic foundation.",
    url: 'https://mnuda.com/about',
  },
};

export default function AboutPage() {
  return <AboutPageClient />;
}

