/**
 * Performance Monitoring Utilities
 * 
 * Tracks page load times, auth check duration, and other performance metrics
 */

interface PerformanceMetric {
  name: string;
  value: number;
  timestamp: number;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private readonly maxMetrics = 100;

  /**
   * Record a performance metric
   */
  record(name: string, value: number, metadata?: Record<string, unknown>): void {
    if (typeof window === 'undefined') {
      // Server-side: log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.log(`[Performance] ${name}: ${value}ms`, metadata || '');
      }
      return;
    }

    const metric: PerformanceMetric = {
      name,
      value,
      timestamp: Date.now(),
      metadata,
    };

    this.metrics.push(metric);

    // Keep only the most recent metrics
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }

    // Send to analytics in production
    if (process.env.NODE_ENV === 'production' && typeof window !== 'undefined') {
      this.sendToAnalytics(metric);
    }
  }

  /**
   * Measure async function execution time
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    metadata?: Record<string, unknown>
  ): Promise<T> {
    const start = performance.now();
    try {
      const result = await fn();
      const duration = performance.now() - start;
      this.record(name, duration, metadata);
      return result;
    } catch (error) {
      const duration = performance.now() - start;
      this.record(`${name}_error`, duration, { ...metadata, error: String(error) });
      throw error;
    }
  }

  /**
   * Get all metrics
   */
  getMetrics(): PerformanceMetric[] {
    return [...this.metrics];
  }

  /**
   * Get metrics by name
   */
  getMetricsByName(name: string): PerformanceMetric[] {
    return this.metrics.filter(m => m.name === name);
  }

  /**
   * Get average value for a metric
   */
  getAverage(name: string): number {
    const metrics = this.getMetricsByName(name);
    if (metrics.length === 0) return 0;
    const sum = metrics.reduce((acc, m) => acc + m.value, 0);
    return sum / metrics.length;
  }

  /**
   * Clear all metrics
   */
  clear(): void {
    this.metrics = [];
  }

  /**
   * Send metric to analytics service
   */
  private sendToAnalytics(metric: PerformanceMetric): void {
    // Implement your analytics service here
    // Example: Google Analytics, Sentry, etc.
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'performance', {
        metric_name: metric.name,
        metric_value: metric.value,
        ...metric.metadata,
      });
    }
  }
}

// Singleton instance
export const performanceMonitor = new PerformanceMonitor();

/**
 * Measure page load time
 */
export function measurePageLoad(pageName: string): void {
  if (typeof window === 'undefined') return;

  if (document.readyState === 'complete') {
    const loadTime = performance.now();
    performanceMonitor.record('page_load', loadTime, { page: pageName });
  } else {
    window.addEventListener('load', () => {
      const loadTime = performance.now();
      performanceMonitor.record('page_load', loadTime, { page: pageName });
    });
  }
}

/**
 * Measure auth check duration
 */
export async function measureAuthCheck<T>(
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure('auth_check', fn);
}

/**
 * Measure API call duration
 */
export async function measureApiCall<T>(
  endpoint: string,
  fn: () => Promise<T>
): Promise<T> {
  return performanceMonitor.measure('api_call', fn, { endpoint });
}

/**
 * Measure component render time (client-side only)
 */
export function measureComponentRender(componentName: string, renderTime: number): void {
  performanceMonitor.record('component_render', renderTime, { component: componentName });
}

/**
 * React hook for measuring component render time
 */
export function usePerformanceMeasure(componentName: string): void {
  if (typeof window === 'undefined') return;

  const start = performance.now();
  
  if (typeof window !== 'undefined') {
    // Use requestAnimationFrame to measure after render
    requestAnimationFrame(() => {
      const duration = performance.now() - start;
      measureComponentRender(componentName, duration);
    });
  }
}

