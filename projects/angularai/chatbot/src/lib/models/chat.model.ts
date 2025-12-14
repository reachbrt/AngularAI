/**
 * Chat message with metadata
 */
export interface ChatMessage {
  /** Unique message ID */
  id: string;
  /** Role of the sender */
  role: 'user' | 'assistant' | 'system';
  /** Message content */
  content: string;
  /** Timestamp */
  timestamp: Date;
  /** Whether message is being streamed */
  isStreaming?: boolean;
  /** Error if message failed */
  error?: string;
}

/**
 * Chat configuration options
 */
export interface ChatConfig {
  /** AI provider. If not provided, uses globally configured provider */
  provider?: 'openai' | 'claude' | 'gemini' | 'huggingface' | 'deepseek' | 'ollama';
  /** API key. If not provided, uses globally configured API key */
  apiKey?: string;
  /** Model to use */
  model?: string;
  /** System prompt */
  systemPrompt?: string;
  /** Enable streaming */
  streaming?: boolean;
  /** Placeholder text */
  placeholder?: string;
  /** Welcome message */
  welcomeMessage?: string;
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Show timestamps */
  showTimestamps?: boolean;
  /** Max messages to keep in history */
  maxHistory?: number;
}

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
}

/**
 * Chat events
 */
export interface ChatEvents {
  onMessageSent?: (message: ChatMessage) => void;
  onMessageReceived?: (message: ChatMessage) => void;
  onError?: (error: Error) => void;
  onTypingStart?: () => void;
  onTypingEnd?: () => void;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

