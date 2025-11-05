import { Metadata } from 'next';
import TermsOfServicePageClient from './TermsOfServicePageClient';

export const metadata: Metadata = {
  title: 'Terms of Service - MNUDA',
  description: 'MNUDA Terms of Service - Please read our terms and conditions for using our platform.',
  robots: {
    index: true,
    follow: true,
  },
};

export default function TermsOfServicePage() {
  return <TermsOfServicePageClient />;
}

