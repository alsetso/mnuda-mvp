/**
 * Credit Report Parser Service
 * 
 * This service handles parsing credit reports (PDFs) to extract negative items.
 * Supports both manual parsing and AI-assisted parsing.
 */

import { supabase } from '@/lib/supabase';
import type { NegativeItem, ParsedCreditReport } from '../types';

export class CreditReportParser {
  /**
   * Parse a credit report PDF and extract negative items
   * 
   * @param reportUrl - URL of the uploaded credit report PDF
   * @param bureau - Credit bureau (experian, equifax, transunion)
   * @param creditProfileId - Credit profile ID
   * @param method - Parsing method: 'manual', 'ai', or 'hybrid'
   */
  static async parseReport(
    reportUrl: string,
    bureau: 'experian' | 'equifax' | 'transunion',
    creditProfileId: string,
    method: 'manual' | 'ai' | 'hybrid' = 'hybrid'
  ): Promise<ParsedCreditReport> {
    // Step 1: Extract text from PDF
    const extractedText = await this.extractTextFromPDF(reportUrl);

    // Step 2: Parse based on method
    let negativeItems: NegativeItem[] = [];

    if (method === 'ai' || method === 'hybrid') {
      // AI-assisted parsing
      const aiItems = await this.parseWithAI(extractedText, bureau);
      negativeItems = aiItems;
    }

    if (method === 'manual' || method === 'hybrid') {
      // Manual parsing (fallback or verification)
      const manualItems = await this.parseManually(extractedText, bureau);
      
      if (method === 'hybrid') {
        // Merge AI and manual results, prioritize manual for conflicts
        negativeItems = this.mergeParsingResults(aiItems, manualItems);
      } else {
        negativeItems = manualItems;
      }
    }

    // Step 3: Classify and store negative items
    const classifiedItems = await this.classifyAndStoreItems(
      negativeItems,
      bureau,
      creditProfileId,
      method
    );

    return {
      bureau,
      totalItems: classifiedItems.length,
      items: classifiedItems,
      parsingMethod: method,
      parsedAt: new Date().toISOString(),
    };
  }

  /**
   * Extract text from PDF using PDF parsing library
   */
  private static async extractTextFromPDF(pdfUrl: string): Promise<string> {
    // This would use a PDF parsing library like pdf-parse or pdfjs-dist
    // For now, returning a placeholder structure
    
    // In production, you would:
    // 1. Download the PDF from storage
    // 2. Use pdf-parse or similar to extract text
    // 3. Return structured text with page numbers
    
    throw new Error('PDF text extraction not yet implemented. Use a library like pdf-parse.');
  }

