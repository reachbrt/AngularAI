<div align="center">
  <h1>@angularai/predictive-input</h1>
  <p>🧠 AI-powered predictive text input for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/predictive-input"><img src="https://img.shields.io/npm/v/@angularai/predictive-input.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/predictive-input"><img src="https://img.shields.io/npm/dm/@angularai/predictive-input.svg?style=flat-square" alt="npm downloads"></a>
    <a href="https://www.npmjs.com/package/@angularai/predictive-input"><img src="https://img.shields.io/npm/l/@angularai/predictive-input.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-17+-dd0031?style=flat-square&logo=angular" alt="Angular 17+"></a>
  </p>

  <p>
    <a href="https://github.com/reachbrt/angularai">GitHub</a> •
    <a href="https://angularai.netlify.app">Live Demo</a> •
    <a href="https://www.npmjs.com/package/@angularai/predictive-input">npm</a>
  </p>
</div>

## Overview

`@angularai/predictive-input` provides AI-powered predictive text input components for Angular. Enhance user experience with intelligent text predictions, auto-completion, and smart suggestions.

## ✨ Features

- **🧠 AI Predictions**: Context-aware text predictions using AI
- **⚡ Real-time**: Instant predictions as users type
- **⌨️ Tab to Complete**: Accept predictions with Tab key
- **🎯 Smart Context**: Learns from input context
- **📱 Mobile-friendly**: Touch-optimized interface
- **🔧 Fully Typed**: Complete TypeScript support

## 📦 Installation

```bash
npm install @angularai/predictive-input @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { PredictiveInputComponent } from '@angularai/predictive-input';

@Component({
  selector: 'app-editor',
  standalone: true,
  imports: [PredictiveInputComponent],
  template: `
    <predictive-input
      [provider]="'openai'"
      [apiKey]="apiKey"
      placeholder="Start typing..."
      (textChanged)="onTextChange($event)"
    />
  `
})
export class EditorComponent {
  apiKey = 'your-openai-api-key';

  onTextChange(text: string) {
    console.log('Current text:', text);
  }
}
```

## 📖 Component API

### PredictiveInputComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key |
| `placeholder` | `string` | `'Type here...'` | Input placeholder |
| `context` | `string` | `''` | Context for predictions |
| `debounceTime` | `number` | `300` | Debounce time in ms |
| `maxPredictionLength` | `number` | `50` | Max prediction length |
| `showGhostText` | `boolean` | `true` | Show ghost text preview |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `textChanged` | `EventEmitter<string>` | Emitted when text changes |
| `predictionAccepted` | `EventEmitter<string>` | Emitted when prediction is accepted |

## 🔧 Advanced Usage

### With Custom Context

```typescript
<predictive-input
  [provider]="'openai'"
  [apiKey]="apiKey"
  context="Writing a professional email to a client"
  placeholder="Dear..."
/>
```

### Multi-line Text Area

```typescript
<predictive-textarea
  [provider]="'openai'"
  [apiKey]="apiKey"
  [rows]="5"
  placeholder="Write your content..."
/>
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/autosuggest](https://www.npmjs.com/package/@angularai/autosuggest) | AI suggestions |
| [@angularai/smartform](https://www.npmjs.com/package/@angularai/smartform) | AI form validation |

## 🔗 Related Projects

| Framework | Repository | Status |
|-----------|-----------|--------|
| **Vue.js** | [@aivue](https://github.com/reachbrt/vueai) | ✅ Available |
| **React** | [@anthropic-ai/react](https://github.com/reachbrt/reactai) | ✅ Available |
| **Angular** | [@angularai](https://github.com/reachbrt/angularai) | ✅ Available |
| **Svelte** | [@svelteai](https://github.com/reachbrt/svelteai) | 💡 Planned |

## 📄 License

MIT © [AngularAI](https://github.com/reachbrt/angularai)
