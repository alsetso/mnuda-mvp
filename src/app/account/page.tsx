import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';

export default async function AccountPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account&message=Please sign in to access your account');
  }

  // Redirect to settings as the default account page
  redirect('/account/settings');
}

