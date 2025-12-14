import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  AnalyticsEvent, 
  AnalyticsMetrics, 
  AnalyticsInsight, 
  AnalyticsConfig,
  AIRequestMetrics,
  DEFAULT_ANALYTICS_CONFIG 
} from '../models/analytics.model';

@Injectable({
  providedIn: 'root'
})
export class AnalyticsService {
  private config: AnalyticsConfig = DEFAULT_ANALYTICS_CONFIG;
  private events: AnalyticsEvent[] = [];
  private sessionId = this.generateId();
  private sessionStart = Date.now();

  private eventsSubject = new BehaviorSubject<AnalyticsEvent[]>([]);
  events$ = this.eventsSubject.asObservable();

  constructor(private aiClient: AIClientService) {
    this.loadFromStorage();
  }

  configure(config: Partial<AnalyticsConfig>): void {
    this.config = { ...DEFAULT_ANALYTICS_CONFIG, ...config };
  }

  /**
   * Track an event
   */
  track(type: AnalyticsEvent['type'], name: string, data?: Record<string, any>): void {
    if (!this.config.enabled) return;

    const event: AnalyticsEvent = {
      id: this.generateId(),
      type,
      name,
      data,
      timestamp: new Date(),
      sessionId: this.sessionId
    };

    this.events.push(event);
    
    // Trim events if exceeding max
    if (this.events.length > (this.config.maxEvents || 1000)) {
      this.events = this.events.slice(-this.config.maxEvents!);
    }

    this.eventsSubject.next([...this.events]);
    this.saveToStorage();
  }

  /**
   * Track AI request
   */
  trackAIRequest(provider: string, success: boolean, responseTime: number, tokens?: number): void {
    if (!this.config.trackAIRequests) return;

    this.track('ai_request', 'ai_request', {
      provider,
      success,
      responseTime,
      tokens
    });
  }

  /**
   * Track page view
   */
  trackPageView(path: string, title?: string): void {
    if (!this.config.trackPageViews) return;
    this.track('page_view', 'page_view', { path, title });
  }

  /**
   * Track user interaction
   */
  trackInteraction(element: string, action: string, data?: Record<string, any>): void {
    if (!this.config.trackInteractions) return;
    this.track('interaction', `${element}_${action}`, data);
  }

  /**
   * Get analytics metrics
   */
  getMetrics(): AnalyticsMetrics {
    const eventsByType: Record<string, number> = {};
    
    for (const event of this.events) {
      eventsByType[event.type] = (eventsByType[event.type] || 0) + 1;
    }

    return {
      totalEvents: this.events.length,
      eventsByType,
      aiMetrics: this.getAIMetrics(),
      sessionDuration: Date.now() - this.sessionStart,
      pageViews: eventsByType['page_view'] || 0
    };
  }

  /**
   * Get AI-specific metrics
   */
  getAIMetrics(): AIRequestMetrics {
    const aiEvents = this.events.filter(e => e.type === 'ai_request');
    const requestsByProvider: Record<string, number> = {};
    let totalResponseTime = 0;
    let totalTokens = 0;
    let successCount = 0;

    for (const event of aiEvents) {
      const data = event.data || {};
      requestsByProvider[data['provider']] = (requestsByProvider[data['provider']] || 0) + 1;
      totalResponseTime += data['responseTime'] || 0;
      totalTokens += data['tokens'] || 0;
      if (data['success']) successCount++;
    }

    return {
      totalRequests: aiEvents.length,
      successfulRequests: successCount,
      failedRequests: aiEvents.length - successCount,
      averageResponseTime: aiEvents.length > 0 ? totalResponseTime / aiEvents.length : 0,
      totalTokens,
      requestsByProvider
    };
  }

  /**
   * Generate AI-powered insights
   */
  generateInsights(): Observable<AnalyticsInsight[]> {
    if (!this.config.aiInsights || this.events.length < 10) {
      return of([]);
    }

    const metrics = this.getMetrics();
    const prompt = `Analyze these analytics metrics and provide insights:
${JSON.stringify(metrics, null, 2)}

Provide 3-5 insights in JSON format:
[{"type": "trend|anomaly|recommendation|summary", "title": "...", "description": "...", "confidence": 0.9}]`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseInsights(response as string)),
      catchError(() => of([]))
    );
  }

  /**
   * Clear all events
   */
  clearEvents(): void {
    this.events = [];
    this.eventsSubject.next([]);
    this.saveToStorage();
  }

  private parseInsights(response: string): AnalyticsInsight[] {
    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.map((item: any, index: number) => ({
          id: `insight_${Date.now()}_${index}`,
          ...item,
          generatedAt: new Date()
        }));
      }
    } catch {}
    return [];
  }

  private generateId(): string {
    return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private saveToStorage(): void {
    if (typeof localStorage !== 'undefined' && this.config.storageKey) {
      localStorage.setItem(this.config.storageKey, JSON.stringify(this.events));
    }
  }

  private loadFromStorage(): void {
    if (typeof localStorage !== 'undefined' && this.config.storageKey) {
      try {
        const stored = localStorage.getItem(this.config.storageKey);
        if (stored) {
          this.events = JSON.parse(stored);
          this.eventsSubject.next([...this.events]);
        }
      } catch {}
    }
  }
}

