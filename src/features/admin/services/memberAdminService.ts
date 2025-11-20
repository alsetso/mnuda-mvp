import { BaseAdminService } from './baseAdminService';
import { Account, AccountRole, UpdateAccountData, Member, MemberRole, UpdateMemberData } from '@/features/auth/services/memberService';
import { createServerClientWithAuth } from '@/lib/supabaseServer';
import { withAuthRetry } from '@/lib/authHelpers';

export interface AdminAccount extends Account {
  // Additional admin fields can be added here
}

export interface UpdateAccountRoleData {
  role: AccountRole;
}

export class AdminAccountService extends BaseAdminService<AdminAccount, never, UpdateAccountData> {
  protected tableName = 'accounts';

  /**
   * Get all accounts with enhanced data
   */
  async getAllAccounts(): Promise<AdminAccount[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching accounts:', error);
        throw new Error(`Failed to fetch accounts: ${error.message}`);
      }

      return data || [];
    }, 'Get all accounts');
  }

  /**
   * Update account role (admin only)
   */
  async updateRole(id: string, role: AccountRole): Promise<AdminAccount> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data: account, error } = await supabase
        .from('accounts')
        .update({ role })
        .eq('id', id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account role:', error);
        throw new Error(`Failed to update account role: ${error.message}`);
      }

      if (!account) {
        throw new Error('Failed to update account role: no data returned');
      }

      return account;
    }, 'Update account role');
  }

  /**
   * Get enhanced statistics
   */
  async getStats(): Promise<{
    total: number;
    byRole: Record<string, number>;
    byType: Record<string, number>;
    active: number; // Members active in last 30 days
    recent: number; // New members in last 7 days
  }> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      // Get total count
      const { count: total, error: totalError } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true });

      if (totalError) {
        throw new Error(`Failed to get total count: ${totalError.message}`);
      }

      // Get all accounts for role breakdown
      const { data: accounts, error: accountsError } = await supabase
        .from('accounts')
        .select('role');

      if (accountsError) {
        throw new Error(`Failed to get accounts data: ${accountsError.message}`);
      }

      // Count by role
      const byRole: Record<string, number> = {};
      accounts?.forEach((account) => {
        const role = account.role || 'general';
        byRole[role] = (byRole[role] || 0) + 1;
      });

      // Count by profile type (from profiles table)
      const { data: profiles, error: profilesError } = await supabase
        .from('profiles')
        .select('profile_type');

      if (profilesError) {
        throw new Error(`Failed to get profiles data: ${profilesError.message}`);
      }

      const byType: Record<string, number> = {};
      profiles?.forEach((profile) => {
        const type = profile.profile_type || 'unknown';
        byType[type] = (byType[type] || 0) + 1;
      });

      // Get recent count (last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const { count: recent, error: recentError } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .gte('created_at', sevenDaysAgo.toISOString());

      if (recentError) {
        throw new Error(`Failed to get recent count: ${recentError.message}`);
      }

      // Get active count (updated in last 30 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      const { count: active, error: activeError } = await supabase
        .from('accounts')
        .select('*', { count: 'exact', head: true })
        .gte('updated_at', thirtyDaysAgo.toISOString());

      if (activeError) {
        throw new Error(`Failed to get active count: ${activeError.message}`);
      }

      return {
        total: total || 0,
        byRole,
        byType,
        active: active || 0,
        recent: recent || 0,
      };
    }, 'Get member statistics');
  }

  /**
   * Search accounts by name or email
   */
  async searchAccounts(query: string): Promise<AdminAccount[]> {
    return withAuthRetry(async () => {
      const supabase = await createServerClientWithAuth();
      
      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .or(`name.ilike.%${query}%,email.ilike.%${query}%`)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error searching accounts:', error);
        throw new Error(`Failed to search accounts: ${error.message}`);
      }

      return data || [];
    }, 'Search accounts');
  }
}

// Legacy aliases for backward compatibility (deprecated - use AdminAccountService directly)
export type AdminMember = AdminAccount;
export type UpdateMemberRoleData = UpdateAccountRoleData;
export const AdminMemberService = AdminAccountService;

// Add getAllMembers as alias for getAllAccounts for backward compatibility
(AdminAccountService.prototype as any).getAllMembers = function() {
  return this.getAllAccounts();
};

