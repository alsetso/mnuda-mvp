import { supabase } from '@/lib/supabase';
import { MemberService } from '@/features/auth/services/memberService';
import type { CreditRestorationRequest, CreditProfile, CreditReport, CreditLetter, NegativeItem, IdentityDetails } from '../types';

export class CreditRestorationService {
  /**
   * Get current user's credit profile
   */
  static async getCreditProfile(): Promise<CreditProfile | null> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('credit_profiles')
      .select('*')
      .eq('member_id', member.id)
      .single();

    if (error) {
      if (error.code === 'PGRST116') {
        return null; // Profile doesn't exist
      }
      console.error('Error fetching credit profile:', error);
      throw new Error(`Failed to fetch profile: ${error.message}`);
    }

    return this.mapCreditProfileFromDb(data);
  }

  /**
   * Create a credit profile
   */
  static async createCreditProfile(identityDetails: IdentityDetails): Promise<CreditProfile> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
      .from('credit_profiles')
      .insert({
        member_id: member.id,
        first_name: identityDetails.firstName,
        last_name: identityDetails.lastName,
        middle_name: identityDetails.middleName || null,
        date_of_birth: identityDetails.dateOfBirth,
        ssn: identityDetails.ssn,
        email: identityDetails.email,
        phone: identityDetails.phone,
        address: {
          street: identityDetails.address.street,
          city: identityDetails.address.city,
          state: identityDetails.address.state,
          zip_code: identityDetails.address.zipCode,
        },
        previous_addresses: identityDetails.previousAddresses?.map(addr => ({
          street: addr.street,
          city: addr.city,
          state: addr.state,
          zip_code: addr.zipCode,
          years_at_address: addr.yearsAtAddress,
        })) || [],
        status: 'active',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating credit profile:', error);
      throw new Error(`Failed to create profile: ${error.message}`);
    }

    return this.mapCreditProfileFromDb(data);
  }

  /**
   * Upload a credit report
   */
  static async uploadCreditReport(
    creditProfileId: string,
    bureau: 'experian' | 'equifax' | 'transunion',
    storagePath: string,
    fileName: string,
    fileSize?: number
  ): Promise<CreditReport> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabase
      .from('credit_reports')
      .insert({
        credit_profile_id: creditProfileId,
        bureau,
        storage_path: storagePath,
        file_name: fileName,
        file_size: fileSize || null,
        parsing_status: 'pending',
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error uploading credit report:', error);
      throw new Error(`Failed to upload report: ${error.message}`);
    }

    return this.mapCreditReportFromDb(data);
  }

  /**
   * Get credit reports for a profile
   */
  static async getCreditReports(creditProfileId: string): Promise<CreditReport[]> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabase
      .from('credit_reports')
      .select('*')
      .eq('credit_profile_id', creditProfileId)
      .order('uploaded_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit reports:', error);
      throw new Error(`Failed to fetch reports: ${error.message}`);
    }

    return (data || []).map(item => this.mapCreditReportFromDb(item));
  }

  /**
   * Get negative items for a credit profile
   */
  static async getNegativeItems(creditProfileId: string): Promise<NegativeItem[]> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabase
      .from('credit_negatives')
      .select('*')
      .eq('credit_profile_id', creditProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching negative items:', error);
      throw new Error(`Failed to fetch items: ${error.message}`);
    }

    return (data || []).map(item => this.mapNegativeItemFromDb(item));
  }

  /**
   * Create a negative item
   */
  static async createNegativeItem(
    creditProfileId: string,
    item: Omit<NegativeItem, 'id' | 'creditProfileId' | 'createdAt' | 'updatedAt'>
  ): Promise<NegativeItem> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabase
      .from('credit_negatives')
      .insert({
        credit_profile_id: creditProfileId,
        bureau: item.bureau,
        item_type: item.itemType,
        item_subtype: item.itemSubtype || null,
        item_status: item.itemStatus,
        account_name: item.accountName || null,
        account_number: item.accountNumber || null,
        creditor_name: item.creditorName || null,
        original_creditor: item.originalCreditor || null,
        collection_agency: item.collectionAgency || null,
        date_opened: item.dateOpened || null,
        date_reported: item.dateReported || null,
        date_of_first_delinquency: item.dateOfFirstDelinquency || null,
        date_closed: item.dateClosed || null,
        last_payment_date: item.lastPaymentDate || null,
        balance_amount: item.balanceAmount || null,
        original_amount: item.originalAmount || null,
        credit_limit: item.creditLimit || null,
        monthly_payment: item.monthlyPayment || null,
        is_paid: item.isPaid || false,
        is_disputed: item.isDisputed || false,
        is_verified: item.isVerified || false,
        dispute_status: item.disputeStatus || null,
        compliance_violations: item.complianceViolations || null,
        violation_details: item.violationDetails || null,
        raw_text: item.rawText || null,
        page_number: item.pageNumber || null,
        confidence_score: item.confidenceScore || null,
        parsing_method: item.parsingMethod || 'manual',
        parsed_by_user_id: member.id,
        review_status: item.reviewStatus || 'pending',
        review_notes: item.reviewNotes || null,
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating negative item:', error);
      throw new Error(`Failed to create item: ${error.message}`);
    }

    return this.mapNegativeItemFromDb(data);
  }

  /**
   * Update a negative item
   */
  static async updateNegativeItem(
    itemId: string,
    updates: Partial<Omit<NegativeItem, 'id' | 'creditProfileId' | 'createdAt' | 'updatedAt'>>
  ): Promise<NegativeItem> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the item
    const { data: existingItem, error: fetchError } = await supabase
      .from('credit_negatives')
      .select('credit_profile_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !existingItem) {
      throw new Error('Item not found');
    }

    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== existingItem.credit_profile_id) {
      throw new Error('Forbidden');
    }

    const updateData: any = {};
    if (updates.bureau !== undefined) updateData.bureau = updates.bureau;
    if (updates.itemType !== undefined) updateData.item_type = updates.itemType;
    if (updates.itemSubtype !== undefined) updateData.item_subtype = updates.itemSubtype;
    if (updates.itemStatus !== undefined) updateData.item_status = updates.itemStatus;
    if (updates.accountName !== undefined) updateData.account_name = updates.accountName;
    if (updates.accountNumber !== undefined) updateData.account_number = updates.accountNumber;
    if (updates.creditorName !== undefined) updateData.creditor_name = updates.creditorName;
    if (updates.originalCreditor !== undefined) updateData.original_creditor = updates.originalCreditor;
    if (updates.collectionAgency !== undefined) updateData.collection_agency = updates.collectionAgency;
    if (updates.dateOpened !== undefined) updateData.date_opened = updates.dateOpened;
    if (updates.dateReported !== undefined) updateData.date_reported = updates.dateReported;
    if (updates.dateOfFirstDelinquency !== undefined) updateData.date_of_first_delinquency = updates.dateOfFirstDelinquency;
    if (updates.dateClosed !== undefined) updateData.date_closed = updates.dateClosed;
    if (updates.lastPaymentDate !== undefined) updateData.last_payment_date = updates.lastPaymentDate;
    if (updates.balanceAmount !== undefined) updateData.balance_amount = updates.balanceAmount;
    if (updates.originalAmount !== undefined) updateData.original_amount = updates.originalAmount;
    if (updates.creditLimit !== undefined) updateData.credit_limit = updates.creditLimit;
    if (updates.monthlyPayment !== undefined) updateData.monthly_payment = updates.monthlyPayment;
    if (updates.isPaid !== undefined) updateData.is_paid = updates.isPaid;
    if (updates.isDisputed !== undefined) updateData.is_disputed = updates.isDisputed;
    if (updates.isVerified !== undefined) updateData.is_verified = updates.isVerified;
    if (updates.disputeStatus !== undefined) updateData.dispute_status = updates.disputeStatus;
    if (updates.complianceViolations !== undefined) updateData.compliance_violations = updates.complianceViolations;
    if (updates.violationDetails !== undefined) updateData.violation_details = updates.violationDetails;
    if (updates.rawText !== undefined) updateData.raw_text = updates.rawText;
    if (updates.pageNumber !== undefined) updateData.page_number = updates.pageNumber;
    if (updates.confidenceScore !== undefined) updateData.confidence_score = updates.confidenceScore;
    if (updates.parsingMethod !== undefined) updateData.parsing_method = updates.parsingMethod;
    if (updates.reviewStatus !== undefined) updateData.review_status = updates.reviewStatus;
    if (updates.reviewNotes !== undefined) updateData.review_notes = updates.reviewNotes;

    const { data, error } = await supabase
      .from('credit_negatives')
      .update(updateData)
      .eq('id', itemId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating negative item:', error);
      throw new Error(`Failed to update item: ${error.message}`);
    }

    return this.mapNegativeItemFromDb(data);
  }

  /**
   * Delete a negative item
   */
  static async deleteNegativeItem(itemId: string): Promise<void> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the item
    const { data: existingItem, error: fetchError } = await supabase
      .from('credit_negatives')
      .select('credit_profile_id')
      .eq('id', itemId)
      .single();

    if (fetchError || !existingItem) {
      throw new Error('Item not found');
    }

    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== existingItem.credit_profile_id) {
      throw new Error('Forbidden');
    }

    const { error } = await supabase
      .from('credit_negatives')
      .delete()
      .eq('id', itemId);

    if (error) {
      console.error('Error deleting negative item:', error);
      const errorMessage = error.message || error.details || JSON.stringify(error);
      throw new Error(`Failed to delete item: ${errorMessage}`);
    }
  }

  /**
   * Get credit letters for a profile
   */
  static async getCreditLetters(creditProfileId: string): Promise<CreditLetter[]> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data, error } = await supabase
      .from('credit_letters')
      .select('*')
      .eq('credit_profile_id', creditProfileId)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching credit letters:', error);
      throw new Error(`Failed to fetch letters: ${error.message}`);
    }

    return (data || []).map(item => this.mapCreditLetterFromDb(item));
  }

  /**
   * Create a credit letter
   */
  static async createCreditLetter(
    creditProfileId: string,
    bureau: 'experian' | 'equifax' | 'transunion',
    letterType: 'sent' | 'received',
    data: {
      subject?: string;
      content?: string;
      storagePath?: string;
      sentAt?: string;
      receivedAt?: string;
      status?: 'draft' | 'sent' | 'received' | 'archived';
    }
  ): Promise<CreditLetter> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the profile
    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== creditProfileId) {
      throw new Error('Forbidden');
    }

    const { data: letter, error } = await supabase
      .from('credit_letters')
      .insert({
        credit_profile_id: creditProfileId,
        bureau,
        letter_type: letterType,
        subject: data.subject || null,
        content: data.content || null,
        storage_path: data.storagePath || null,
        sent_at: data.sentAt || null,
        received_at: data.receivedAt || null,
        status: data.status || (letterType === 'sent' ? 'sent' : 'received'),
      })
      .select('*')
      .single();

    if (error) {
      console.error('Error creating credit letter:', error);
      throw new Error(`Failed to create letter: ${error.message}`);
    }

    return this.mapCreditLetterFromDb(letter);
  }

  /**
   * Update a credit letter
   */
  static async updateCreditLetter(
    letterId: string,
    updates: {
      bureau?: 'experian' | 'equifax' | 'transunion';
      letterType?: 'sent' | 'received';
      subject?: string;
      content?: string;
      storagePath?: string;
      sentAt?: string;
      receivedAt?: string;
      status?: 'draft' | 'sent' | 'received' | 'archived';
    }
  ): Promise<CreditLetter> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the letter
    const { data: existingLetter, error: fetchError } = await supabase
      .from('credit_letters')
      .select('credit_profile_id')
      .eq('id', letterId)
      .single();

    if (fetchError || !existingLetter) {
      throw new Error('Letter not found');
    }

    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== existingLetter.credit_profile_id) {
      throw new Error('Forbidden');
    }

    const updateData: any = {};
    if (updates.bureau !== undefined) updateData.bureau = updates.bureau;
    if (updates.letterType !== undefined) updateData.letter_type = updates.letterType;
    if (updates.subject !== undefined) updateData.subject = updates.subject || null;
    if (updates.content !== undefined) updateData.content = updates.content || null;
    if (updates.storagePath !== undefined) updateData.storage_path = updates.storagePath || null;
    if (updates.sentAt !== undefined) updateData.sent_at = updates.sentAt || null;
    if (updates.receivedAt !== undefined) updateData.received_at = updates.receivedAt || null;
    if (updates.status !== undefined) updateData.status = updates.status;

    const { data, error } = await supabase
      .from('credit_letters')
      .update(updateData)
      .eq('id', letterId)
      .select('*')
      .single();

    if (error) {
      console.error('Error updating credit letter:', error);
      throw new Error(`Failed to update letter: ${error.message}`);
    }

    return this.mapCreditLetterFromDb(data);
  }

  /**
   * Delete a credit letter
   */
  static async deleteCreditLetter(letterId: string): Promise<void> {
    const member = await MemberService.getCurrentMember();
    if (!member) {
      throw new Error('User not authenticated');
    }

    // Verify user owns the letter
    const { data: existingLetter, error: fetchError } = await supabase
      .from('credit_letters')
      .select('credit_profile_id')
      .eq('id', letterId)
      .single();

    if (fetchError || !existingLetter) {
      throw new Error('Letter not found');
    }

    const profile = await this.getCreditProfile();
    if (!profile || profile.id !== existingLetter.credit_profile_id) {
      throw new Error('Forbidden');
    }

    const { error } = await supabase
      .from('credit_letters')
      .delete()
      .eq('id', letterId);

    if (error) {
      console.error('Error deleting credit letter:', error);
      throw new Error(`Failed to delete letter: ${error.message}`);
    }
  }

  /**
   * Legacy method: Submit a credit restoration request (for backward compatibility)
   * Creates profile and uploads reports
   */
  static async submitRestorationRequest(request: CreditRestorationRequest): Promise<string> {
    // Create profile
    const profile = await this.createCreditProfile(request.identityDetails);

    // Upload reports
    const reportPromises = [
      request.reports.experian.url && this.uploadCreditReport(
        profile.id,
        'experian',
        request.reports.experian.url,
        request.reports.experian.fileName,
        request.reports.experian.fileSize
      ),
      request.reports.equifax.url && this.uploadCreditReport(
        profile.id,
        'equifax',
        request.reports.equifax.url,
        request.reports.equifax.fileName,
        request.reports.equifax.fileSize
      ),
      request.reports.transunion.url && this.uploadCreditReport(
        profile.id,
        'transunion',
        request.reports.transunion.url,
        request.reports.transunion.fileName,
        request.reports.transunion.fileSize
      ),
    ].filter(Boolean);

    await Promise.allSettled(reportPromises);

    // Trigger parsing (async, non-blocking)
    this.parseAllReports(profile.id, request.reports).catch(err => {
      console.error('Error parsing reports:', err);
    });

    return profile.id;
  }

  /**
   * Parse all credit reports for a profile
   */
  private static async parseAllReports(
    creditProfileId: string,
    reports: CreditRestorationRequest['reports']
  ): Promise<void> {
    const parsePromises = [
      reports.experian.url && fetch('/api/credit/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditProfileId,
          reportUrl: reports.experian.url,
          bureau: 'experian',
          method: 'hybrid',
        }),
      }),
      reports.equifax.url && fetch('/api/credit/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditProfileId,
          reportUrl: reports.equifax.url,
          bureau: 'equifax',
          method: 'hybrid',
        }),
      }),
      reports.transunion.url && fetch('/api/credit/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          creditProfileId,
          reportUrl: reports.transunion.url,
          bureau: 'transunion',
          method: 'hybrid',
        }),
      }),
    ].filter(Boolean);

    await Promise.allSettled(parsePromises);
  }

  // Helper methods to map database rows to TypeScript interfaces
  private static mapCreditProfileFromDb(data: any): CreditProfile {
    return {
      id: data.id,
      memberId: data.member_id,
      firstName: data.first_name,
      lastName: data.last_name,
      middleName: data.middle_name,
      dateOfBirth: data.date_of_birth,
      ssn: data.ssn,
      email: data.email,
      phone: data.phone,
      address: {
        street: data.address.street,
        city: data.address.city,
        state: data.address.state,
        zipCode: data.address.zip_code,
      },
      previousAddresses: data.previous_addresses?.map((addr: any) => ({
        street: addr.street,
        city: addr.city,
        state: addr.state,
        zipCode: addr.zip_code,
        yearsAtAddress: addr.years_at_address,
      })),
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapCreditReportFromDb(data: any): CreditReport {
    return {
      id: data.id,
      creditProfileId: data.credit_profile_id,
      bureau: data.bureau,
      storagePath: data.storage_path,
      fileName: data.file_name,
      fileSize: data.file_size,
      uploadedAt: data.uploaded_at,
      parsedAt: data.parsed_at,
      parsingStatus: data.parsing_status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapCreditLetterFromDb(data: any): CreditLetter {
    return {
      id: data.id,
      creditProfileId: data.credit_profile_id,
      bureau: data.bureau,
      letterType: data.letter_type,
      subject: data.subject,
      content: data.content,
      storagePath: data.storage_path,
      sentAt: data.sent_at,
      receivedAt: data.received_at,
      status: data.status,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }

  private static mapNegativeItemFromDb(data: any): NegativeItem {
    return {
      id: data.id,
      creditProfileId: data.credit_profile_id,
      bureau: data.bureau,
      itemType: data.item_type,
      itemSubtype: data.item_subtype,
      itemStatus: data.item_status,
      accountName: data.account_name,
      accountNumber: data.account_number,
      creditorName: data.creditor_name,
      originalCreditor: data.original_creditor,
      collectionAgency: data.collection_agency,
      dateOpened: data.date_opened,
      dateReported: data.date_reported,
      dateOfFirstDelinquency: data.date_of_first_delinquency,
      dateClosed: data.date_closed,
      lastPaymentDate: data.last_payment_date,
      balanceAmount: data.balance_amount,
      originalAmount: data.original_amount,
      creditLimit: data.credit_limit,
      monthlyPayment: data.monthly_payment,
      isPaid: data.is_paid,
      isDisputed: data.is_disputed,
      isVerified: data.is_verified,
      disputeStatus: data.dispute_status,
      complianceViolations: data.compliance_violations,
      violationDetails: data.violation_details,
      rawText: data.raw_text,
      pageNumber: data.page_number,
      confidenceScore: data.confidence_score,
      parsingMethod: data.parsing_method,
      parsedByUserId: data.parsed_by_user_id,
      parsedAt: data.parsed_at,
      reviewStatus: data.review_status,
      reviewedByUserId: data.reviewed_by_user_id,
      reviewedAt: data.reviewed_at,
      reviewNotes: data.review_notes,
      createdAt: data.created_at,
      updatedAt: data.updated_at,
    };
  }
}

