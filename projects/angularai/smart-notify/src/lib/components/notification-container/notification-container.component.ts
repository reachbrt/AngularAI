import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { SmartNotifyService } from '../../services/smart-notify.service';
import { SmartNotification, SmartNotifyConfig, DEFAULT_SMART_NOTIFY_CONFIG } from '../../models/smart-notify.model';

@Component({
  selector: 'ai-notification-container',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './notification-container.component.html',
  styleUrl: './notification-container.component.scss'
})
export class NotificationContainerComponent implements OnInit, OnDestroy {
  notifications: SmartNotification[] = [];
  position = DEFAULT_SMART_NOTIFY_CONFIG.position!;

  @Output() actionClicked = new EventEmitter<{ notification: SmartNotification; action: string }>();

  private destroy$ = new Subject<void>();

  constructor(private notifyService: SmartNotifyService) {}

  ngOnInit(): void {
    this.notifyService.notifications$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(notifications => {
      this.notifications = this.notifyService.getVisible();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  dismiss(id: string): void {
    this.notifyService.dismiss(id);
  }

  onAction(notification: SmartNotification, action: string): void {
    this.actionClicked.emit({ notification, action });
    this.dismiss(notification.id);
  }

  getIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌',
      ai: '🤖'
    };
    return icons[type] || 'ℹ️';
  }

  getPositionClass(): string {
    return `position-${this.position}`;
  }
}

