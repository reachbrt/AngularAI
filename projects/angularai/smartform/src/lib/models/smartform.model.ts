/**
 * Form field schema
 */
export interface FieldSchema {
  /** Field name */
  name: string;
  /** Field type */
  type: 'text' | 'email' | 'tel' | 'number' | 'date' | 'textarea' | 'select';
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Is field required */
  required?: boolean;
  /** Enable AI validation */
  aiValidation?: boolean;
  /** Enable AI auto-correction */
  aiAutoCorrect?: boolean;
  /** Custom validation rules */
  validators?: ValidatorRule[];
  /** Select options */
  options?: { value: string; label: string }[];
}

/**
 * Validator rule
 */
export interface ValidatorRule {
  type: 'pattern' | 'minLength' | 'maxLength' | 'min' | 'max' | 'custom';
  value?: string | number | RegExp;
  message: string;
}

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
  suggestions?: FieldSuggestion[];
}

/**
 * Field error
 */
export interface FieldError {
  field: string;
  message: string;
  type: 'error' | 'warning';
}

/**
 * AI-generated suggestion for field correction
 */
export interface FieldSuggestion {
  field: string;
  originalValue: string;
  suggestedValue: string;
  confidence: number;
  reason: string;
}

/**
 * Smart form configuration
 */
export interface SmartFormConfig {
  /** Enable AI validation */
  aiValidation?: boolean;
  /** Enable AI auto-correction suggestions */
  aiAutoCorrect?: boolean;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Custom AI system prompt */
  systemPrompt?: string;
}

/**
 * Default configuration
 */
export const DEFAULT_SMARTFORM_CONFIG: SmartFormConfig = {
  aiValidation: true,
  aiAutoCorrect: true,
  validateOnBlur: true,
  validateOnChange: false
};

