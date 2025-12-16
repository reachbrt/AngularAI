/**
 * All 12 supported field types
 */
export type FieldType =
  | 'text'      // Basic text input
  | 'email'     // Email with validation
  | 'tel'       // Phone number
  | 'number'    // Numeric input
  | 'date'      // Date picker
  | 'datetime'  // Date and time picker
  | 'time'      // Time picker
  | 'textarea'  // Multi-line text
  | 'select'    // Dropdown selection
  | 'radio'     // Radio button group
  | 'checkbox'  // Checkbox (single or group)
  | 'password'  // Password with strength indicator
  | 'url'       // URL with validation
  | 'file'      // File upload
  | 'color'     // Color picker
  | 'range';    // Slider/range input

/**
 * Form field schema
 */
export interface FieldSchema {
  /** Field name */
  name: string;
  /** Field type */
  type: FieldType;
  /** Field label */
  label?: string;
  /** Placeholder text */
  placeholder?: string;
  /** Helper text shown below field */
  helperText?: string;
  /** Is field required */
  required?: boolean;
  /** Is field disabled */
  disabled?: boolean;
  /** Is field read-only */
  readOnly?: boolean;
  /** Enable AI validation */
  aiValidation?: boolean;
  /** Enable AI auto-correction */
  aiAutoCorrect?: boolean;
  /** Custom validation rules */
  validators?: ValidatorRule[];
  /** Select/radio/checkbox options */
  options?: FieldOption[];
  /** Conditional visibility */
  showWhen?: ConditionalRule;
  /** Default value */
  defaultValue?: any;
  /** CSS class name */
  className?: string;
  /** Field-specific config */
  config?: FieldConfig;
  /** Field group (for organizing fields) */
  group?: string;
  /** Field order */
  order?: number;
}

/**
 * Field option for select/radio/checkbox
 */
export interface FieldOption {
  value: string | number | boolean;
  label: string;
  disabled?: boolean;
  icon?: string;
}

/**
 * Field-specific configuration
 */
export interface FieldConfig {
  // Number/range
  min?: number;
  max?: number;
  step?: number;
  // Textarea
  rows?: number;
  cols?: number;
  maxRows?: number;
  // File
  accept?: string;
  multiple?: boolean;
  maxSize?: number;
  // Password
  showStrength?: boolean;
  showToggle?: boolean;
  minStrength?: number;
  // Date/time
  minDate?: string;
  maxDate?: string;
  format?: string;
  // Select
  searchable?: boolean;
  clearable?: boolean;
  // Checkbox
  indeterminate?: boolean;
}

/**
 * Conditional rule for field visibility
 */
export interface ConditionalRule {
  field: string;
  operator: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan' | 'isEmpty' | 'isNotEmpty';
  value?: any;
}

/**
 * Validator rule types
 */
export type ValidatorType =
  | 'required'
  | 'pattern'
  | 'minLength'
  | 'maxLength'
  | 'min'
  | 'max'
  | 'email'
  | 'url'
  | 'phone'
  | 'creditCard'
  | 'passwordStrength'
  | 'matchField'
  | 'custom'
  | 'ai';

/**
 * Validator rule
 */
export interface ValidatorRule {
  type: ValidatorType;
  value?: string | number | RegExp;
  message: string;
  /** Custom validator function */
  validator?: (value: any, formData: Record<string, any>) => boolean;
  /** Field to match (for matchField type) */
  matchField?: string;
}

/**
 * Validation stage (7-stage pipeline)
 */
export type ValidationStage =
  | 'required'      // Stage 1: Required field check
  | 'type'          // Stage 2: Type validation (email, url, phone, etc.)
  | 'format'        // Stage 3: Format validation (pattern, length)
  | 'range'         // Stage 4: Range validation (min/max)
  | 'custom'        // Stage 5: Custom validators
  | 'cross-field'   // Stage 6: Cross-field validation (matchField)
  | 'ai';           // Stage 7: AI semantic validation

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: FieldError[];
  warnings: FieldError[];
  suggestions?: FieldSuggestion[];
  stage?: ValidationStage;
  /** Per-field validation status */
  fieldStatus?: Record<string, FieldValidationStatus>;
}

/**
 * Per-field validation status
 */
export interface FieldValidationStatus {
  valid: boolean;
  errors: FieldError[];
  warnings: FieldError[];
  touched: boolean;
  dirty: boolean;
  validating: boolean;
}

/**
 * Field error
 */
export interface FieldError {
  field: string;
  message: string;
  type: 'error' | 'warning' | 'info';
  stage?: ValidationStage;
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
  autoApply?: boolean;
}

/**
 * Password strength result
 */
export interface PasswordStrength {
  score: number; // 0-4
  level: 'weak' | 'fair' | 'good' | 'strong' | 'very-strong';
  feedback: string[];
  hasUppercase: boolean;
  hasLowercase: boolean;
  hasNumber: boolean;
  hasSpecial: boolean;
  length: number;
}

/**
 * Form state
 */
export interface FormState {
  values: Record<string, any>;
  errors: Record<string, FieldError[]>;
  warnings: Record<string, FieldError[]>;
  touched: Record<string, boolean>;
  dirty: Record<string, boolean>;
  isValid: boolean;
  isSubmitting: boolean;
  isValidating: boolean;
  submitCount: number;
}

/**
 * Smart form configuration
 */
export interface SmartFormConfig {
  /** Enable AI validation */
  aiValidation?: boolean;
  /** Enable AI auto-correction suggestions */
  aiAutoCorrect?: boolean;
  /** Auto-apply AI corrections above this confidence */
  autoApplyThreshold?: number;
  /** Validate on blur */
  validateOnBlur?: boolean;
  /** Validate on change */
  validateOnChange?: boolean;
  /** Debounce time for validation (ms) */
  debounceTime?: number;
  /** Custom AI system prompt */
  systemPrompt?: string;
  /** Validation stages to run */
  stages?: ValidationStage[];
  /** Stop on first error */
  stopOnFirstError?: boolean;
  /** Show field hints */
  showHints?: boolean;
  /** Show password strength indicator */
  showPasswordStrength?: boolean;
  /** Theme */
  theme?: 'light' | 'dark' | 'auto';
  /** Custom error messages */
  messages?: Record<string, string>;
}

/**
 * Default configuration
 */
export const DEFAULT_SMARTFORM_CONFIG: SmartFormConfig = {
  aiValidation: true,
  aiAutoCorrect: true,
  autoApplyThreshold: 0.95,
  validateOnBlur: true,
  validateOnChange: false,
  debounceTime: 300,
  stages: ['required', 'type', 'format', 'range', 'custom', 'cross-field', 'ai'],
  stopOnFirstError: false,
  showHints: true,
  showPasswordStrength: true
};

/**
 * Default validation messages
 */
export const DEFAULT_MESSAGES: Record<string, string> = {
  required: '{label} is required',
  email: 'Please enter a valid email address',
  url: 'Please enter a valid URL',
  phone: 'Please enter a valid phone number',
  minLength: '{label} must be at least {value} characters',
  maxLength: '{label} must be no more than {value} characters',
  min: '{label} must be at least {value}',
  max: '{label} must be no more than {value}',
  pattern: '{label} format is invalid',
  matchField: '{label} must match {matchField}',
  passwordStrength: 'Password is too weak',
  creditCard: 'Please enter a valid credit card number'
};

