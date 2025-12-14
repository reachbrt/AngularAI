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
  /** Wake word */
  wakeWord?: string;
  /** Commands to register */
  commands?: VoiceCommand[];
}

/**
 * Default configuration
 */
export const DEFAULT_VOICE_CONFIG: VoiceActionsConfig = {
  language: 'en-US',
  continuous: false,
  interimResults: true,
  aiMatching: true
};

