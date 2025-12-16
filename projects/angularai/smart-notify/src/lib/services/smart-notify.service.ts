import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  SmartNotification,
  NotificationType,
  NotificationPriority,
  NotificationCategory,
  NotificationGroup,
  UrgencyAnalysis,
  UserActivity,
  SmartNotifyConfig,
  PRIORITY_SCORES,
  DEFAULT_SMART_NOTIFY_CONFIG
} from '../models/smart-notify.model';

@Injectable({
  providedIn: 'root'
})
export class SmartNotifyService {
  private config: SmartNotifyConfig = DEFAULT_SMART_NOTIFY_CONFIG;
  private notifications: SmartNotification[] = [];
  private pendingBatch: SmartNotification[] = [];
  private batchTimeout: any = null;
  private deferredQueue: SmartNotification[] = [];
  private userActivity: UserActivity = {
    isActive: true,
    lastActiveAt: new Date(),
    interactionCount: 0,
    sessionStart: new Date()
  };

  private notificationsSubject = new BehaviorSubject<SmartNotification[]>([]);
  notifications$ = this.notificationsSubject.asObservable();

  private groupsSubject = new BehaviorSubject<NotificationGroup[]>([]);
  groups$ = this.groupsSubject.asObservable();

  private actionSubject = new Subject<{ notification: SmartNotification; action: string }>();
  action$ = this.actionSubject.asObservable();

  constructor(private aiClient: AIClientService) {
    this.loadFromStorage();
    this.setupActivityTracking();
    this.startDeferredProcessor();
  }

  configure(config: Partial<SmartNotifyConfig>): void {
    this.config = {
      ...DEFAULT_SMART_NOTIFY_CONFIG,
      ...config,
      batching: { ...DEFAULT_SMART_NOTIFY_CONFIG.batching, ...config.batching },
      timing: { ...DEFAULT_SMART_NOTIFY_CONFIG.timing, ...config.timing }
    };
  }

  // ==================== Show Notifications ====================

  /**
   * Show a notification with AI enhancements
   */
  async show(
    type: NotificationType,
    title: string,
    message: string,
    options: Partial<SmartNotification> = {}
  ): Promise<SmartNotification> {
    let notification: SmartNotification = {
      id: this.generateId(),
      type,
      title,
      message,
      priority: options.priority || 'normal',
      timestamp: new Date(),
      duration: options.duration ?? this.config.defaultDuration!,
      read: false,
      dismissible: options.dismissible ?? true,
      ...options
    };

    // AI urgency detection
    if (this.config.aiUrgencyDetection && !options.priority) {
      const analysis = await this.analyzeUrgency(title, message);
      notification.priority = analysis.priority;
      notification.urgencyScore = analysis.score;
      notification.category = notification.category || analysis.suggestedCategory;
      if (analysis.suggestedDuration && !options.duration) {
        notification.duration = analysis.suggestedDuration;
      }
    }

    // Check timing
    if (this.config.timing?.enabled) {
      const optimalTime = this.calculateOptimalTime(notification);
      if (optimalTime > new Date()) {
        notification.scheduledFor = optimalTime;
        notification.optimalTime = optimalTime;
        this.deferredQueue.push(notification);
        return notification;
      }
    }

    // Check batching
    if (this.shouldBatch(notification)) {
      return this.addToBatch(notification);
    }

    return this.displayNotification(notification);
  }

  private displayNotification(notification: SmartNotification): SmartNotification {
    this.notifications.unshift(notification);

    // Limit stored notifications
    if (this.config.maxStored && this.notifications.length > this.config.maxStored) {
      this.notifications = this.notifications.slice(0, this.config.maxStored);
    }

    this.updateNotifications();
    this.updateGroups();
    this.saveToStorage();

    // Play sound
    if (this.config.enableSounds && notification.sound) {
      this.playSound(notification.sound);
    } else if (this.config.enableSounds && this.config.sounds?.[notification.type]) {
      this.playSound(this.config.sounds[notification.type]!);
    }

    // Vibrate
    if (this.config.enableVibration && notification.vibrate && 'vibrate' in navigator) {
      navigator.vibrate(notification.vibrate);
    }

    // Auto-dismiss
    if (notification.duration > 0) {
      setTimeout(() => this.dismiss(notification.id), notification.duration);
    }

    return notification;
  }

  // Convenience methods
  info(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('info', title, message, options);
  }

  success(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('success', title, message, options);
  }

  warning(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('warning', title, message, options);
  }

