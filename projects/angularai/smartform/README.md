<div align="center">
  <h1>@angularai/smartform</h1>
  <p>📝 AI-powered form validation and generation for Angular</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/smartform"><img src="https://img.shields.io/npm/v/@angularai/smartform.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/smartform"><img src="https://img.shields.io/npm/l/@angularai/smartform.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/smartform` provides AI-powered form validation, auto-completion, and intelligent form generation for Angular applications. Create smarter forms with context-aware validation and suggestions.

## ✨ Features

- **🧠 AI Validation**: Intelligent validation beyond regex patterns
- **✨ Auto-Complete**: Smart field suggestions based on context
- **📋 Form Generation**: Generate forms from natural language descriptions
- **🔍 Error Messages**: AI-generated helpful error messages
- **📱 Responsive**: Mobile-friendly form layouts
- **🔧 Fully Typed**: Complete TypeScript support
- **🔗 Reactive Forms**: Full Angular Reactive Forms integration

## 📦 Installation

```bash
npm install @angularai/smartform @angularai/core
```

## 🚀 Quick Start

### 1. Import the Directive

```typescript
import { Component } from '@angular/core';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { AiValidatorDirective } from '@angularai/smartform';

@Component({
  selector: 'app-contact-form',
  standalone: true,
  imports: [ReactiveFormsModule, AiValidatorDirective],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input
        formControlName="email"
        aiValidator="email"
        [aiApiKey]="apiKey"
        placeholder="Email address"
      />

      <input
        formControlName="message"
        aiValidator="professional-message"
        [aiApiKey]="apiKey"
        placeholder="Your message"
      />

      <button type="submit">Submit</button>
    </form>
  `
})
export class ContactFormComponent {
  private fb = inject(FormBuilder);
  apiKey = 'your-openai-api-key';

  form = this.fb.group({
    email: ['', Validators.required],
    message: ['', Validators.required]
  });

  onSubmit() {
    if (this.form.valid) {
      console.log('Form submitted:', this.form.value);
    }
  }
}
```

### 2. Use the Smart Form Service

```typescript
import { Component, inject } from '@angular/core';
import { SmartFormService } from '@angularai/smartform';

@Component({ ... })
export class FormGeneratorComponent {
  private smartForm = inject(SmartFormService);

  generateForm() {
    this.smartForm.generateFromDescription(
      'Create a user registration form with name, email, password, and phone number'
    ).subscribe({
      next: (formConfig) => {
        console.log('Generated form config:', formConfig);
      }
    });
  }
}
```

## 📖 API Reference

### SmartFormService

```typescript
@Injectable({ providedIn: 'root' })
export class SmartFormService {
  // Generate form from description
  generateFromDescription(description: string): Observable<FormConfig>;

  // Validate field with AI
  validateField(value: string, context: string): Observable<ValidationResult>;

  // Get AI-powered suggestions
  getSuggestions(field: string, value: string): Observable<string[]>;

  // Generate helpful error message
  getErrorMessage(field: string, error: any): Observable<string>;
}
```

### AiValidatorDirective

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `aiValidator` | `string` | `''` | Validation context/type |
| `aiApiKey` | `string` | `''` | API key for AI provider |
| `aiProvider` | `string` | `'openai'` | AI provider |
| `aiDebounce` | `number` | `500` | Debounce time in ms |

## 🔧 Advanced Usage

### Custom Validation Context

```typescript
<input
  formControlName="bio"
  aiValidator="professional-bio"
  [aiContext]="'LinkedIn profile bio, max 300 characters'"
  [aiApiKey]="apiKey"
/>
```

### Form Generation from Schema

```typescript
const formConfig = await this.smartForm.generateFromSchema({
  type: 'registration',
  fields: ['name', 'email', 'password'],
  validation: 'strict'
}).toPromise();
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/autosuggest](https://www.npmjs.com/package/@angularai/autosuggest) | AI suggestions |
| [@angularai/predictive-input](https://www.npmjs.com/package/@angularai/predictive-input) | Predictive input |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
