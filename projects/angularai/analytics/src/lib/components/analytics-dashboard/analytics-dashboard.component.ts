import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { AnalyticsService } from '../../services/analytics.service';
import { AnalyticsMetrics, AnalyticsInsight } from '../../models/analytics.model';

@Component({
  selector: 'ai-analytics-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './analytics-dashboard.component.html',
  styleUrl: './analytics-dashboard.component.scss'
})
export class AnalyticsDashboardComponent implements OnInit, OnDestroy {
  metrics: AnalyticsMetrics | null = null;
  insights: AnalyticsInsight[] = [];
  isLoadingInsights = false;

  private destroy$ = new Subject<void>();

  constructor(private analyticsService: AnalyticsService) {}

  ngOnInit(): void {
    this.loadMetrics();
    
    // Subscribe to events to refresh metrics
    this.analyticsService.events$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(() => {
      this.loadMetrics();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  loadMetrics(): void {
    this.metrics = this.analyticsService.getMetrics();
  }

  generateInsights(): void {
    this.isLoadingInsights = true;
    this.analyticsService.generateInsights().subscribe({
      next: (insights) => {
        this.insights = insights;
        this.isLoadingInsights = false;
      },
      error: () => {
        this.isLoadingInsights = false;
      }
    });
  }

  clearData(): void {
    this.analyticsService.clearEvents();
    this.insights = [];
    this.loadMetrics();
  }

  formatDuration(ms: number): string {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  }

  getInsightIcon(type: string): string {
    switch (type) {
      case 'trend': return '📈';
      case 'anomaly': return '⚠️';
      case 'recommendation': return '💡';
      case 'summary': return '📊';
      default: return '📌';
    }
  }
}