  /**
   * Parse credit report using AI/ML
   * 
   * This method uses AI to identify and classify negative items
   */
  private static async parseWithAI(
    extractedText: string,
    bureau: 'experian' | 'equifax' | 'transunion'
  ): Promise<NegativeItem[]> {
    // Option 1: Use OpenAI GPT-4 with structured output
    // Option 2: Use a specialized credit report parsing API
    // Option 3: Use a fine-tuned model for credit reports
    
    // Example using OpenAI (you'll need to set up the API key)
    try {
      const response = await fetch('/api/credit/parse-ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: extractedText,
          bureau,
        }),
      });

      if (!response.ok) {
        throw new Error('AI parsing failed');
      }

      const data = await response.json();
      return data.items || [];
    } catch (error) {
      console.error('AI parsing error:', error);
      return [];
    }
  }

  /**
   * Manual parsing using regex patterns and heuristics
   * 
   * This method uses pattern matching to identify negative items
   */
  private static async parseManually(
    extractedText: string,
    bureau: 'experian' | 'equifax' | 'transunion'
  ): Promise<NegativeItem[]> {
    const items: NegativeItem[] = [];

    // Pattern matching for different negative item types
    const patterns = this.getParsingPatterns(bureau);

    for (const pattern of patterns) {
      const matches = extractedText.matchAll(new RegExp(pattern.regex, 'gi'));
      
      for (const match of matches) {
        const item = this.extractItemFromMatch(match, pattern);
        if (item) {
          items.push(item);
        }
      }
    }

    return items;
  }

  /**
   * Get regex patterns for parsing different bureaus
   */
  private static getParsingPatterns(bureau: 'experian' | 'equifax' | 'transunion') {
    // These patterns would be specific to each bureau's format
    // This is a simplified example
    
    return [
      {
        type: 'COLLECTION' as const,
        regex: /collection|collected|debt collection/gi,
        extractors: {
          accountName: /account[:\s]+([^\n]+)/i,
          amount: /\$?([\d,]+\.?\d*)/,
          date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        },
      },
      {
        type: 'LATE_PAYMENT' as const,
        regex: /late payment|past due|delinquent/gi,
        extractors: {
          daysLate: /(\d+)\s*days?\s*late/i,
          date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        },
      },
      {
        type: 'CHARGE_OFF' as const,
        regex: /charge.?off|charged off/gi,
        extractors: {
          accountName: /account[:\s]+([^\n]+)/i,
          amount: /\$?([\d,]+\.?\d*)/,
        },
      },
      {
        type: 'BANKRUPTCY' as const,
        regex: /bankruptcy|chapter\s*[7-9]|ch\s*[7-9]/gi,
        extractors: {
          chapter: /chapter\s*([7-9]|11|12|13)/i,
          date: /(\d{1,2}\/\d{1,2}\/\d{2,4})/,
        },
      },
      // Add more patterns for other negative item types
    ];
  }

  /**
   * Extract item details from regex match
   */
  private static extractItemFromMatch(
    match: RegExpMatchArray,
    pattern: any
  ): NegativeItem | null {
    // Extract structured data from the match
    // This is simplified - in production, you'd have more sophisticated extraction
    
    return {
      itemType: pattern.type,
      itemSubtype: null, // Would be determined by more specific patterns
      itemStatus: 'DEROGATORY' as const,
      rawText: match[0],
      confidenceScore: 0.7, // Manual parsing has lower confidence
      // ... other fields extracted from match
    } as NegativeItem;
  }

  /**
   * Merge AI and manual parsing results
   */
  private static mergeParsingResults(
    aiItems: NegativeItem[],
    manualItems: NegativeItem[]
  ): NegativeItem[] {
    // Merge results, prioritizing manual for conflicts
    // Use AI for items manual parsing missed
    // Use manual for verification of AI items
    
    const merged: NegativeItem[] = [];
    const seen = new Set<string>();

    // Add manual items first (higher priority)
    for (const item of manualItems) {
      const key = this.getItemKey(item);
      if (!seen.has(key)) {
        merged.push({ ...item, confidenceScore: Math.max(item.confidenceScore || 0, 0.8) });
        seen.add(key);
      }
    }

    // Add AI items that weren't found manually
    for (const item of aiItems) {
      const key = this.getItemKey(item);
      if (!seen.has(key)) {
        merged.push(item);
        seen.add(key);
      }
    }

    return merged;
  }

  /**
   * Generate a unique key for an item (for deduplication)
   */
  private static getItemKey(item: NegativeItem): string {
    return `${item.itemType}-${item.accountNumber || item.accountName || ''}-${item.dateReported || ''}`;
  }

  /**
   * Classify items using enums and store in database
   */
  private static async classifyAndStoreItems(
    items: NegativeItem[],
    bureau: 'experian' | 'equifax' | 'transunion',
    creditProfileId: string,
    method: 'manual' | 'ai' | 'hybrid'
  ): Promise<NegativeItem[]> {
    const classifiedItems = items.map(item => {
      // Classify subtype based on item details
      const subtype = this.classifySubtype(item);
      
      // Classify status based on item details
      const status = this.classifyStatus(item);

      return {
        ...item,
        itemSubtype: subtype,
        itemStatus: status,
        creditProfileId,
      };
    });

    // Store in database
    const { data, error } = await supabase
      .from('credit_negatives')
      .insert(
        classifiedItems.map(item => ({
          credit_profile_id: creditProfileId,
          bureau,
          item_type: item.itemType,
          item_subtype: item.itemSubtype,
          item_status: item.itemStatus,
          account_name: item.accountName,
          account_number: item.accountNumber,
          creditor_name: item.creditorName,
          original_creditor: item.originalCreditor,
          collection_agency: item.collectionAgency,
          date_opened: item.dateOpened,
          date_reported: item.dateReported,
          date_of_first_delinquency: item.dateOfFirstDelinquency,
          date_closed: item.dateClosed,
          last_payment_date: item.lastPaymentDate,
          balance_amount: item.balanceAmount,
          original_amount: item.originalAmount,
          credit_limit: item.creditLimit,
          monthly_payment: item.monthlyPayment,
          is_paid: item.isPaid,
          is_disputed: item.isDisputed,
          is_verified: item.isVerified,
          dispute_status: item.disputeStatus,
          compliance_violations: item.complianceViolations,
          violation_details: item.violationDetails,
          raw_text: item.rawText,
          page_number: item.pageNumber,
          confidence_score: item.confidenceScore,
          parsing_method: method,
        }))
      )
      .select();

    if (error) {
      console.error('Error storing negative items:', error);
      throw new Error(`Failed to store items: ${error.message}`);
    }

    return data || [];
  }

  /**
   * Classify item subtype based on item details
   */
  private static classifySubtype(item: NegativeItem): string | null {
    // Logic to determine subtype based on item type and details
    // This would use the negative_item_subtype enum
    
    if (item.itemType === 'LATE_PAYMENT') {
      // Determine days late from item details
      if (item.daysLate) {
        if (item.daysLate <= 30) return 'LATE_30';
        if (item.daysLate <= 60) return 'LATE_60';
        if (item.daysLate <= 90) return 'LATE_90';
        if (item.daysLate <= 120) return 'LATE_120';
        if (item.daysLate <= 150) return 'LATE_150';
        if (item.daysLate <= 180) return 'LATE_180';
        return 'LATE_180_PLUS';
      }
    }

    if (item.itemType === 'COLLECTION') {
      if (item.isPaid) return 'PAID_COLLECTION';
      if (item.collectionAgency) return 'ASSIGNED_COLLECTION';
      // Determine collection type from account name
      if (item.accountName?.toLowerCase().includes('medical')) return 'MEDICAL_COLLECTION';
      if (item.accountName?.toLowerCase().includes('utility')) return 'UTILITY_COLLECTION';
      return 'UNPAID_COLLECTION';
    }

    if (item.itemType === 'BANKRUPTCY') {
      // Extract chapter from raw text
      const chapterMatch = item.rawText?.match(/chapter\s*([7-9]|11|12|13)/i);
      if (chapterMatch) {
        const chapter = chapterMatch[1];
        if (chapter === '7') return 'BANKRUPTCY_CH7';
        if (chapter === '13') return 'BANKRUPTCY_CH13';
        if (chapter === '11') return 'BANKRUPTCY_CH11';
        if (chapter === '12') return 'BANKRUPTCY_CH12';
      }
    }

    // Add more classification logic for other types
    return null;
  }

  /**
   * Classify item status based on item details
   */
  private static classifyStatus(item: NegativeItem): string {
    // Determine status from item details
    if (item.isPaid) {
      if (item.itemType === 'COLLECTION') return 'PAID_COLLECTION';
      if (item.itemType === 'CHARGE_OFF') return 'PAID_CHARGE_OFF';
      return 'PAID';
    }

    if (item.isDisputed) return 'DISPUTE';

    if (item.itemType === 'COLLECTION') return 'COLLECTION';
    if (item.itemType === 'CHARGE_OFF') return 'CHARGE_OFF';
    if (item.itemType === 'LATE_PAYMENT') return 'PAST_DUE';

    return 'DEROGATORY';
  }
}

