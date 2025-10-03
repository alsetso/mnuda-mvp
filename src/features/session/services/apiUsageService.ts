// API Usage tracking service for daily credits management

export interface ApiUsageData {
  date: string; // YYYY-MM-DD format
  creditsUsed: number;
  lastReset: number; // timestamp
}

export interface ApiUsageState {
  creditsRemaining: number;
  creditsUsed: number;
  totalCredits: number;
  resetDate: string;
  isLimitReached: boolean;
  isAuthenticated: boolean;
  hasUnlimitedCredits: boolean;
}

class ApiUsageService {
  private readonly STORAGE_KEY = 'freemap_api_usage';
  private readonly DAILY_CREDITS = 100;
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
      };
    }

    // For anonymous users, use the existing logic
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
   * Record an API request (consume 1 credit)
   */
  recordApiRequest(): boolean {
    // For authenticated users, always allow the request but still track usage
    if (this.isUserAuthenticated) {
      const usageData = this.getUsageData();
      const updatedUsage: ApiUsageData = {
        ...usageData,
        creditsUsed: usageData.creditsUsed + 1,
        lastReset: Date.now(),
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

    const usageData = this.getUsageData();
    const updatedUsage: ApiUsageData = {
      ...usageData,
      creditsUsed: usageData.creditsUsed + 1,
      lastReset: Date.now(),
    };

    this.saveUsageData(updatedUsage);
    return true;
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
   * Get usage data from localStorage
   */
  private getUsageData(): ApiUsageData {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        return JSON.parse(stored);
      }
    } catch (error) {
      console.warn('Failed to parse API usage data:', error);
    }

    // Return default data
    return {
      date: this.getTodayString(),
      creditsUsed: 0,
      lastReset: Date.now(),
    };
  }

  /**
   * Save usage data to localStorage
   */
  private saveUsageData(data: ApiUsageData): void {
    try {
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save API usage data:', error);
    }
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
   * Clear all usage data (for testing/admin purposes)
   */
  clearUsageData(): void {
    localStorage.removeItem(this.STORAGE_KEY);
  }
}

// Export singleton instance
export const apiUsageService = new ApiUsageService();
