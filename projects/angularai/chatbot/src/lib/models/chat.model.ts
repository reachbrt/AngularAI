/**
 * File attachment for chat messages
 */
export interface ChatAttachment {
  /** Unique attachment ID */
  id: string;
  /** File name */
  name: string;
  /** MIME type */
  type: string;
  /** File size in bytes */
  size: number;
  /** URL or base64 data */
  url?: string;
  /** Base64 encoded content */
  base64?: string;
}

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
  /** File attachments */
  attachments?: ChatAttachment[];
  /** RAG context used for this message */
  ragContext?: string[];
  /** Voice input metadata */
  voiceInput?: boolean;
  /** Language code */
  language?: string;
}

/**
 * RAG (Retrieval-Augmented Generation) configuration
 */
export interface RAGConfig {
  /** Enable RAG */
  enabled?: boolean;
  /** Documents to index (text content) */
  documents?: string[];
  /** URLs to scrape for context */
  urls?: string[];
  /** Chunk size for document splitting */
  chunkSize?: number;
  /** Chunk overlap */
  chunkOverlap?: number;
  /** Number of relevant chunks to retrieve */
  topK?: number;
  /** Minimum similarity score */
  minScore?: number;
}

/**
 * Voice configuration
 */
export interface VoiceConfig {
  /** Enable voice input */
  inputEnabled?: boolean;
  /** Enable voice output (TTS) */
  outputEnabled?: boolean;
  /** Voice for TTS */
  voice?: string;
  /** Speech rate */
  rate?: number;
  /** Speech pitch */
  pitch?: number;
  /** Language for speech recognition */
  language?: string;
  /** Continuous listening mode */
  continuous?: boolean;
}

/**
 * Storage adapter interface
 */
export interface StorageAdapter {
  /** Save messages */
  save(conversationId: string, messages: ChatMessage[]): Promise<void>;
  /** Load messages */
  load(conversationId: string): Promise<ChatMessage[]>;
  /** Delete conversation */
  delete(conversationId: string): Promise<void>;
  /** List all conversations */
  list(): Promise<string[]>;
}

/**
 * Storage configuration
 */
export interface StorageConfig {
  /** Storage type */
  type?: 'localStorage' | 'sessionStorage' | 'indexedDB' | 'custom';
  /** Custom storage adapter */
  adapter?: StorageAdapter;
  /** Storage key prefix */
  keyPrefix?: string;
  /** Auto-save on each message */
  autoSave?: boolean;
  /** Encryption key for stored messages */
  encryptionKey?: string;
}

/**
 * Internationalization configuration
 */
export interface I18nConfig {
  /** Current language */
  language?: string;
  /** Available languages */
  availableLanguages?: string[];
  /** Auto-detect browser language */
  autoDetect?: boolean;
  /** Custom translations */
  translations?: Record<string, Record<string, string>>;
}

/**
 * Default i18n translations
 */
export const DEFAULT_I18N: Record<string, Record<string, string>> = {
  en: {
    placeholder: 'Type a message...',
    send: 'Send',
    clear: 'Clear chat',
    voiceStart: 'Start voice input',
    voiceStop: 'Stop voice input',
    loading: 'Thinking...',
    error: 'An error occurred'
  },
  es: {
    placeholder: 'Escribe un mensaje...',
    send: 'Enviar',
    clear: 'Limpiar chat',
    voiceStart: 'Iniciar entrada de voz',
    voiceStop: 'Detener entrada de voz',
    loading: 'Pensando...',
    error: 'Ocurrió un error'
  },
  fr: {
    placeholder: 'Tapez un message...',
    send: 'Envoyer',
    clear: 'Effacer le chat',
    voiceStart: 'Démarrer la saisie vocale',
    voiceStop: 'Arrêter la saisie vocale',
    loading: 'Réflexion...',
    error: 'Une erreur est survenue'
  },
  de: {
    placeholder: 'Nachricht eingeben...',
    send: 'Senden',
    clear: 'Chat löschen',
    voiceStart: 'Spracheingabe starten',
    voiceStop: 'Spracheingabe stoppen',
    loading: 'Denke nach...',
    error: 'Ein Fehler ist aufgetreten'
  },
  zh: {
    placeholder: '输入消息...',
    send: '发送',
    clear: '清除聊天',
    voiceStart: '开始语音输入',
    voiceStop: '停止语音输入',
    loading: '思考中...',
    error: '发生错误'
  },
  ja: {
    placeholder: 'メッセージを入力...',
    send: '送信',
    clear: 'チャットをクリア',
    voiceStart: '音声入力を開始',
    voiceStop: '音声入力を停止',
    loading: '考え中...',
    error: 'エラーが発生しました'
  }
};

/**
 * Proxy configuration
 */
export interface ProxyConfig {
  /** Proxy URL */
  url?: string;
  /** Custom headers */
  headers?: Record<string, string>;
  /** Transform request */
  transformRequest?: (request: any) => any;
  /** Transform response */
  transformResponse?: (response: any) => any;
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
  /** RAG configuration */
  rag?: RAGConfig;
  /** Voice configuration */
  voice?: VoiceConfig;
  /** Storage configuration */
  storage?: StorageConfig;
  /** Internationalization */
  i18n?: I18nConfig;
  /** Proxy configuration */
  proxy?: ProxyConfig;
  /** Allow file attachments */
  allowAttachments?: boolean;
  /** Allowed file types for attachments */
  allowedFileTypes?: string[];
  /** Max attachment size in bytes */
  maxAttachmentSize?: number;
}

/**
 * Chat state
 */
export interface ChatState {
  messages: ChatMessage[];
  isLoading: boolean;
  error: Error | null;
  isListening?: boolean;
  isSpeaking?: boolean;
  currentLanguage?: string;
  ragDocuments?: number;
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
  onVoiceStart?: () => void;
  onVoiceEnd?: (transcript: string) => void;
  onSpeechStart?: () => void;
  onSpeechEnd?: () => void;
  onAttachment?: (attachment: ChatAttachment) => void;
  onLanguageChange?: (language: string) => void;
}

/**
 * RAG document chunk
 */
export interface RAGChunk {
  id: string;
  content: string;
  embedding?: number[];
  metadata?: Record<string, any>;
}

/**
 * Generate unique message ID
 */
export function generateMessageId(): string {
  return `msg_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Generate unique attachment ID
 */
export function generateAttachmentId(): string {
  return `att_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
}

