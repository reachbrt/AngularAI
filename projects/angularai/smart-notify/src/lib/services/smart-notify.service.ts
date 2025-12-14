import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { 
  SmartNotification, 
  NotificationType, 
  NotificationPriority,
  SmartNotifyConfig,
  DEFAULT_SMART_NOTIFY_CONFIG 
} from '../models/smart-notify.model';

@Injectable({
  providedIn: 'root'
})
export class SmartNotifyService {
  private config: SmartNotifyConfig = DEFAULT_SMART_NOTIFY_CONFIG;
  private notifications: SmartNotification[] = [];
  
  private notificationsSubject = new BehaviorSubject<SmartNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  configure(config: Partial<SmartNotifyConfig>): void {
    this.config = { ...DEFAULT_SMART_NOTIFY_CONFIG, ...config };
  }

  /**
   * Show a notification
   */
  show(
    type: NotificationType,
    title: string,
    message: string,
    options: Partial<SmartNotification> = {}
  ): SmartNotification {
    const notification: SmartNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      priority: options.priority || 'normal',
      timestamp: new Date(),
      duration: options.duration ?? this.config.defaultDuration!,
      read: false,
      actions: options.actions,
      aiContext: options.aiContext,
      data: options.data
    };

    this.notifications.unshift(notification);
    this.updateNotifications();

    // Auto-dismiss
    if (notification.duration > 0) {
      setTimeout(() => this.dismiss(notification.id), notification.duration);
    }

    return notification;
  }

  // Convenience methods
  info(title: string, message: string, options?: Partial<SmartNotification>): SmartNotification {
    return this.show('info', title, message, options);
  }

  success(title: string, message: string, options?: Partial<SmartNotification>): SmartNotification {
    return this.show('success', title, message, options);
  }

  warning(title: string, message: string, options?: Partial<SmartNotification>): SmartNotification {
    return this.show('warning', title, message, options);
  }

  error(title: string, message: string, options?: Partial<SmartNotification>): SmartNotification {
    return this.show('error', title, message, { ...options, duration: 0 }); // Errors persist
  }

  ai(title: string, message: string, options?: Partial<SmartNotification>): SmartNotification {
    return this.show('ai', title, message, options);
  }

  /**
   * Dismiss a notification
   */
  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateNotifications();
  }

  /**
   * Mark as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.updateNotifications();
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.updateNotifications();
  }

  /**
   * Get visible notifications
   */
  getVisible(): SmartNotification[] {
    return this.notifications.slice(0, this.config.maxVisible);
  }

  private updateNotifications(): void {
    this.notificationsSubject.next([...this.notifications]);
  }

  private generateId(): string {
    return `notify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

