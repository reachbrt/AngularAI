<div align="center">
  <h1>@angularai/autosuggest</h1>
  <p>✨ AI-powered suggestion components for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/autosuggest"><img src="https://img.shields.io/npm/v/@angularai/autosuggest.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/autosuggest"><img src="https://img.shields.io/npm/l/@angularai/autosuggest.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/autosuggest` provides AI-powered autocomplete and suggestion components for Angular applications. Enhance user input with intelligent, context-aware suggestions powered by AI.

## ✨ Features

- **🧠 AI-Powered Suggestions**: Context-aware suggestions using AI models
- **⚡ Real-time**: Instant suggestions as users type
- **🎯 Smart Ranking**: AI-ranked suggestions based on relevance
- **📱 Mobile-friendly**: Touch-optimized dropdown interface
- **🎨 Customizable**: Flexible styling with CSS variables
- **🔧 Fully Typed**: Complete TypeScript support
- **♿ Accessible**: ARIA-compliant keyboard navigation

## 📦 Installation

```bash
npm install @angularai/autosuggest @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { AiAutosuggestComponent } from '@angularai/autosuggest';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [AiAutosuggestComponent],
  template: `
    <ai-autosuggest
      [provider]="'openai'"
      [apiKey]="apiKey"
      placeholder="Search products..."
      (suggestionSelected)="onSelect($event)"
    />
  `
})
export class SearchComponent {
  apiKey = 'your-openai-api-key';

  onSelect(suggestion: string) {
    console.log('Selected:', suggestion);
  }
}
```

## 📖 Component API

### AiAutosuggestComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key for the provider |
| `placeholder` | `string` | `'Type to search...'` | Input placeholder |
| `minChars` | `number` | `2` | Minimum characters before suggestions |
| `maxSuggestions` | `number` | `5` | Maximum suggestions to show |
| `debounceTime` | `number` | `300` | Debounce time in ms |
| `context` | `string` | `''` | Context for AI suggestions |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `suggestionSelected` | `EventEmitter<string>` | Emitted when suggestion is selected |
| `inputChanged` | `EventEmitter<string>` | Emitted when input changes |

## 🔧 Advanced Usage

### With Custom Context

```typescript
<ai-autosuggest
  [provider]="'openai'"
  [apiKey]="apiKey"
  context="E-commerce product search for electronics store"
  placeholder="Search electronics..."
/>
```

### With Static Suggestions Fallback

```typescript
<ai-autosuggest
  [provider]="'openai'"
  [apiKey]="apiKey"
  [fallbackSuggestions]="['iPhone', 'Samsung', 'MacBook']"
/>
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/predictive-input](https://www.npmjs.com/package/@angularai/predictive-input) | Predictive text input |
| [@angularai/smartform](https://www.npmjs.com/package/@angularai/smartform) | AI form validation |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
