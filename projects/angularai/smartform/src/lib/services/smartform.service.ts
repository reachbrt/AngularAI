import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  FieldSchema, 
  ValidationResult, 
  FieldError, 
  FieldSuggestion, 
  SmartFormConfig,
  DEFAULT_SMARTFORM_CONFIG 
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
   * Validate form data using AI
   */
  validateForm(
    data: Record<string, any>, 
    schema: FieldSchema[]
  ): Observable<ValidationResult> {
    const errors: FieldError[] = [];
    
    // Run standard validators first
    for (const field of schema) {
      const value = data[field.name];
      const fieldErrors = this.runStandardValidators(field, value);
      errors.push(...fieldErrors);
    }

    // If AI validation is disabled or there are already errors, return
    if (!this.config.aiValidation || errors.length > 0) {
      return of({ valid: errors.length === 0, errors });
    }

    // Run AI validation
    return this.runAIValidation(data, schema).pipe(
      map(aiResult => ({
        valid: aiResult.errors.length === 0,
        errors: [...errors, ...aiResult.errors],
        suggestions: aiResult.suggestions
      })),
      catchError(() => of({ valid: errors.length === 0, errors }))
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

  private runStandardValidators(field: FieldSchema, value: any): FieldError[] {
    const errors: FieldError[] = [];

    if (field.required && !value) {
      errors.push({
        field: field.name,
        message: `${field.label || field.name} is required`,
        type: 'error'
      });
    }

    if (field.type === 'email' && value && !this.isValidEmail(value)) {
      errors.push({
        field: field.name,
        message: 'Please enter a valid email address',
        type: 'error'
      });
    }

    if (field.validators) {
      for (const validator of field.validators) {
        const error = this.runValidator(field, value, validator);
        if (error) errors.push(error);
      }
    }

    return errors;
  }

  private runValidator(field: FieldSchema, value: any, rule: any): FieldError | null {
    switch (rule.type) {
      case 'minLength':
        if (value && value.length < rule.value) {
          return { field: field.name, message: rule.message, type: 'error' };
        }
        break;
      case 'maxLength':
        if (value && value.length > rule.value) {
          return { field: field.name, message: rule.message, type: 'error' };
        }
        break;
      case 'pattern':
        if (value && !new RegExp(rule.value as string).test(value)) {
          return { field: field.name, message: rule.message, type: 'error' };
        }
        break;
    }
    return null;
  }

  private runAIValidation(
    data: Record<string, any>, 
    schema: FieldSchema[]
  ): Observable<{ errors: FieldError[]; suggestions: FieldSuggestion[] }> {
    const fieldsToValidate = schema.filter(f => f.aiValidation);
    if (fieldsToValidate.length === 0) {
      return of({ errors: [], suggestions: [] });
    }

    const prompt = `Validate these form fields and return JSON with errors and suggestions:
${fieldsToValidate.map(f => `${f.label || f.name} (${f.type}): "${data[f.name] || ''}"`).join('\n')}

Response format: {"errors": [], "suggestions": []}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseAIValidationResponse(response)),
      catchError(() => of({ errors: [], suggestions: [] }))
    );
  }

  private parseAIValidationResponse(response: string): { errors: FieldError[]; suggestions: FieldSuggestion[] } {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        return JSON.parse(match[0]);
      }
    } catch {}
    return { errors: [], suggestions: [] };
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
          reason: parsed.reason || ''
        };
      }
    } catch {}
    return null;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

