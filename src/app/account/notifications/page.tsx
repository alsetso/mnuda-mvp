import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';
import NotificationsClient from './NotificationsClient';

export default async function NotificationsPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account/notifications&message=Please sign in to access your notifications');
  }

  return <NotificationsClient />;
}


