// API Usage tracking service for daily credits management

// API pricing configuration
export const API_PRICING = {
  'address': 0.25,
  'name': 0.50,
  'email': 0.50,
  'phone': 0.50,
  'zillow': 1.00,
  'person-id': 2.00
} as const;

export type ApiType = keyof typeof API_PRICING;

export interface ApiUsageData {
  date: string; // YYYY-MM-DD format
  creditsUsed: number; // Total credits used (decimal)
  lastReset: number; // timestamp
  apiUsageHistory: ApiUsageRecord[]; // Track individual API calls
}

export interface ApiUsageRecord {
  timestamp: number;
  apiType: ApiType;
  cost: number;
  success: boolean;
}

export interface ApiUsageState {
  creditsRemaining: number; // Decimal credits remaining
  creditsUsed: number; // Decimal credits used
  totalCredits: number; // Decimal total credits
  resetDate: string;
  isLimitReached: boolean;
  isAuthenticated: boolean;
  hasUnlimitedCredits: boolean;
  apiUsageHistory: ApiUsageRecord[]; // Individual API call history
}

class ApiUsageService {
  private readonly STORAGE_KEY = 'freemap_api_usage';
  private readonly DAILY_CREDITS = 10;
  private isUserAuthenticated = false;

  /**
   * Set authentication state
   */
  setAuthenticationState(isAuthenticated: boolean): void {
    this.isUserAuthenticated = isAuthenticated;
  }

  /**
   * Get current API usage state
   */
  getUsageState(): ApiUsageState {
    const today = this.getTodayString();
    const usageData = this.getUsageData();
    
    // Check if we need to reset for a new day
    if (usageData.date !== today) {
      this.resetDailyUsage();
      return this.getUsageState(); // Recursive call to get fresh data
    }

    // For authenticated users, provide unlimited credits
    if (this.isUserAuthenticated) {
      return {
        creditsRemaining: 999999, // Large number instead of Infinity
        creditsUsed: usageData.creditsUsed,
        totalCredits: 999999,
        resetDate: today,
        isLimitReached: false,
        isAuthenticated: true,
        hasUnlimitedCredits: true,
        apiUsageHistory: usageData.apiUsageHistory || [],
      };
    }

    // For anonymous users, use the existing logic with decimal support
    const creditsRemaining = Math.max(0, this.DAILY_CREDITS - usageData.creditsUsed);
    const isLimitReached = usageData.creditsUsed >= this.DAILY_CREDITS;

    return {
      creditsRemaining,
      creditsUsed: usageData.creditsUsed,
      totalCredits: this.DAILY_CREDITS,
      resetDate: today,
      isLimitReached,
      isAuthenticated: false,
      hasUnlimitedCredits: false,
      apiUsageHistory: usageData.apiUsageHistory || [],
    };
  }

  /**
   * Check if API request can be made (has credits remaining)
   */
  canMakeRequest(): boolean {
    // Authenticated users always can make requests
    if (this.isUserAuthenticated) {
      return true;
    }
    
    const state = this.getUsageState();
    return !state.isLimitReached;
  }

  /**
   * Check if a specific API request can be made (has enough credits for the cost)
   */
  canMakeApiRequest(apiType: ApiType): boolean {
    // Authenticated users always can make requests
    if (this.isUserAuthenticated) {
      return true;
    }
    
    const state = this.getUsageState();
    const cost = API_PRICING[apiType];
    return state.creditsRemaining >= cost;
  }

