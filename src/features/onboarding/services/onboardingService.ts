import { supabase } from '@/lib/supabase';
import { ProfileType } from '@/features/auth';

export interface OnboardingQuestion {
  id: number;
  profile_type: ProfileType;
  key: string;
  label: string;
  description: string | null;
  field_type: 'text' | 'textarea' | 'number' | 'currency' | 'select' | 'multiselect' | 'boolean' | 'map_point' | 'map_area' | 'address' | 'range';
  options: { values?: string[]; min?: number; max?: number; step?: number } | null;
  required: boolean;
  sort_order: number;
  active: boolean;
  created_at: string;
  updated_at: string;
}

export interface OnboardingAnswer {
  id: number;
  profile_id: string;
  question_id: number;
  value: any;
  created_at: string;
  updated_at: string;
}

export interface OnboardingAnswerInput {
  question_id: number;
  value: any;
}

export class OnboardingService {
  /**
   * Get all active questions (cache once, filter client-side)
   * Only returns questions where active = true
   */
  static async getAllQuestions(): Promise<OnboardingQuestion[]> {
    const { data, error } = await supabase
      .from('onboarding_questions')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) throw new Error(`Failed to fetch questions: ${error.message}`);
    return data || [];
  }

  /**
   * Filter questions by profile_type
   * Only returns active questions
   */
  static filterQuestions(
    allQuestions: OnboardingQuestion[],
    profileType: string
  ): OnboardingQuestion[] {
    if (!profileType) return [];
    
    return allQuestions.filter(q => {
      return q.profile_type === profileType && q.active === true;
    });
  }

  /**
   * Get answers for a profile
   */
  static async getAnswersByProfile(profileId: string): Promise<OnboardingAnswer[]> {
    const { data, error } = await supabase
      .from('onboarding_answers')
      .select('*')
      .eq('profile_id', profileId);

    if (error) throw new Error(`Failed to fetch answers: ${error.message}`);
    return data || [];
  }

  /**
   * Save answers for a profile
   */
  static async saveAnswers(profileId: string, answers: OnboardingAnswerInput[]): Promise<OnboardingAnswer[]> {
    const upsertData = answers.map(a => ({
      profile_id: profileId,
      question_id: a.question_id,
      value: a.value,
    }));

    const { data, error } = await supabase
      .from('onboarding_answers')
      .upsert(upsertData, { onConflict: 'profile_id,question_id' })
      .select();

    if (error) throw new Error(`Failed to save answers: ${error.message}`);
    return data || [];
  }
}




