import { supabase } from '@/lib/supabase';
import { withAuthRetry } from '@/lib/authHelpers';

export type AccountRole = 'general' | 'admin';
export type ProfileType = 'homeowner' | 'renter' | 'investor' | 'realtor' | 'wholesaler' | 'contractor' | 'services' | 'developer' | 'property_manager' | 'organization';

// Legacy alias for backward compatibility during migration
export type AccountType = ProfileType;

export interface Account {
  id: string;
  user_id: string;
  first_name: string | null;
  last_name: string | null;
  gender: string | null;
  age: number | null;
  image_url: string | null;
  role: AccountRole;
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
  last_visit: string | null;
}

export interface UpdateAccountData {
  first_name?: string | null;
  last_name?: string | null;
  gender?: string | null;
  age?: number | null;
  image_url?: string | null;
  role?: AccountRole;
}

export class AccountService {
  /**
   * Get the current user's account record
   */
  static async getCurrentAccount(): Promise<Account | null> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        return null;
      }

      return this.getAccountById(user.id);
    }, 'Get current account');
  }

  /**
   * Get an account by user ID (returns first account for the user)
   */
  static async getAccountById(userId: string): Promise<Account | null> {
    return withAuthRetry(async () => {
      const { data: { user: authUser }, error: authError } = await supabase.auth.getUser();
      if (authError || !authUser) {
        console.error('Auth error in getAccountById:', authError);
        throw new Error('User not authenticated');
      }

      if (authUser.id !== userId) {
        throw new Error('Unauthorized: Cannot access other user\'s account record');
      }

      const { data, error } = await supabase
        .from('accounts')
        .select('*')
        .eq('user_id', userId)
        .limit(1)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          return null;
        }
        console.error('Error fetching account:', error);
        throw new Error(`Failed to fetch account: ${error.message}`);
      }

      return data;
    }, 'Get account by ID');
  }

  /**
   * Ensure an account record exists for the current user
   */
  static async ensureAccountExists(): Promise<Account> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      let account = await this.getAccountById(user.id);
      
      if (!account) {
        // Create account record if it doesn't exist
        const { data: newAccount, error } = await supabase
          .from('accounts')
          .insert({
            user_id: user.id,
            role: 'general' // Every user automatically gets 'general' role
          })
          .select()
          .single();

        if (error) {
          console.error('Error creating account:', error);
          throw new Error('Failed to create account');
        }

        if (!newAccount) {
          throw new Error('Failed to create account: no data returned');
        }

        account = newAccount;
      }

      if (!account) {
        throw new Error('Account not found and could not be created');
      }

      return account;
    }, 'Ensure account exists');
  }

  /**
   * Update the current user's account record
   */
  static async updateCurrentAccount(data: UpdateAccountData): Promise<Account> {
    return withAuthRetry(async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error('User not authenticated');
      }

      // Ensure account exists
      await this.ensureAccountExists();

      // Remove undefined values
      const cleanedData: UpdateAccountData = {};
      Object.entries(data).forEach(([key, value]) => {
        if (value !== undefined) {
          cleanedData[key as keyof UpdateAccountData] = value;
        }
      });

      // Get the first account for this user
      const { data: existingAccount } = await supabase
        .from('accounts')
        .select('id')
        .eq('user_id', user.id)
        .limit(1)
        .single();

      if (!existingAccount) {
        throw new Error('Account not found');
      }

      const { data: account, error } = await supabase
        .from('accounts')
        .update(cleanedData)
        .eq('id', existingAccount.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating account:', error);
        throw new Error(`Failed to update account: ${error.message}`);
      }

      return account;
    }, 'Update current account');
  }

  /**
   * Get display name from account record
   */
  static getDisplayName(account: Account | null): string {
    if (!account) return 'Account';
    if (account.first_name || account.last_name) {
      return `${account.first_name || ''} ${account.last_name || ''}`.trim();
    }
    return 'User';
  }
}

// Legacy aliases for backward compatibility during migration
export type MemberRole = AccountRole;
export type MemberType = AccountType;
export type Member = Account;
export type UpdateMemberData = UpdateAccountData;
export const MemberService = AccountService;
