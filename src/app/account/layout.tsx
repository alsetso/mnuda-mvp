'use client';

interface AccountLayoutProps {
  children: React.ReactNode;
}

export default function AccountLayout({ children }: AccountLayoutProps) {
  // Account pages handle their own layout with AccountHero and AccountSidebar
  // No wrapper needed here
  return <>{children}</>;
}



