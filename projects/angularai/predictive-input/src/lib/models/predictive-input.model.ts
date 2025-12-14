/**
 * Prediction result
 */
export interface Prediction {
  /** Predicted text completion */
  text: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Type of prediction */
  type: 'completion' | 'correction' | 'suggestion';
}

/**
 * Predictive input configuration
 */
export interface PredictiveInputConfig {
  /** Minimum characters before prediction */
  minLength?: number;
  /** Debounce delay in ms */
  debounce?: number;
  /** Maximum predictions to show */
  maxPredictions?: number;
  /** Context for better predictions */
  context?: string;
  /** Enable inline ghost text */
  showGhostText?: boolean;
  /** Enable autocorrection */
  autoCorrect?: boolean;
  /** Placeholder text */
  placeholder?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_PREDICTIVE_CONFIG: PredictiveInputConfig = {
  minLength: 3,
  debounce: 200,
  maxPredictions: 3,
  showGhostText: true,
  autoCorrect: false,
  placeholder: 'Start typing...'
};

