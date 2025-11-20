import { redirect } from 'next/navigation';
import { getServerAuth } from '@/lib/authServer';

/**
 * Account page - redirects to settings by default
 * Server component for better performance and no flash
 */
export default async function AccountPage() {
  const auth = await getServerAuth();
  
  if (!auth) {
    redirect('/login?redirect=/account&message=Please sign in to access your account');
  }
  
  // Redirect to settings by default
  redirect('/account/settings');
}



