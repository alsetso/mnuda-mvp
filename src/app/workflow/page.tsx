import { Metadata } from 'next';
import WorkflowPageClient from './WorkflowPageClient';

export const metadata: Metadata = {
  title: 'Workflow - Bulk Data Transformation | MNUDA',
  description: 'Transform and process bulk lists of addresses or people through automated workflows, email campaigns, and data transformations.',
  openGraph: {
    title: 'Workflow - Bulk Data Transformation | MNUDA',
    description: 'Transform and process bulk lists of addresses or people through automated workflows, email campaigns, and data transformations.',
    url: 'https://mnuda.com/workflow',
  },
};

export default function WorkflowPage() {
  return <WorkflowPageClient />;
}

