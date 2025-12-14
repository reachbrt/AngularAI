/**
 * Suggestion item
 */
export interface Suggestion {
  /** Unique suggestion ID */
  id: string;
  /** Suggestion text */
  text: string;
  /** Relevance score (0-1) */
  score?: number;
  /** Category or type */
  category?: string;
  /** Additional metadata */
  metadata?: Record<string, unknown>;
}

/**
 * Autosuggest configuration
 */
export interface AutosuggestConfig {
  /** Minimum characters before triggering suggestions */
  minLength?: number;
  /** Debounce delay in milliseconds */
  debounce?: number;
  /** Maximum suggestions to show */
  maxSuggestions?: number;
  /** Placeholder text */
  placeholder?: string;
  /** Context to help AI understand the domain */
  context?: string;
  /** Categories to filter suggestions */
  categories?: string[];
  /** Custom CSS class */
  cssClass?: string;
}

/**
 * Default autosuggest configuration
 */
export const DEFAULT_AUTOSUGGEST_CONFIG: AutosuggestConfig = {
  minLength: 2,
  debounce: 300,
  maxSuggestions: 5,
  placeholder: 'Start typing...'
};

