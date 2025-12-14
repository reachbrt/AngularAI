/**
 * Detected emotion
 */
export type EmotionType = 'happy' | 'sad' | 'angry' | 'fearful' | 'surprised' | 'disgusted' | 'neutral' | 'confused' | 'frustrated';

/**
 * Emotion analysis result
 */
export interface EmotionResult {
  /** Primary detected emotion */
  primary: EmotionType;
  /** Confidence score (0-1) */
  confidence: number;
  /** All detected emotions with scores */
  emotions: Record<EmotionType, number>;
  /** Sentiment score (-1 to 1) */
  sentiment: number;
}

/**
 * UI adaptation based on emotion
 */
export interface EmotionUIAdaptation {
  /** Theme to apply */
  theme: 'calm' | 'energetic' | 'supportive' | 'neutral';
  /** Color scheme */
  colors: {
    primary: string;
    secondary: string;
    background: string;
    text: string;
  };
  /** Suggested actions */
  suggestions: string[];
  /** Tone for AI responses */
  responseTone: 'empathetic' | 'encouraging' | 'calm' | 'professional';
}

/**
 * Emotion UI configuration
 */
export interface EmotionUIConfig {
  /** Enable emotion detection */
  enabled?: boolean;
  /** Detection source */
  source?: 'text' | 'voice' | 'both';
  /** Minimum confidence threshold */
  minConfidence?: number;
  /** Enable UI adaptation */
  adaptUI?: boolean;
  /** Custom theme mappings */
  themeMapping?: Partial<Record<EmotionType, EmotionUIAdaptation>>;
}

/**
 * Default configuration
 */
export const DEFAULT_EMOTION_CONFIG: EmotionUIConfig = {
  enabled: true,
  source: 'text',
  minConfidence: 0.6,
  adaptUI: true
};

/**
 * Default emotion to UI adaptation mapping
 */
export const DEFAULT_EMOTION_ADAPTATIONS: Record<EmotionType, EmotionUIAdaptation> = {
  happy: {
    theme: 'energetic',
    colors: { primary: '#4caf50', secondary: '#81c784', background: '#e8f5e9', text: '#1b5e20' },
    suggestions: ['Great to see you happy!', 'Keep up the positive energy!'],
    responseTone: 'encouraging'
  },
  sad: {
    theme: 'supportive',
    colors: { primary: '#5c6bc0', secondary: '#9fa8da', background: '#e8eaf6', text: '#283593' },
    suggestions: ['I\'m here to help', 'Take your time'],
    responseTone: 'empathetic'
  },
  angry: {
    theme: 'calm',
    colors: { primary: '#78909c', secondary: '#b0bec5', background: '#eceff1', text: '#37474f' },
    suggestions: ['Let me help resolve this', 'I understand your frustration'],
    responseTone: 'calm'
  },
  fearful: {
    theme: 'supportive',
    colors: { primary: '#7986cb', secondary: '#c5cae9', background: '#e8eaf6', text: '#303f9f' },
    suggestions: ['You\'re in safe hands', 'Let me guide you through this'],
    responseTone: 'empathetic'
  },
  surprised: {
    theme: 'energetic',
    colors: { primary: '#ff9800', secondary: '#ffcc80', background: '#fff3e0', text: '#e65100' },
    suggestions: ['Interesting, right?', 'Let me explain more'],
    responseTone: 'encouraging'
  },
  disgusted: {
    theme: 'neutral',
    colors: { primary: '#607d8b', secondary: '#90a4ae', background: '#eceff1', text: '#455a64' },
    suggestions: ['I apologize for any inconvenience', 'Let me help fix this'],
    responseTone: 'professional'
  },
  neutral: {
    theme: 'neutral',
    colors: { primary: '#2196f3', secondary: '#64b5f6', background: '#e3f2fd', text: '#1565c0' },
    suggestions: ['How can I help you today?'],
    responseTone: 'professional'
  },
  confused: {
    theme: 'supportive',
    colors: { primary: '#9c27b0', secondary: '#ce93d8', background: '#f3e5f5', text: '#6a1b9a' },
    suggestions: ['Let me clarify', 'Would you like more details?'],
    responseTone: 'empathetic'
  },
  frustrated: {
    theme: 'calm',
    colors: { primary: '#00897b', secondary: '#80cbc4', background: '#e0f2f1', text: '#004d40' },
    suggestions: ['I\'ll help you through this', 'Let\'s solve this together'],
    responseTone: 'calm'
  }
};

