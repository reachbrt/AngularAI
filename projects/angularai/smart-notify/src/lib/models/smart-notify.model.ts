/**
 * Notification type
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai' | 'progress' | 'system';

/**
 * Notification priority with numeric values
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent' | 'critical';

/**
 * Priority scores for sorting
 */
export const PRIORITY_SCORES: Record<NotificationPriority, number> = {
  low: 1,
  normal: 2,
  high: 3,
  urgent: 4,
  critical: 5
};

/**
 * Notification category for grouping
 */
export type NotificationCategory =
  | 'system'
  | 'security'
  | 'updates'
  | 'messages'
  | 'alerts'
  | 'tasks'
  | 'social'
  | 'marketing'
  | 'other';

/**
 * Smart notification
 */
export interface SmartNotification {
  /** Unique ID */
  id: string;
  /** Notification type */
  type: NotificationType;
  /** Title */
  title: string;
  /** Message content */
  message: string;
  /** Priority level */
  priority: NotificationPriority;
  /** Timestamp */
  timestamp: Date;
  /** Auto-dismiss duration (ms), 0 for persistent */
  duration: number;
  /** Is read */
  read: boolean;
  /** Action buttons */
  actions?: NotificationAction[];
  /** AI-generated context */
  aiContext?: string;
  /** Related data */
  data?: Record<string, any>;
  /** Category for grouping */
  category?: NotificationCategory;
  /** Group ID for batched notifications */
  groupId?: string;
  /** Number of notifications in group */
  groupCount?: number;
  /** Is grouped/batched notification */
  isGrouped?: boolean;
  /** Source of notification */
  source?: string;
  /** Icon */
  icon?: string;
  /** Image URL */
  imageUrl?: string;
  /** Sound to play */
  sound?: string;
  /** Vibration pattern */
  vibrate?: number[];
  /** Is dismissible */
  dismissible?: boolean;
  /** Scheduled time */
  scheduledFor?: Date;
  /** Expires at */
  expiresAt?: Date;
  /** AI-detected urgency score (0-1) */
  urgencyScore?: number;
  /** AI-suggested optimal time to show */
  optimalTime?: Date;
  /** Tags for filtering */
  tags?: string[];
}

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
  icon?: string;
  destructive?: boolean;
}

/**
 * Notification group
 */
export interface NotificationGroup {
  id: string;
  category: NotificationCategory;
  title: string;
  notifications: SmartNotification[];
  count: number;
  highestPriority: NotificationPriority;
  latestTimestamp: Date;
  unreadCount: number;
}

/**
 * Batching configuration
 */
export interface BatchConfig {
  /** Enable batching */
  enabled?: boolean;
  /** Batch window in ms */
  windowMs?: number;
  /** Minimum notifications to batch */
  minToGroup?: number;
  /** Maximum notifications per batch */
  maxPerBatch?: number;
  /** Categories to batch */
  batchCategories?: NotificationCategory[];
}

/**
 * Timing configuration for optimal delivery
 */
export interface TimingConfig {
  /** Enable smart timing */
  enabled?: boolean;
  /** Quiet hours start (HH:MM) */
  quietHoursStart?: string;
  /** Quiet hours end (HH:MM) */
  quietHoursEnd?: string;
  /** Defer non-urgent during quiet hours */
  deferNonUrgent?: boolean;
  /** Minimum gap between notifications (ms) */
  minGapMs?: number;
  /** Learn user patterns */
  learnPatterns?: boolean;
}

/**
 * User activity context for smart timing
 */
export interface UserActivity {
  isActive: boolean;
  lastActiveAt: Date;
  currentPage?: string;
  interactionCount: number;
  sessionStart: Date;
}

/**
 * Urgency analysis result
 */
export interface UrgencyAnalysis {
  score: number; // 0-1
  priority: NotificationPriority;
  reasoning: string;
  suggestedDuration: number;
  shouldInterrupt: boolean;
  suggestedCategory: NotificationCategory;
}

/**
 * Smart notify configuration
 */
export interface SmartNotifyConfig {
  /** Default duration (ms) */
  defaultDuration?: number;
  /** Maximum notifications to show */
  maxVisible?: number;
  /** Maximum notifications to store */
  maxStored?: number;
  /** Position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Enable AI-powered grouping */
  aiGrouping?: boolean;
  /** Enable AI-powered prioritization */
  aiPrioritization?: boolean;
  /** Enable AI urgency detection */
  aiUrgencyDetection?: boolean;
  /** Batching configuration */
  batching?: BatchConfig;
  /** Timing configuration */
  timing?: TimingConfig;
  /** Enable sounds */
  enableSounds?: boolean;
  /** Enable vibration */
  enableVibration?: boolean;
  /** Stack notifications */
  stackNotifications?: boolean;
  /** Animation type */
  animation?: 'slide' | 'fade' | 'bounce' | 'none';
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom sounds by type */
  sounds?: Partial<Record<NotificationType, string>>;
  /** Persist notifications */
  persist?: boolean;
  /** Storage key */
  storageKey?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_SMART_NOTIFY_CONFIG: SmartNotifyConfig = {
  defaultDuration: 5000,
  maxVisible: 5,
  maxStored: 100,
  position: 'top-right',
  aiGrouping: true,
  aiPrioritization: true,
  aiUrgencyDetection: true,
  stackNotifications: true,
  animation: 'slide',
  enableSounds: false,
  enableVibration: false,
  persist: true,
  storageKey: 'smart_notifications',
  batching: {
    enabled: true,
    windowMs: 5000,
    minToGroup: 3,
    maxPerBatch: 10,
    batchCategories: ['messages', 'social', 'updates', 'marketing']
  },
  timing: {
    enabled: true,
    quietHoursStart: '22:00',
    quietHoursEnd: '08:00',
    deferNonUrgent: true,
    minGapMs: 1000,
    learnPatterns: true
  }
};