  /**
   * Record an API request with specific API type and cost
   */
  recordApiRequest(apiType: ApiType, success: boolean = true): boolean {
    const cost = API_PRICING[apiType];
    
    // For authenticated users, always allow the request but still track usage
    if (this.isUserAuthenticated) {
      const usageData = this.getUsageData();
      const updatedUsage: ApiUsageData = {
        ...usageData,
        creditsUsed: usageData.creditsUsed + cost,
        lastReset: Date.now(),
        apiUsageHistory: [
          ...(usageData.apiUsageHistory || []),
          {
            timestamp: Date.now(),
            apiType,
            cost,
            success,
          }
        ],
      };
      this.saveUsageData(updatedUsage);
      return true;
    }

    // For anonymous users, check limits
    const state = this.getUsageState();
    
    if (state.isLimitReached) {
      console.warn('API usage limit reached for today');
      return false;
    }

    // Check if this specific request would exceed the limit
    if (state.creditsRemaining < cost) {
      console.warn(`Insufficient credits for ${apiType} API call (cost: ${cost}, remaining: ${state.creditsRemaining})`);
      return false;
    }

    const usageData = this.getUsageData();
    const updatedUsage: ApiUsageData = {
      ...usageData,
      creditsUsed: usageData.creditsUsed + cost,
      lastReset: Date.now(),
      apiUsageHistory: [
        ...(usageData.apiUsageHistory || []),
        {
          timestamp: Date.now(),
          apiType,
          cost,
          success,
        }
      ],
    };

    this.saveUsageData(updatedUsage);
    return true;
  }

  /**
   * Legacy method for backward compatibility (defaults to address API cost)
   */
  recordApiRequestLegacy(): boolean {
    return this.recordApiRequest('address');
  }

  /**
   * Get remaining credits for display
   */
  getRemainingCredits(): number {
    return this.getUsageState().creditsRemaining;
  }

  /**
   * Check if limit is reached
   */
  isLimitReached(): boolean {
    // Authenticated users never reach limits
    if (this.isUserAuthenticated) {
      return false;
    }
    
    return this.getUsageState().isLimitReached;
  }

  /**
   * Get time until next reset (in milliseconds)
   */
  getTimeUntilReset(): number {
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);
    
    return tomorrow.getTime() - now.getTime();
  }

  /**
   * Format time until reset for display
   */
  getTimeUntilResetFormatted(): string {
    const ms = this.getTimeUntilReset();
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  /**
   * Reset usage for a new day
   */
  private resetDailyUsage(): void {
    const today = this.getTodayString();
    const resetData: ApiUsageData = {
      date: today,
      creditsUsed: 0,
      lastReset: Date.now(),
      apiUsageHistory: [],
    };
    
    this.saveUsageData(resetData);
  }

  /**
   * Get today's date as YYYY-MM-DD string
   */
  private getTodayString(): string {
    return new Date().toISOString().split('T')[0];
  }

  /**
   * Get usage data - STUB (localStorage removed)
   */
  private getUsageData(): ApiUsageData {
    console.warn('ApiUsageService.getUsageData() - localStorage removed, returning default data');
    return {
      date: this.getTodayString(),
      creditsUsed: 0,
      lastReset: Date.now(),
      apiUsageHistory: [],
    };
  }

  /**
   * Save usage data - STUB (localStorage removed)
   */
  private saveUsageData(_data: ApiUsageData): void {
    console.warn('ApiUsageService.saveUsageData() - localStorage removed, no-op');
  }

  /**
   * Get usage history (for debugging/admin purposes)
   */
  getUsageHistory(): ApiUsageData[] {
    // For now, just return current day data
    // Could be extended to track multiple days
    return [this.getUsageData()];
  }

  /**
   * Clear all usage data - STUB (localStorage removed)
   */
  clearUsageData(): void {
    console.warn('ApiUsageService.clearUsageData() - localStorage removed, no-op');
  }

  /**
   * Format credit amount consistently across the app
   */
  formatCredits(amount: number): string {
    return amount % 1 === 0 ? `${amount}.00` : amount.toFixed(2);
  }

  /**
   * Format credit amount with dollar sign
   */
  formatCreditsWithDollar(amount: number): string {
    return `$${this.formatCredits(amount)}`;
  }
}

// Export singleton instance
export const apiUsageService = new ApiUsageService();
