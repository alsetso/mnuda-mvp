import { supabase } from '@/lib/supabase';

export interface PeopleRecord {
  id: string;
  property_id: string;
  workspace_id: string;
  full_name: string | null;
  email: string | null;
  phone: string | null;
  relationship_to_property: string | null;
  data_source: string | null;
  person_id: string | null;
  person_link: string | null;
  age: number | null;
  lives_in: string | null;
  used_to_live_in: string | null;
  related_to: string | null;
  raw_response: Record<string, unknown> | null;
  raw_skip_trace_response?: Record<string, unknown> | null;
  created_at: string;
  updated_at: string;
}

export interface CreatePeopleRecordData {
  property_id: string;
  workspace_id: string;
  full_name?: string | null;
  email?: string | null;
  phone?: string | null;
  relationship_to_property?: string | null;
  data_source?: string | null;
  person_id?: string | null;
  person_link?: string | null;
  age?: number | null;
  lives_in?: string | null;
  used_to_live_in?: string | null;
  related_to?: string | null;
  raw_response?: Record<string, unknown> | null;
}

class PeopleRecordsService {
  async getPeopleRecords(propertyId: string): Promise<PeopleRecord[]> {
    const { data, error } = await supabase
      .from('people_records')
      .select('*')
      .eq('property_id', propertyId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching people records:', error);
      throw new Error('Failed to fetch people records');
    }

    return (data || []) as PeopleRecord[];
  }

  async createPeopleRecord(data: CreatePeopleRecordData): Promise<PeopleRecord> {
    const { data: record, error } = await supabase
      .from('people_records')
      .insert(data)
      .select()
      .single();

    if (error) {
      console.error('Error creating people record:', error);
      throw new Error('Failed to create people record');
    }

    return record as PeopleRecord;
  }

  async updatePeopleRecord(id: string, data: Partial<CreatePeopleRecordData>): Promise<PeopleRecord> {
    const { data: record, error } = await supabase
      .from('people_records')
      .update(data)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error updating people record:', error);
      throw new Error('Failed to update people record');
    }

    return record as PeopleRecord;
  }

  async saveSkipTracePersonDetails(
    id: string,
    rawSkipTraceResponse: Record<string, unknown>
  ): Promise<PeopleRecord> {
    const { data: record, error } = await supabase
      .from('people_records')
      .update({ raw_skip_trace_response: rawSkipTraceResponse } as never)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('Error saving skip trace person details:', error);
      throw new Error('Failed to save skip trace person details');
    }

    return record as PeopleRecord;
  }

  async deletePeopleRecord(id: string): Promise<void> {
    const { error } = await supabase
      .from('people_records')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Error deleting people record:', error);
      throw new Error('Failed to delete people record');
    }
  }

  async checkPersonExists(propertyId: string, personId: string): Promise<boolean> {
    const { data, error } = await supabase
      .from('people_records')
      .select('id')
      .eq('property_id', propertyId)
      .eq('person_id', personId)
      .limit(1)
      .single();

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('Error checking person existence:', error);
      return false;
    }

    return !!data;
  }
}

export const peopleRecordsService = new PeopleRecordsService();

