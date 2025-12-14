import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { NotificationContainerComponent, SmartNotifyService } from '@angularai/smart-notify';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-smart-notify',
  standalone: true,
  imports: [CommonModule, RouterLink, NotificationContainerComponent, APIKeyWarningComponent],
  templateUrl: './demo-smart-notify.component.html',
  styleUrl: './demo-smart-notify.component.scss'
})
export class DemoSmartNotifyComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

  constructor(
    private notifyService: SmartNotifyService,
    private apiKeyService: APIKeyService
  ) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  showInfo(): void {
    this.notifyService.info('Information', 'This is an informational notification.');
  }

  showSuccess(): void {
    this.notifyService.success('Success!', 'Your action was completed successfully.');
  }

  showWarning(): void {
    this.notifyService.warning('Warning', 'Please review this before continuing.');
  }

  showError(): void {
    this.notifyService.error('Error', 'Something went wrong. Please try again.');
  }

  showAI(): void {
    this.notifyService.ai('AI Insight', 'Based on your activity, you might want to check your settings.', {
      aiContext: 'This suggestion is based on your recent usage patterns.',
      actions: [
        { label: 'View Settings', action: 'settings', primary: true },
        { label: 'Dismiss', action: 'dismiss' }
      ]
    });
  }
}

