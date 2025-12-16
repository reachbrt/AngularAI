/**
 * Supported languages with names
 */
export const SUPPORTED_LANGUAGES: Record<string, string> = {
  'en-US': 'English (US)',
  'en-GB': 'English (UK)',
  'es-ES': 'Spanish (Spain)',
  'es-MX': 'Spanish (Mexico)',
  'fr-FR': 'French',
  'de-DE': 'German',
  'it-IT': 'Italian',
  'pt-BR': 'Portuguese (Brazil)',
  'pt-PT': 'Portuguese (Portugal)',
  'zh-CN': 'Chinese (Simplified)',
  'zh-TW': 'Chinese (Traditional)',
  'ja-JP': 'Japanese',
  'ko-KR': 'Korean',
  'ru-RU': 'Russian',
  'ar-SA': 'Arabic',
  'hi-IN': 'Hindi',
  'nl-NL': 'Dutch',
  'pl-PL': 'Polish',
  'tr-TR': 'Turkish',
  'vi-VN': 'Vietnamese'
};

/**
 * Voice command
 */
export interface VoiceCommand {
  /** Command phrase or pattern */
  phrase: string;
  /** Action to execute */
  action: string;
  /** Command aliases */
  aliases?: string[];
  /** Description */
  description?: string;
  /** Parameters to extract */
  parameters?: string[];
  /** Category for grouping */
  category?: string;
  /** Handler function */
  handler?: (params: Record<string, string>) => void | Promise<void>;
  /** Confirmation message for TTS */
  confirmation?: string;
}

/**
 * Voice recognition result
 */
export interface VoiceRecognitionResult {
  /** Transcribed text */
  transcript: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Is final result */
  isFinal: boolean;
  /** Matched command if any */
  matchedCommand?: VoiceCommand;
  /** Extracted parameters */
  parameters?: Record<string, string>;
  /** Language detected */
  language?: string;
  /** Timestamp */
  timestamp?: Date;
}

/**
 * Text-to-speech configuration
 */
export interface TTSConfig {
  /** Enable TTS */
  enabled?: boolean;
  /** Voice name */
  voice?: string;
  /** Speech rate (0.1-10) */
  rate?: number;
  /** Pitch (0-2) */
  pitch?: number;
  /** Volume (0-1) */
  volume?: number;
  /** Language */
  language?: string;
  /** Speak command confirmations */
  speakConfirmations?: boolean;
  /** Queue mode: interrupt or queue */
  queueMode?: 'interrupt' | 'queue';
}

/**
 * Wake word configuration
 */
export interface WakeWordConfig {
  /** Enable wake word detection */
  enabled?: boolean;
  /** Wake word phrase */
  phrase?: string;
  /** Wake word aliases */
  aliases?: string[];
  /** Sensitivity (0-1, higher = more sensitive) */
  sensitivity?: number;
  /** Timeout after wake word (ms) */
  timeout?: number;
  /** Sound to play on wake word detected */
  wakeSound?: string;
  /** Sound to play on timeout */
  sleepSound?: string;
}

/**
 * Voice actions configuration
 */
export interface VoiceActionsConfig {
  /** Language for recognition */
  language?: string;
  /** Continuous listening */
  continuous?: boolean;
  /** Interim results */
  interimResults?: boolean;
  /** Use AI for command matching */
  aiMatching?: boolean;
  /** AI matching confidence threshold */
  aiMatchThreshold?: number;
  /** Wake word configuration */
  wakeWord?: WakeWordConfig;
  /** TTS configuration */
  tts?: TTSConfig;
  /** Commands to register */
  commands?: VoiceCommand[];
  /** Max alternatives to consider */
  maxAlternatives?: number;
  /** Noise cancellation (if supported) */
  noiseSuppression?: boolean;
  /** Auto-restart on error */
  autoRestart?: boolean;
  /** Custom grammars */
  grammars?: string[];
}

/**
 * Voice state
 */
export interface VoiceState {
  /** Is listening for voice input */
  isListening: boolean;
  /** Is speaking (TTS) */
  isSpeaking: boolean;
  /** Is wake word active (waiting for command) */
  isAwake: boolean;
  /** Last transcript */
  lastTranscript?: string;
  /** Last matched command */
  lastCommand?: VoiceCommand;
  /** Error if any */
  error?: Error;
  /** Current language */
  language: string;
}

/**
 * Voice events
 */
export interface VoiceEvents {
  onResult?: (result: VoiceRecognitionResult) => void;
  onCommand?: (command: VoiceCommand, params: Record<string, string>) => void;
  onWakeWord?: () => void;
  onSleep?: () => void;
  onSpeakStart?: (text: string) => void;
  onSpeakEnd?: (text: string) => void;
  onError?: (error: Error) => void;
  onStateChange?: (state: VoiceState) => void;
}

/**
 * Available voice info
 */
export interface VoiceInfo {
  name: string;
  lang: string;
  default: boolean;
  localService: boolean;
  voiceURI: string;
}

/**
 * Default configuration
 */
export const DEFAULT_VOICE_CONFIG: VoiceActionsConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  aiMatching: true,
  aiMatchThreshold: 0.7,
  maxAlternatives: 3,
  autoRestart: true,
  tts: {
    enabled: true,
    rate: 1,
    pitch: 1,
    volume: 1,
    speakConfirmations: true,
    queueMode: 'interrupt'
  },
  wakeWord: {
    enabled: false,
    phrase: 'Hey Assistant',
    sensitivity: 0.5,
    timeout: 10000
  }
};

/**
 * Default wake word configuration
 */
export const DEFAULT_WAKE_WORD_CONFIG: WakeWordConfig = {
  enabled: false,
  phrase: 'Hey Assistant',
  aliases: ['OK Assistant', 'Hello Assistant'],
  sensitivity: 0.5,
  timeout: 10000
};

