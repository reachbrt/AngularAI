/**
 * Notification type
 */
export type NotificationType = 'info' | 'success' | 'warning' | 'error' | 'ai';

/**
 * Notification priority
 */
export type NotificationPriority = 'low' | 'normal' | 'high' | 'urgent';

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
}

/**
 * Notification action
 */
export interface NotificationAction {
  label: string;
  action: string;
  primary?: boolean;
}

/**
 * Smart notify configuration
 */
export interface SmartNotifyConfig {
  /** Default duration (ms) */
  defaultDuration?: number;
  /** Maximum notifications to show */
  maxVisible?: number;
  /** Position */
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left' | 'top-center' | 'bottom-center';
  /** Enable AI-powered grouping */
  aiGrouping?: boolean;
  /** Enable AI-powered prioritization */
  aiPrioritization?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_SMART_NOTIFY_CONFIG: SmartNotifyConfig = {
  defaultDuration: 5000,
  maxVisible: 5,
  position: 'top-right',
  aiGrouping: false,
  aiPrioritization: false
};

