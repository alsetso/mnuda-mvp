import SimplePageLayout from '@/components/SimplePageLayout';
import AccountPageLayout from '@/components/AccountPageLayout';

interface AccountLayoutProps {
  children: React.ReactNode;
}

/**
 * Account Layout - Provides nav, footer, and account page structure
 * Single column: nav, content area (two-column grid), footer
 */
export default function AccountLayout({ children }: AccountLayoutProps) {
  return (
    <SimplePageLayout contentPadding="px-0" footerVariant="light" hideFooter={true}>
      <AccountPageLayout>
        {children}
      </AccountPageLayout>
    </SimplePageLayout>
  );
}



