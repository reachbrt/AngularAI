import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  FieldSchema,
  ValidationResult,
  FieldError,
  FieldSuggestion,
  PasswordStrength,
  ValidationStage,
  SmartFormConfig,
  ValidatorRule,
  DEFAULT_SMARTFORM_CONFIG,
  DEFAULT_MESSAGES
} from '../models/smartform.model';

@Injectable({
  providedIn: 'root'
})
export class SmartFormService {
  private config: SmartFormConfig = DEFAULT_SMARTFORM_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<SmartFormConfig>): void {
    this.config = { ...DEFAULT_SMARTFORM_CONFIG, ...config };
  }

  /**
   * Run the 7-stage validation pipeline
   */
  validateForm(
    data: Record<string, any>,
    schema: FieldSchema[]
  ): Observable<ValidationResult> {
    const errors: FieldError[] = [];
    const warnings: FieldError[] = [];
    const stages = this.config.stages || ['required', 'type', 'format', 'range', 'custom', 'cross-field', 'ai'];

    // Run stages 1-6 synchronously
    for (const stage of stages) {
      if (stage === 'ai') continue; // AI stage runs async

      for (const field of schema) {
        const value = data[field.name];
        const stageErrors = this.runValidationStage(stage, field, value, data, schema);
        errors.push(...stageErrors.filter(e => e.type === 'error'));
        warnings.push(...stageErrors.filter(e => e.type === 'warning'));
      }

      // Stop on first error if configured
      if (this.config.stopOnFirstError && errors.length > 0) {
        return of({ valid: false, errors, warnings, stage });
      }
    }

    // If AI validation is disabled or not in stages, return now
    if (!this.config.aiValidation || !stages.includes('ai')) {
      return of({ valid: errors.length === 0, errors, warnings });
    }

    // If there are already errors and stopOnFirstError, skip AI
    if (this.config.stopOnFirstError && errors.length > 0) {
      return of({ valid: false, errors, warnings });
    }

    // Run AI validation (Stage 7)
    return this.runAIValidation(data, schema).pipe(
      map(aiResult => ({
        valid: errors.length === 0 && aiResult.errors.length === 0,
        errors: [...errors, ...aiResult.errors],
        warnings: [...warnings, ...aiResult.warnings],
        suggestions: aiResult.suggestions,
        stage: 'ai' as ValidationStage
      })),
      catchError(() => of({ valid: errors.length === 0, errors, warnings }))
    );
  }

  /**
   * Validate a single field
   */
  validateField(
    field: FieldSchema,
    value: any,
    data: Record<string, any>,
    schema: FieldSchema[]
  ): Observable<FieldError[]> {
    const errors: FieldError[] = [];
    const stages = this.config.stages || ['required', 'type', 'format', 'range', 'custom', 'cross-field'];

    for (const stage of stages) {
      if (stage === 'ai') continue;
      const stageErrors = this.runValidationStage(stage, field, value, data, schema);
      errors.push(...stageErrors);
    }

    return of(errors);
  }

  /**
   * Run a specific validation stage
   */
  private runValidationStage(
    stage: ValidationStage,
    field: FieldSchema,
    value: any,
    data: Record<string, any>,
    schema: FieldSchema[]
  ): FieldError[] {
    switch (stage) {
      case 'required':
        return this.validateRequired(field, value);
      case 'type':
        return this.validateType(field, value);
      case 'format':
        return this.validateFormat(field, value);
      case 'range':
        return this.validateRange(field, value);
      case 'custom':
        return this.validateCustom(field, value, data);
      case 'cross-field':
        return this.validateCrossField(field, value, data, schema);
      default:
        return [];
    }
  }

  // ==================== Stage 1: Required ====================
  private validateRequired(field: FieldSchema, value: any): FieldError[] {
    if (!field.required) return [];

    const isEmpty = value === undefined || value === null || value === '' ||
                    (Array.isArray(value) && value.length === 0);

    if (isEmpty) {
      return [{
        field: field.name,
        message: this.getMessage('required', field),
        type: 'error',
        stage: 'required'
      }];
    }
    return [];
  }

  // ==================== Stage 2: Type Validation ====================
  private validateType(field: FieldSchema, value: any): FieldError[] {
    if (!value) return [];
    const errors: FieldError[] = [];

    switch (field.type) {
      case 'email':
        if (!this.isValidEmail(value)) {
          errors.push({
            field: field.name,
            message: this.getMessage('email', field),
            type: 'error',
            stage: 'type'
          });
        }
        break;
      case 'url':
        if (!this.isValidUrl(value)) {
          errors.push({
            field: field.name,
            message: this.getMessage('url', field),
            type: 'error',
            stage: 'type'
          });
        }
        break;
      case 'tel':
        if (!this.isValidPhone(value)) {
          errors.push({
            field: field.name,
            message: this.getMessage('phone', field),
            type: 'error',
            stage: 'type'
          });
        }
        break;
      case 'number':
      case 'range':
        if (isNaN(Number(value))) {
          errors.push({
            field: field.name,
            message: `${field.label || field.name} must be a number`,
            type: 'error',
            stage: 'type'
          });
        }
        break;
    }
    return errors;
  }

  // ==================== Stage 3: Format Validation ====================
  private validateFormat(field: FieldSchema, value: any): FieldError[] {
    if (!value || !field.validators) return [];
    const errors: FieldError[] = [];

    for (const rule of field.validators) {
      if (rule.type === 'pattern') {
        const pattern = typeof rule.value === 'string' ? new RegExp(rule.value) : rule.value as RegExp;
        if (!pattern.test(value)) {
          errors.push({
            field: field.name,
            message: rule.message || this.getMessage('pattern', field),
            type: 'error',
            stage: 'format'
          });
        }
      }
      if (rule.type === 'minLength' && value.length < (rule.value as number)) {
        errors.push({
          field: field.name,
          message: rule.message || this.getMessage('minLength', field, rule.value),
          type: 'error',
          stage: 'format'
        });
      }
      if (rule.type === 'maxLength' && value.length > (rule.value as number)) {
        errors.push({
          field: field.name,
          message: rule.message || this.getMessage('maxLength', field, rule.value),
          type: 'error',
          stage: 'format'
        });
      }
    }
    return errors;
  }

  // ==================== Stage 4: Range Validation ====================
  private validateRange(field: FieldSchema, value: any): FieldError[] {
    if (value === undefined || value === null) return [];
    const errors: FieldError[] = [];
    const config = field.config;

    if (config?.min !== undefined) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue < config.min) {
        errors.push({
          field: field.name,
          message: this.getMessage('min', field, config.min),
          type: 'error',
          stage: 'range'
        });
      }
    }

    if (config?.max !== undefined) {
      const numValue = Number(value);
      if (!isNaN(numValue) && numValue > config.max) {
        errors.push({
          field: field.name,
          message: this.getMessage('max', field, config.max),
          type: 'error',
          stage: 'range'
        });
      }
    }

    // Validate file size
    if (field.type === 'file' && config?.maxSize && value instanceof File) {
      if (value.size > config.maxSize) {
        errors.push({
          field: field.name,
          message: `File size exceeds maximum of ${this.formatBytes(config.maxSize)}`,
          type: 'error',
          stage: 'range'
        });
      }
    }

    return errors;
  }

  // ==================== Stage 5: Custom Validation ====================
  private validateCustom(field: FieldSchema, value: any, data: Record<string, any>): FieldError[] {
    if (!field.validators) return [];
    const errors: FieldError[] = [];

    for (const rule of field.validators) {
      if (rule.type === 'custom' && rule.validator) {
        if (!rule.validator(value, data)) {
          errors.push({
            field: field.name,
            message: rule.message,
            type: 'error',
            stage: 'custom'
          });
        }
      }
      if (rule.type === 'creditCard' && value) {
        if (!this.isValidCreditCard(value)) {
          errors.push({
            field: field.name,
            message: rule.message || this.getMessage('creditCard', field),
            type: 'error',
            stage: 'custom'
          });
        }
      }
      if (rule.type === 'passwordStrength') {
        const strength = this.checkPasswordStrength(value);
        const minStrength = field.config?.minStrength || 2;
        if (strength.score < minStrength) {
          errors.push({
            field: field.name,
            message: rule.message || this.getMessage('passwordStrength', field),
            type: 'error',
            stage: 'custom'
          });
        }
      }
    }
    return errors;
  }

  // ==================== Stage 6: Cross-Field Validation ====================
  private validateCrossField(
    field: FieldSchema,
    value: any,
    data: Record<string, any>,
    schema: FieldSchema[]
  ): FieldError[] {
    if (!field.validators) return [];
    const errors: FieldError[] = [];

    for (const rule of field.validators) {
      if (rule.type === 'matchField' && rule.matchField) {
        const matchValue = data[rule.matchField];
        if (value !== matchValue) {
          const matchFieldSchema = schema.find(f => f.name === rule.matchField);
          errors.push({
            field: field.name,
            message: rule.message || `${field.label || field.name} must match ${matchFieldSchema?.label || rule.matchField}`,
            type: 'error',
            stage: 'cross-field'
          });
        }
      }
    }
    return errors;
  }

  // ==================== Stage 7: AI Validation ====================
  private runAIValidation(
    data: Record<string, any>,
    schema: FieldSchema[]
  ): Observable<{ errors: FieldError[]; warnings: FieldError[]; suggestions: FieldSuggestion[] }> {
    const fieldsToValidate = schema.filter(f => f.aiValidation);
    if (fieldsToValidate.length === 0) {
      return of({ errors: [], warnings: [], suggestions: [] });
    }

    const prompt = `You are a form validation AI. Analyze these fields for semantic correctness, consistency, and potential issues.

Fields to validate:
${fieldsToValidate.map(f => `- ${f.label || f.name} (${f.type}): "${data[f.name] || ''}"`).join('\n')}

Check for:
- Semantic correctness (does the value make sense for the field type?)
- Data consistency (do related fields make sense together?)
- Potential typos or formatting issues
- Professional/appropriate content

Respond with JSON:
{
  "errors": [{"field": "fieldName", "message": "error description"}],
  "warnings": [{"field": "fieldName", "message": "warning description"}],
  "suggestions": [{"field": "fieldName", "original": "value", "suggested": "corrected", "confidence": 0.9, "reason": "why"}]
}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseAIValidationResponse(response)),
      catchError(() => of({ errors: [], warnings: [], suggestions: [] }))
    );
  }

  /**
   * Get AI-powered suggestions for a field value
   */
  getSuggestion(field: FieldSchema, value: string): Observable<FieldSuggestion | null> {
    if (!value || !this.config.aiAutoCorrect) {
      return of(null);
    }

    const prompt = `Analyze and correct if needed:
Field: ${field.label || field.name} (${field.type})
Value: "${value}"

If the value has errors or could be improved, respond with JSON:
{"corrected": "corrected value", "confidence": 0.95, "reason": "explanation"}

If the value is correct, respond with: {"correct": true}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseSuggestionResponse(field.name, value, response)),
      catchError(() => of(null))
    );
  }

  /**
   * Check password strength
   */
  checkPasswordStrength(password: string): PasswordStrength {
    if (!password) {
      return {
        score: 0,
        level: 'weak',
        feedback: ['Password is required'],
        hasUppercase: false,
        hasLowercase: false,
        hasNumber: false,
        hasSpecial: false,
        length: 0
      };
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[^A-Za-z0-9]/.test(password);
    const length = password.length;

    let score = 0;
    const feedback: string[] = [];

    if (length >= 8) score++;
    else feedback.push('Use at least 8 characters');

    if (length >= 12) score++;

    if (hasUppercase && hasLowercase) score++;
    else feedback.push('Use both uppercase and lowercase letters');

    if (hasNumber) score++;
    else feedback.push('Add a number');

    if (hasSpecial) score++;
    else feedback.push('Add a special character');

    // Normalize to 0-4 scale
    score = Math.min(4, Math.floor(score * 0.8));

    const levels: Array<'weak' | 'fair' | 'good' | 'strong' | 'very-strong'> =
      ['weak', 'fair', 'good', 'strong', 'very-strong'];

    return {
      score,
      level: levels[score],
      feedback,
      hasUppercase,
      hasLowercase,
      hasNumber,
      hasSpecial,
      length
    };
  }

  // ==================== Helper Methods ====================

  private getMessage(key: string, field: FieldSchema, value?: any): string {
    const template = this.config.messages?.[key] || DEFAULT_MESSAGES[key] || key;
    return template
      .replace('{label}', field.label || field.name)
      .replace('{value}', String(value || ''))
      .replace('{matchField}', String(value || ''));
  }

  private parseAIValidationResponse(response: string): {
    errors: FieldError[];
    warnings: FieldError[];
    suggestions: FieldSuggestion[]
  } {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          errors: (parsed.errors || []).map((e: any) => ({
            field: e.field,
            message: e.message,
            type: 'error' as const,
            stage: 'ai' as ValidationStage
          })),
          warnings: (parsed.warnings || []).map((w: any) => ({
            field: w.field,
            message: w.message,
            type: 'warning' as const,
            stage: 'ai' as ValidationStage
          })),
          suggestions: (parsed.suggestions || []).map((s: any) => ({
            field: s.field,
            originalValue: s.original,
            suggestedValue: s.suggested,
            confidence: s.confidence || 0.8,
            reason: s.reason || '',
            autoApply: s.confidence >= (this.config.autoApplyThreshold || 0.95)
          }))
        };
      }
    } catch {}
    return { errors: [], warnings: [], suggestions: [] };
  }

  private parseSuggestionResponse(field: string, original: string, response: string): FieldSuggestion | null {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.correct) return null;
        return {
          field,
          originalValue: original,
          suggestedValue: parsed.corrected,
          confidence: parsed.confidence || 0.8,
          reason: parsed.reason || '',
          autoApply: parsed.confidence >= (this.config.autoApplyThreshold || 0.95)
        };
      }
    } catch {}
    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidPhone(phone: string): boolean {
    // Basic phone validation - allows various formats
    return /^[\d\s\-\+\(\)]{7,20}$/.test(phone.replace(/\s/g, ''));
  }

  private isValidCreditCard(card: string): boolean {
    // Luhn algorithm
    const digits = card.replace(/\D/g, '');
    if (digits.length < 13 || digits.length > 19) return false;

    let sum = 0;
    let isEven = false;

    for (let i = digits.length - 1; i >= 0; i--) {
      let digit = parseInt(digits[i], 10);
      if (isEven) {
        digit *= 2;
        if (digit > 9) digit -= 9;
      }
      sum += digit;
      isEven = !isEven;
    }

    return sum % 10 === 0;
  }

  private formatBytes(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }
}

