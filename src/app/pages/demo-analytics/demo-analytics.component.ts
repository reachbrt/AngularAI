import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AnalyticsDashboardComponent, AnalyticsService } from '@angularai/analytics';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-analytics',
  standalone: true,
  imports: [CommonModule, RouterLink, AnalyticsDashboardComponent, APIKeyWarningComponent],
  templateUrl: './demo-analytics.component.html',
  styleUrl: './demo-analytics.component.scss'
})
export class DemoAnalyticsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

  constructor(
    private analyticsService: AnalyticsService,
    private apiKeyService: APIKeyService
  ) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });

    // Track some demo events (only if API key is configured)
    if (this.hasAPIKey) {
      this.analyticsService.trackPageView('/demo/analytics', 'Analytics Demo');
      this.analyticsService.trackInteraction('button', 'click', { button: 'demo_button' });
      this.analyticsService.track('custom', 'form_submit', { form: 'contact' });
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  trackEvent(): void {
    if (!this.hasAPIKey) return;
    this.analyticsService.track('custom', 'demo_event', {
      timestamp: new Date().toISOString(),
      random: Math.random()
    });
  }
}

