import { redirect } from 'next/navigation';
import { getServerAccount } from '@/lib/accountServer';

export default async function ProfilePage() {
  const account = await getServerAccount();
  
  if (!account) {
    redirect('/login?redirect=/profile');
  }

  if (!account.username) {
    // Redirect to account settings to set username
    redirect('/account/settings?setup=username');
  }

  redirect(`/profile/${account.username}`);
}
