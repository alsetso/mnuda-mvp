'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useAuth } from '@/features/auth';

export interface CreditBalance {
  remainingCredits: number;
  totalAllocated: number;
  resetDate: Date;
  usageRate: number; // credits per hour
  projectedExhaustion: Date | null;
  periodStart: Date;
  periodEnd: Date;
}

export interface CreditTransaction {
  id: string;
  amount: number;
  transactionType: 'credit' | 'usage' | 'refund' | 'bonus';
  description: string;
  balanceBefore: number;
  balanceAfter: number;
  createdAt: Date;
}

export function useRealtimeCredits() {
  const { user } = useAuth();
  const [creditBalance, setCreditBalance] = useState<CreditBalance | null>(null);
  const [transactions, setTransactions] = useState<CreditTransaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchCreditData = async () => {
    if (!user) return;

    try {
      setLoading(true);
      setError(null);

      // User data is now handled by the billing portal API

      // Fetch current credit balance
      const { data: balanceData, error: balanceError } = await supabase
        .from('credit_balance')
        .select(`
          remaining_credits,
          total_credits_allocated,
          period_start,
          period_end,
          last_reset_at
        `)
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (balanceError) {
        console.error('Error fetching credit balance:', balanceError);
        setCreditBalance(null);
        setTransactions([]);
        return;
      }

      // Handle case where user has no credit balance record yet
      if (!balanceData) {
        console.warn('No credit balance found for user');
        setCreditBalance(null);
        setTransactions([]);
        return;
      }

      // Fetch recent transactions
      const { data: transactionData, error: transactionError } = await supabase
        .from('credit_transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (transactionError) throw transactionError;

      // Calculate usage rate (credits per hour)
      const now = new Date();
      const periodStart = new Date(balanceData.period_start);
      const hoursElapsed = (now.getTime() - periodStart.getTime()) / (1000 * 60 * 60);
      const creditsUsed = balanceData.total_credits_allocated - balanceData.remaining_credits;
      const usageRate = hoursElapsed > 0 ? creditsUsed / hoursElapsed : 0;

      // Calculate projected exhaustion
      let projectedExhaustion: Date | null = null;
      if (usageRate > 0 && balanceData.remaining_credits > 0) {
        const hoursUntilExhaustion = balanceData.remaining_credits / usageRate;
        projectedExhaustion = new Date(now.getTime() + (hoursUntilExhaustion * 60 * 60 * 1000));
      }

      const creditBalance: CreditBalance = {
        remainingCredits: balanceData.remaining_credits,
        totalAllocated: balanceData.total_credits_allocated,
        resetDate: new Date(balanceData.period_end),
        usageRate,
        projectedExhaustion,
        periodStart: new Date(balanceData.period_start),
        periodEnd: new Date(balanceData.period_end),
      };

      const formattedTransactions: CreditTransaction[] = transactionData.map(tx => ({
        id: tx.id,
        amount: tx.amount,
        transactionType: tx.transaction_type,
        description: tx.description,
        balanceBefore: tx.balance_before,
        balanceAfter: tx.balance_after,
        createdAt: new Date(tx.created_at),
      }));

      setCreditBalance(creditBalance);
      setTransactions(formattedTransactions);
    } catch (err) {
      console.error('Error fetching credit data:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch credit data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCreditData();

    // Set up real-time subscription for credit balance changes
    if (user) {
      const subscription = supabase
        .channel('credit_balance_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'credit_balance',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCreditData();
          }
        )
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'credit_transactions',
            filter: `user_id=eq.${user.id}`,
          },
          () => {
            fetchCreditData();
          }
        )
        .subscribe();

      return () => {
        subscription.unsubscribe();
      };
    }
  }, [user]);

  return {
    creditBalance,
    transactions,
    loading,
    error,
    refetch: fetchCreditData,
  };
}
