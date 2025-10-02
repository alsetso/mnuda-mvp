'use client';

import { apiService } from './apiService';
import { NodeData } from '@/features/session/services/sessionStorage';
import { MnudaIdService } from '@/features/shared/services/mnudaIdService';

export interface EmailSearchResult {
  success: boolean;
  node?: NodeData;
  error?: string;
}

export class EmailSearchService {
  /**
   * Centralized email search that creates a result node
   */
  static async searchEmail(
    email: string
  ): Promise<EmailSearchResult> {
    try {
      // Call the Skip Trace API
      const response = await apiService.callEmailSearchAPI(email);

      // Create the result node
      const node: NodeData = {
        id: `email-${Date.now()}`,
        type: 'api-result',
        apiName: 'Skip Trace',
        response,
        timestamp: Date.now(),
        mnNodeId: MnudaIdService.generateTypedId('node'),
      };

      return {
        success: true,
        node
      };
    } catch (error) {
      console.error('Email search error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email search failed'
      };
    }
  }

  /**
   * Search email with toast notifications
   */
  static async searchEmailWithToast(
    email: string,
    _sessionId: string,
    withApiToast: (title: string, fn: () => Promise<unknown>, options?: Record<string, unknown>) => Promise<unknown>
  ): Promise<EmailSearchResult> {
    try {
      const result = await withApiToast(
        'Email Search',
        () => this.searchEmail(email),
        {
          loadingMessage: `Searching email: ${email}`,
          successMessage: 'Email search completed successfully',
          errorMessage: 'Failed to search email'
        }
      );

      return result as EmailSearchResult;
    } catch (error) {
      console.error('Email search with toast error:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Email search failed'
      };
    }
  }
}
