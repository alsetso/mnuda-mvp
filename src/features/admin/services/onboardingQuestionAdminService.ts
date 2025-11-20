import { OnboardingQuestion } from '@/features/onboarding/services/onboardingService';
import { ProfileType } from '@/features/auth';
import { createServiceClient } from '@/lib/supabaseServer';

export interface CreateOnboardingQuestionData {
  profile_type: ProfileType;
  key: string;
  label: string;
  description: string | null;
  field_type: 'text' | 'textarea' | 'number' | 'currency' | 'select' | 'multiselect' | 'boolean' | 'map_point' | 'map_area' | 'address' | 'range';
  options: { values?: string[]; min?: number; max?: number; step?: number } | null;
  required: boolean;
  active: boolean;
  sort_order: number;
}

export interface UpdateOnboardingQuestionData extends Partial<CreateOnboardingQuestionData> {}

/**
 * Admin service for managing onboarding questions
 * Uses service role client to bypass RLS (admin operations are already protected by API route auth)
 * Simple and straightforward - no cookie handling needed
 */
export class OnboardingQuestionAdminService {
  private supabase;

  constructor() {
    // Verify service role key is available
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      throw new Error('SUPABASE_SERVICE_ROLE_KEY is not set. Service role key is required for admin operations.');
    }
    this.supabase = createServiceClient();
  }

  /**
   * Get all questions grouped by profile_type
   */
  async getAllGroupedByProfileType(): Promise<Record<ProfileType, OnboardingQuestion[]>> {
    const { data, error } = await this.supabase
      .from('onboarding_questions')
      .select('*')
      .order('profile_type', { ascending: true })
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Error fetching onboarding questions:', error);
      console.error('Error code:', error.code);
      console.error('Error details:', error);
      console.error('Service role key set:', !!process.env.SUPABASE_SERVICE_ROLE_KEY);
      throw new Error(`Failed to fetch questions: ${error.message} (code: ${error.code})`);
    }

    const grouped: Record<string, OnboardingQuestion[]> = {};
    const profileTypes: ProfileType[] = [
      'homeowner',
      'renter',
      'investor',
      'realtor',
      'wholesaler',
      'contractor',
      'services',
      'developer',
      'property_manager',
      'organization',
    ];

    // Initialize all profile types
    profileTypes.forEach(type => {
      grouped[type] = [];
    });

    // Group questions by profile_type
    (data || []).forEach((question: OnboardingQuestion) => {
      if (question.profile_type && grouped[question.profile_type]) {
        grouped[question.profile_type].push(question);
      }
    });

    return grouped as Record<ProfileType, OnboardingQuestion[]>;
  }

  /**
   * Get questions by profile_type
   */
  async getByProfileType(profileType: ProfileType): Promise<OnboardingQuestion[]> {
    const { data, error } = await this.supabase
      .from('onboarding_questions')
      .select('*')
      .eq('profile_type', profileType)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error(`Error fetching questions for ${profileType}:`, error);
      throw new Error(`Failed to fetch questions: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Get by ID
   */
  async getById(id: number): Promise<OnboardingQuestion | null> {
    const { data, error } = await this.supabase
      .from('onboarding_questions')
      .select('*')
      .eq('id', id)
      .single();
    
    if (error?.code === 'PGRST116') {
      return null;
    }
    
    if (error) {
      console.error('Error fetching onboarding question by ID:', error);
      throw new Error(`Failed to fetch question: ${error.message}`);
    }
    
    return data;
  }

  /**
   * Create question
   */
  async create(data: CreateOnboardingQuestionData): Promise<OnboardingQuestion> {
    const { data: record, error } = await this.supabase
      .from('onboarding_questions')
      .insert(data)
      .select()
      .single();
    
    if (error) {
      console.error('Error creating onboarding question:', error);
      throw new Error(`Failed to create question: ${error.message}`);
    }
    
    if (!record) {
      throw new Error('Failed to create question: no data returned');
    }
    
    return record;
  }

  /**
   * Update question
   */
  async update(id: number, data: UpdateOnboardingQuestionData): Promise<OnboardingQuestion> {
    const { data: record, error } = await this.supabase
      .from('onboarding_questions')
      .update(data)
      .eq('id', id)
      .select()
      .single();
    
    if (error) {
      console.error('Error updating onboarding question:', error);
      throw new Error(`Failed to update question: ${error.message}`);
    }
    
    if (!record) {
      throw new Error('Failed to update question: no data returned');
    }
    
    return record;
  }

  /**
   * Delete question
   */
  async delete(id: number): Promise<void> {
    const { error } = await this.supabase
      .from('onboarding_questions')
      .delete()
      .eq('id', id);
    
    if (error) {
      console.error('Error deleting onboarding question:', error);
      throw new Error(`Failed to delete question: ${error.message}`);
    }
  }

  /**
   * Update sort order for multiple questions
   */
  async updateSortOrders(updates: Array<{ id: number; sort_order: number }>): Promise<void> {
    // Update each question's sort_order
    for (const update of updates) {
      const { error } = await this.supabase
        .from('onboarding_questions')
        .update({ sort_order: update.sort_order })
        .eq('id', update.id);
      
      if (error) {
        console.error(`Error updating sort order for question ${update.id}:`, error);
        throw new Error(`Failed to update sort order: ${error.message}`);
      }
    }
  }

  /**
   * Get statistics
   */
  async getStats(): Promise<{
    total: number;
    byProfileType: Record<ProfileType, number>;
  }> {
    const { data, error } = await this.supabase
      .from('onboarding_questions')
      .select('profile_type');

    if (error) {
      console.error('Error fetching question stats:', error);
      throw new Error(`Failed to get stats: ${error.message}`);
    }

    const byProfileType: Record<string, number> = {};
    const profileTypes: ProfileType[] = [
      'homeowner',
      'renter',
      'investor',
      'realtor',
      'wholesaler',
      'contractor',
      'services',
      'developer',
      'property_manager',
      'organization',
    ];

    profileTypes.forEach(type => {
      byProfileType[type] = 0;
    });

    (data || []).forEach((q: any) => {
      if (q.profile_type) {
        byProfileType[q.profile_type] = (byProfileType[q.profile_type] || 0) + 1;
      }
    });

    return {
      total: data?.length || 0,
      byProfileType: byProfileType as Record<ProfileType, number>,
    };
  }
}
