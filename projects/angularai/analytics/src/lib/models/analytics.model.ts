/**
 * Analytics event
 */
export interface AnalyticsEvent {
  /** Event ID */
  id: string;
  /** Event type */
  type: 'interaction' | 'ai_request' | 'page_view' | 'error' | 'custom';
  /** Event name */
  name: string;
  /** Event data */
  data?: Record<string, any>;
  /** Timestamp */
  timestamp: Date;
  /** Session ID */
  sessionId?: string;
  /** User ID */
  userId?: string;
}

/**
 * Analytics metrics
 */
export interface AnalyticsMetrics {
  /** Total events */
  totalEvents: number;
  /** Events by type */
  eventsByType: Record<string, number>;
  /** AI request metrics */
  aiMetrics: AIRequestMetrics;
  /** Session duration */
  sessionDuration: number;
  /** Page views */
  pageViews: number;
}

/**
 * AI request metrics
 */
export interface AIRequestMetrics {
  /** Total AI requests */
  totalRequests: number;
  /** Successful requests */
  successfulRequests: number;
  /** Failed requests */
  failedRequests: number;
  /** Average response time (ms) */
  averageResponseTime: number;
  /** Total tokens used */
  totalTokens: number;
  /** Requests by provider */
  requestsByProvider: Record<string, number>;
}

/**
 * AI-generated insight
 */
export interface AnalyticsInsight {
  /** Insight ID */
  id: string;
  /** Insight type */
  type: 'trend' | 'anomaly' | 'recommendation' | 'summary';
  /** Title */
  title: string;
  /** Description */
  description: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Related data */
  data?: Record<string, any>;
  /** Generated timestamp */
  generatedAt: Date;
}

/**
 * Analytics configuration
 */
export interface AnalyticsConfig {
  /** Enable tracking */
  enabled?: boolean;
  /** Track user interactions */
  trackInteractions?: boolean;
  /** Track AI requests */
  trackAIRequests?: boolean;
  /** Track page views */
  trackPageViews?: boolean;
  /** Storage key for local persistence */
  storageKey?: string;
  /** Maximum events to store */
  maxEvents?: number;
  /** Enable AI-powered insights */
  aiInsights?: boolean;
}

/**
 * Default analytics configuration
 */
export const DEFAULT_ANALYTICS_CONFIG: AnalyticsConfig = {
  enabled: true,
  trackInteractions: true,
  trackAIRequests: true,
  trackPageViews: true,
  storageKey: 'angularai_analytics',
  maxEvents: 1000,
  aiInsights: true
};

