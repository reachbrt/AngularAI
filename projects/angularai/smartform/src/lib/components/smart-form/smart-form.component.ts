import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SmartFormService } from '../../services/smartform.service';
import { FieldSchema, ValidationResult, FieldError, FieldSuggestion, SmartFormConfig } from '../../models/smartform.model';

@Component({
  selector: 'ai-smart-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './smart-form.component.html',
  styleUrl: './smart-form.component.scss'
})
export class SmartFormComponent implements OnInit {
  @Input({ required: true }) schema: FieldSchema[] = [];
  @Input() formData: Record<string, any> = {};
  @Input() config: SmartFormConfig = {};

  @Output() formDataChange = new EventEmitter<Record<string, any>>();
  @Output() submit = new EventEmitter<Record<string, any>>();
  @Output() validationResult = new EventEmitter<ValidationResult>();

  errors: Record<string, FieldError[]> = {};
  suggestions: Record<string, FieldSuggestion> = {};
  isValidating = false;

  constructor(private smartFormService: SmartFormService) {}

  ngOnInit(): void {
    this.smartFormService.configure(this.config);
  }

  onFieldChange(field: FieldSchema, value: any): void {
    this.formData[field.name] = value;
    this.formDataChange.emit(this.formData);

    if (this.config.validateOnChange) {
      this.validateField(field, value);
    }
  }

  onFieldBlur(field: FieldSchema): void {
    if (this.config.validateOnBlur !== false) {
      this.validateField(field, this.formData[field.name]);
    }
  }

  validateField(field: FieldSchema, value: any): void {
    // Get AI suggestion if enabled
    if (field.aiAutoCorrect && value) {
      this.smartFormService.getSuggestion(field, value).subscribe(suggestion => {
        if (suggestion) {
          this.suggestions[field.name] = suggestion;
        } else {
          delete this.suggestions[field.name];
        }
      });
    }
  }

  applySuggestion(fieldName: string): void {
    const suggestion = this.suggestions[fieldName];
    if (suggestion) {
      this.formData[fieldName] = suggestion.suggestedValue;
      this.formDataChange.emit(this.formData);
      delete this.suggestions[fieldName];
    }
  }

  dismissSuggestion(fieldName: string): void {
    delete this.suggestions[fieldName];
  }

  async onSubmit(): Promise<void> {
    this.isValidating = true;
    this.errors = {};

    this.smartFormService.validateForm(this.formData, this.schema).subscribe({
      next: (result) => {
        this.isValidating = false;
        
        // Group errors by field
        for (const error of result.errors) {
          if (!this.errors[error.field]) {
            this.errors[error.field] = [];
          }
          this.errors[error.field].push(error);
        }

        this.validationResult.emit(result);

        if (result.valid) {
          this.submit.emit(this.formData);
        }
      },
      error: () => {
        this.isValidating = false;
      }
    });
  }

  getFieldErrors(fieldName: string): FieldError[] {
    return this.errors[fieldName] || [];
  }

  hasError(fieldName: string): boolean {
    return this.getFieldErrors(fieldName).length > 0;
  }

  hasSuggestion(fieldName: string): boolean {
    return !!this.suggestions[fieldName];
  }
}

