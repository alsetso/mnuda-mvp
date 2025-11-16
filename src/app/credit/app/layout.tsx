'use client';

import { useState, useEffect, createContext, useContext } from 'react';
import { useRouter } from 'next/navigation';
import PageLayout from '@/components/PageLayout';
import { useAuth } from '@/features/auth';
import { CreditRestorationService } from '@/features/credit/services/creditRestorationService';
import type { CreditProfile, CreditReport, NegativeItem, CreditLetter } from '@/features/credit/types';

interface CreditDashboardContextValue {
  profile: CreditProfile | null;
  reports: CreditReport[];
  negatives: NegativeItem[];
  letters: CreditLetter[];
  isLoading: boolean;
  isLoadingNegatives: boolean;
  refreshProfile: () => Promise<void>;
  refreshReports: () => Promise<void>;
  refreshNegatives: () => Promise<void>;
  refreshLetters: () => Promise<void>;
}

const CreditDashboardContext = createContext<CreditDashboardContextValue | null>(null);

export function useCreditDashboard() {
  const context = useContext(CreditDashboardContext);
  if (!context) {
    throw new Error('useCreditDashboard must be used within CreditDashboardLayout');
  }
  return context;
}

export default function CreditDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isLoading: authLoading } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState<CreditProfile | null>(null);
  const [reports, setReports] = useState<CreditReport[]>([]);
  const [negatives, setNegatives] = useState<NegativeItem[]>([]);
  const [letters, setLetters] = useState<CreditLetter[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingNegatives, setIsLoadingNegatives] = useState(false);

  useEffect(() => {
    if (user && !authLoading) {
      loadDashboardData();
    } else if (!user && !authLoading) {
      router.push('/credit');
    }
  }, [user, authLoading]);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const creditProfile = await CreditRestorationService.getCreditProfile();
      if (!creditProfile) {
        router.push('/credit');
        return;
      }

      setProfile(creditProfile);

      const [reportsData, negativesData, lettersData] = await Promise.all([
        CreditRestorationService.getCreditReports(creditProfile.id),
        CreditRestorationService.getNegativeItems(creditProfile.id),
        CreditRestorationService.getCreditLetters(creditProfile.id),
      ]);

      setReports(reportsData);
      setNegatives(negativesData);
      setLetters(lettersData);
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const refreshProfile = async () => {
    if (!profile) return;
    try {
      const creditProfile = await CreditRestorationService.getCreditProfile();
      if (creditProfile) {
        setProfile(creditProfile);
      }
    } catch (error) {
      console.error('Error refreshing profile:', error);
    }
  };

  const refreshReports = async () => {
    if (!profile) return;
    try {
      const reportsData = await CreditRestorationService.getCreditReports(profile.id);
      setReports(reportsData);
    } catch (error) {
      console.error('Error refreshing reports:', error);
    }
  };

  const refreshNegatives = async () => {
    if (!profile) return;
    setIsLoadingNegatives(true);
    try {
      const negativesData = await CreditRestorationService.getNegativeItems(profile.id);
      setNegatives(negativesData);
    } catch (error) {
      console.error('Error refreshing negatives:', error);
    } finally {
      setIsLoadingNegatives(false);
    }
  };

  const refreshLetters = async () => {
    if (!profile) return;
    try {
      const lettersData = await CreditRestorationService.getCreditLetters(profile.id);
      setLetters(lettersData);
    } catch (error) {
      console.error('Error refreshing letters:', error);
    }
  };

  if (authLoading || isLoading) {
    return (
      <PageLayout showHeader={true} showFooter={false}>
        <div className="min-h-screen bg-gold-100 flex items-center justify-center">
          <div className="text-center">
            <div className="w-8 h-8 border-4 border-gold-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
            <div className="text-gray-600 font-medium">Loading dashboard...</div>
          </div>
        </div>
      </PageLayout>
    );
  }

  if (!user || !profile) {
    return null;
  }

  return (
    <CreditDashboardContext.Provider
      value={{
        profile,
        reports,
        negatives,
        letters,
        isLoading,
        isLoadingNegatives,
        refreshProfile,
        refreshReports,
        refreshNegatives,
        refreshLetters,
      }}
    >
      {children}
    </CreditDashboardContext.Provider>
  );
}