  error(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('error', title, message, { ...options, duration: 0, priority: 'high' });
  }

  ai(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('ai', title, message, options);
  }

  progress(title: string, message: string, options?: Partial<SmartNotification>): Promise<SmartNotification> {
    return this.show('progress', title, message, { ...options, duration: 0 });
  }

  // ==================== AI Urgency Detection ====================

  /**
   * Analyze urgency of a notification using AI
   */
  async analyzeUrgency(title: string, message: string): Promise<UrgencyAnalysis> {
    const prompt = `Analyze the urgency of this notification:
Title: "${title}"
Message: "${message}"

Respond with JSON:
{
  "score": 0.0-1.0,
  "priority": "low|normal|high|urgent|critical",
  "reasoning": "brief explanation",
  "suggestedDuration": milliseconds (0 for persistent),
  "shouldInterrupt": true/false,
  "suggestedCategory": "system|security|updates|messages|alerts|tasks|social|marketing|other"
}`;

    try {
      const response = await this.aiClient.ask(prompt).toPromise();
      const match = response?.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          score: parsed.score || 0.5,
          priority: parsed.priority || 'normal',
          reasoning: parsed.reasoning || '',
          suggestedDuration: parsed.suggestedDuration || 5000,
          shouldInterrupt: parsed.shouldInterrupt || false,
          suggestedCategory: parsed.suggestedCategory || 'other'
        };
      }
    } catch {}

    // Fallback: keyword-based analysis
    return this.keywordUrgencyAnalysis(title, message);
  }

  private keywordUrgencyAnalysis(title: string, message: string): UrgencyAnalysis {
    const text = `${title} ${message}`.toLowerCase();

    const urgentKeywords = ['urgent', 'critical', 'emergency', 'immediately', 'asap', 'security', 'breach', 'failed', 'error'];
    const highKeywords = ['important', 'warning', 'attention', 'required', 'deadline', 'expiring'];
    const lowKeywords = ['fyi', 'reminder', 'update', 'newsletter', 'tip', 'suggestion'];

    let score = 0.5;
    let priority: NotificationPriority = 'normal';

    if (urgentKeywords.some(k => text.includes(k))) {
      score = 0.9;
      priority = 'urgent';
    } else if (highKeywords.some(k => text.includes(k))) {
      score = 0.7;
      priority = 'high';
    } else if (lowKeywords.some(k => text.includes(k))) {
      score = 0.3;
      priority = 'low';
    }

    return {
      score,
      priority,
      reasoning: 'Keyword-based analysis',
      suggestedDuration: score >= 0.9 ? 0 : 5000,
      shouldInterrupt: score >= 0.9,
      suggestedCategory: this.detectCategory(text)
    };
  }

  private detectCategory(text: string): NotificationCategory {
    if (/security|password|login|auth/i.test(text)) return 'security';
    if (/update|version|upgrade/i.test(text)) return 'updates';
    if (/message|chat|reply|mention/i.test(text)) return 'messages';
    if (/alert|warning|error/i.test(text)) return 'alerts';
    if (/task|todo|deadline|due/i.test(text)) return 'tasks';
    if (/follow|like|share|friend/i.test(text)) return 'social';
    if (/offer|discount|sale|promo/i.test(text)) return 'marketing';
    if (/system|server|service/i.test(text)) return 'system';
    return 'other';
  }

  // ==================== Intelligent Grouping ====================

  /**
   * Get notifications grouped by category
   */
  getGroups(): NotificationGroup[] {
    const groupMap = new Map<NotificationCategory, SmartNotification[]>();

    for (const n of this.notifications) {
      const category = n.category || 'other';
      if (!groupMap.has(category)) {
        groupMap.set(category, []);
      }
      groupMap.get(category)!.push(n);
    }

    const groups: NotificationGroup[] = [];
    for (const [category, notifications] of groupMap) {
      const sorted = notifications.sort((a, b) =>
        PRIORITY_SCORES[b.priority] - PRIORITY_SCORES[a.priority]
      );

      groups.push({
        id: `group_${category}`,
        category,
        title: this.getCategoryTitle(category),
        notifications: sorted,
        count: notifications.length,
        highestPriority: sorted[0]?.priority || 'normal',
        latestTimestamp: sorted[0]?.timestamp || new Date(),
        unreadCount: notifications.filter(n => !n.read).length
      });
    }

    return groups.sort((a, b) =>
      PRIORITY_SCORES[b.highestPriority] - PRIORITY_SCORES[a.highestPriority]
    );
  }

  private getCategoryTitle(category: NotificationCategory): string {
    const titles: Record<NotificationCategory, string> = {
      system: 'System',
      security: 'Security',
      updates: 'Updates',
      messages: 'Messages',
      alerts: 'Alerts',
      tasks: 'Tasks',
      social: 'Social',
      marketing: 'Promotions',
      other: 'Other'
    };
    return titles[category];
  }

  private updateGroups(): void {
    this.groupsSubject.next(this.getGroups());
  }

  // ==================== Batching ====================

  private shouldBatch(notification: SmartNotification): boolean {
    if (!this.config.batching?.enabled) return false;
    if (notification.priority === 'urgent' || notification.priority === 'critical') return false;

    const category = notification.category || 'other';
    return this.config.batching.batchCategories?.includes(category) || false;
  }

  private addToBatch(notification: SmartNotification): SmartNotification {
    this.pendingBatch.push(notification);

    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => {
        this.processBatch();
      }, this.config.batching?.windowMs || 5000);
    }

    return notification;
  }

  private processBatch(): void {
    this.batchTimeout = null;

    if (this.pendingBatch.length === 0) return;

    const minToGroup = this.config.batching?.minToGroup || 3;

    if (this.pendingBatch.length >= minToGroup) {
      // Create grouped notification
      const grouped: SmartNotification = {
        id: this.generateId(),
        type: 'info',
        title: `${this.pendingBatch.length} new notifications`,
        message: this.pendingBatch.map(n => n.title).slice(0, 3).join(', ') +
                 (this.pendingBatch.length > 3 ? '...' : ''),
        priority: this.getHighestPriority(this.pendingBatch),
        timestamp: new Date(),
        duration: this.config.defaultDuration || 5000,
        read: false,
        isGrouped: true,
        groupCount: this.pendingBatch.length,
        groupId: this.generateId()
      };

      this.displayNotification(grouped);
    } else {
      // Show individually
      for (const n of this.pendingBatch) {
        this.displayNotification(n);
      }
    }

    this.pendingBatch = [];
  }

  private getHighestPriority(notifications: SmartNotification[]): NotificationPriority {
    let highest: NotificationPriority = 'low';
    for (const n of notifications) {
      if (PRIORITY_SCORES[n.priority] > PRIORITY_SCORES[highest]) {
        highest = n.priority;
      }
    }
    return highest;
  }

  // ==================== Optimal Timing ====================

  private calculateOptimalTime(notification: SmartNotification): Date {
    const now = new Date();

    // Check quiet hours
    if (this.config.timing?.deferNonUrgent && this.isQuietHours()) {
      if (notification.priority !== 'urgent' && notification.priority !== 'critical') {
        return this.getQuietHoursEnd();
      }
    }

    // Check minimum gap
    if (this.config.timing?.minGapMs && this.notifications.length > 0) {
      const lastTime = this.notifications[0].timestamp.getTime();
      const minGap = this.config.timing.minGapMs;
      if (now.getTime() - lastTime < minGap) {
        return new Date(lastTime + minGap);
      }
    }

    return now;
  }

  private isQuietHours(): boolean {
    if (!this.config.timing?.quietHoursStart || !this.config.timing?.quietHoursEnd) {
      return false;
    }

    const now = new Date();
    const [startH, startM] = this.config.timing.quietHoursStart.split(':').map(Number);
    const [endH, endM] = this.config.timing.quietHoursEnd.split(':').map(Number);

    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const startMinutes = startH * 60 + startM;
    const endMinutes = endH * 60 + endM;

    if (startMinutes < endMinutes) {
      return currentMinutes >= startMinutes && currentMinutes < endMinutes;
    } else {
      // Overnight quiet hours
      return currentMinutes >= startMinutes || currentMinutes < endMinutes;
    }
  }

  private getQuietHoursEnd(): Date {
    const [endH, endM] = (this.config.timing?.quietHoursEnd || '08:00').split(':').map(Number);
    const end = new Date();
    end.setHours(endH, endM, 0, 0);

    if (end <= new Date()) {
      end.setDate(end.getDate() + 1);
    }

    return end;
  }

  private startDeferredProcessor(): void {
    setInterval(() => {
      const now = new Date();
      const ready = this.deferredQueue.filter(n =>
        !n.scheduledFor || n.scheduledFor <= now
      );

      for (const n of ready) {
        this.displayNotification(n);
      }

      this.deferredQueue = this.deferredQueue.filter(n =>
        n.scheduledFor && n.scheduledFor > now
      );
    }, 1000);
  }

  // ==================== User Activity ====================

  private setupActivityTracking(): void {
    if (typeof window === 'undefined') return;

    const updateActivity = () => {
      this.userActivity.isActive = true;
      this.userActivity.lastActiveAt = new Date();
      this.userActivity.interactionCount++;
    };

    window.addEventListener('mousemove', updateActivity);
    window.addEventListener('keydown', updateActivity);
    window.addEventListener('click', updateActivity);
    window.addEventListener('scroll', updateActivity);

    // Check for inactivity
    setInterval(() => {
      const inactiveMs = Date.now() - this.userActivity.lastActiveAt.getTime();
      if (inactiveMs > 60000) { // 1 minute
        this.userActivity.isActive = false;
      }
    }, 10000);
  }

  updateUserActivity(activity: Partial<UserActivity>): void {
    this.userActivity = { ...this.userActivity, ...activity };
  }

  // ==================== Actions ====================

  /**
   * Dismiss a notification
   */
  dismiss(id: string): void {
    this.notifications = this.notifications.filter(n => n.id !== id);
    this.updateNotifications();
    this.updateGroups();
    this.saveToStorage();
  }

  /**
   * Mark as read
   */
  markAsRead(id: string): void {
    const notification = this.notifications.find(n => n.id === id);
    if (notification) {
      notification.read = true;
      this.updateNotifications();
      this.updateGroups();
      this.saveToStorage();
    }
  }

  /**
   * Mark all as read
   */
  markAllAsRead(): void {
    for (const n of this.notifications) {
      n.read = true;
    }
    this.updateNotifications();
    this.updateGroups();
    this.saveToStorage();
  }

  /**
   * Execute action
   */
  executeAction(notificationId: string, action: string): void {
    const notification = this.notifications.find(n => n.id === notificationId);
    if (notification) {
      this.actionSubject.next({ notification, action });
    }
  }

  /**
   * Clear all notifications
   */
  clearAll(): void {
    this.notifications = [];
    this.updateNotifications();
    this.updateGroups();
    this.saveToStorage();
  }

  /**
   * Clear by category
   */
  clearCategory(category: NotificationCategory): void {
    this.notifications = this.notifications.filter(n => n.category !== category);
    this.updateNotifications();
    this.updateGroups();
    this.saveToStorage();
  }

  /**
   * Get visible notifications
   */
  getVisible(): SmartNotification[] {
    return this.notifications
      .filter(n => !n.read)
      .slice(0, this.config.maxVisible);
  }

  /**
   * Get unread count
   */
  getUnreadCount(): number {
    return this.notifications.filter(n => !n.read).length;
  }

  /**
   * Get by priority
   */
  getByPriority(priority: NotificationPriority): SmartNotification[] {
    return this.notifications.filter(n => n.priority === priority);
  }

  // ==================== Storage ====================

  private saveToStorage(): void {
    if (!this.config.persist || typeof localStorage === 'undefined') return;

    try {
      const data = this.notifications.map(n => ({
        ...n,
        timestamp: n.timestamp.toISOString(),
        scheduledFor: n.scheduledFor?.toISOString(),
        expiresAt: n.expiresAt?.toISOString(),
        optimalTime: n.optimalTime?.toISOString()
      }));
      localStorage.setItem(this.config.storageKey || 'smart_notifications', JSON.stringify(data));
    } catch {}
  }

  private loadFromStorage(): void {
    if (!this.config.persist || typeof localStorage === 'undefined') return;

    try {
      const data = localStorage.getItem(this.config.storageKey || 'smart_notifications');
      if (data) {
        const parsed = JSON.parse(data);
        this.notifications = parsed.map((n: any) => ({
          ...n,
          timestamp: new Date(n.timestamp),
          scheduledFor: n.scheduledFor ? new Date(n.scheduledFor) : undefined,
          expiresAt: n.expiresAt ? new Date(n.expiresAt) : undefined,
          optimalTime: n.optimalTime ? new Date(n.optimalTime) : undefined
        }));

        // Remove expired
        const now = new Date();
        this.notifications = this.notifications.filter(n =>
          !n.expiresAt || n.expiresAt > now
        );

        this.updateNotifications();
        this.updateGroups();
      }
    } catch {}
  }

  // ==================== Utilities ====================

  private playSound(url: string): void {
    try {
      const audio = new Audio(url);
      audio.play();
    } catch {}
  }

  private updateNotifications(): void {
    this.notificationsSubject.next([...this.notifications]);
  }

  private generateId(): string {
    return `notify_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }
}

