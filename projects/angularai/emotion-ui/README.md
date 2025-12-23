<div align="center">
  <h1>@angularai/emotion-ui</h1>
  <p>🎭 Emotion-aware UI components with sentiment analysis for Angular</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/emotion-ui"><img src="https://img.shields.io/npm/v/@angularai/emotion-ui.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/emotion-ui"><img src="https://img.shields.io/npm/dm/@angularai/emotion-ui.svg?style=flat-square" alt="npm downloads"></a>
    <a href="https://www.npmjs.com/package/@angularai/emotion-ui"><img src="https://img.shields.io/npm/l/@angularai/emotion-ui.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-17+-dd0031?style=flat-square&logo=angular" alt="Angular 17+"></a>
  </p>

  <p>
    <a href="https://github.com/reachbrt/angularai">GitHub</a> •
    <a href="https://angularai.netlify.app">Live Demo</a> •
    <a href="https://www.npmjs.com/package/@angularai/emotion-ui">npm</a>
  </p>
</div>

## Overview

`@angularai/emotion-ui` provides emotion-aware UI components that adapt based on sentiment analysis. Create empathetic user interfaces that respond to user emotions and provide appropriate feedback.

## ✨ Features

- **🎭 Sentiment Analysis**: Real-time emotion detection from text
- **🎨 Adaptive UI**: Components that change based on detected emotions
- **😊 Emoji Suggestions**: Context-aware emoji recommendations
- **📊 Emotion Tracking**: Track emotional patterns over time
- **🔧 Fully Typed**: Complete TypeScript support
- **🎯 Customizable**: Configure emotion thresholds and responses

## 📦 Installation

```bash
npm install @angularai/emotion-ui @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { EmotionInputComponent } from '@angularai/emotion-ui';

@Component({
  selector: 'app-feedback',
  standalone: true,
  imports: [EmotionInputComponent],
  template: `
    <emotion-input
      [provider]="'openai'"
      [apiKey]="apiKey"
      placeholder="How are you feeling today?"
      (emotionDetected)="onEmotionDetected($event)"
    />
  `
})
export class FeedbackComponent {
  apiKey = 'your-openai-api-key';

  onEmotionDetected(emotion: EmotionResult) {
    console.log('Detected emotion:', emotion);
    // { sentiment: 'positive', score: 0.85, emotions: ['happy', 'excited'] }
  }
}
```

### 2. Use the Emotion Service

```typescript
import { Component, inject } from '@angular/core';
import { EmotionService } from '@angularai/emotion-ui';

@Component({ ... })
export class EmotionComponent {
  private emotionService = inject(EmotionService);

  analyzeText(text: string) {
    this.emotionService.analyze(text).subscribe({
      next: (result) => {
        console.log('Sentiment:', result.sentiment);
        console.log('Score:', result.score);
        console.log('Emotions:', result.emotions);
      }
    });
  }
}
```

## 📖 API Reference

### EmotionService

```typescript
@Injectable({ providedIn: 'root' })
export class EmotionService {
  // Analyze text for emotions
  analyze(text: string): Observable<EmotionResult>;

  // Get emoji suggestions
  suggestEmojis(text: string): Observable<string[]>;

  // Get sentiment score (-1 to 1)
  getSentiment(text: string): Observable<number>;
}
```

### EmotionResult Interface

```typescript
interface EmotionResult {
  sentiment: 'positive' | 'negative' | 'neutral';
  score: number; // -1 to 1
  emotions: string[]; // ['happy', 'excited', 'grateful']
  confidence: number; // 0 to 1
}
```

### EmotionInputComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key |
| `placeholder` | `string` | `'Type here...'` | Input placeholder |
| `showEmoji` | `boolean` | `true` | Show emoji suggestions |
| `adaptiveColors` | `boolean` | `true` | Change colors based on emotion |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `emotionDetected` | `EventEmitter<EmotionResult>` | Emitted when emotion is detected |
| `textChanged` | `EventEmitter<string>` | Emitted when text changes |

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/chatbot](https://www.npmjs.com/package/@angularai/chatbot) | AI chat components |
| [@angularai/smart-notify](https://www.npmjs.com/package/@angularai/smart-notify) | Smart notifications |

## 🔗 Related Projects

| Framework | Repository | Status |
|-----------|-----------|--------|
| **Vue.js** | [@aivue](https://github.com/reachbrt/vueai) | ✅ Available |
| **React** | [@anthropic-ai/react](https://github.com/reachbrt/reactai) | ✅ Available |
| **Angular** | [@angularai](https://github.com/reachbrt/angularai) | ✅ Available |
| **Svelte** | [@svelteai](https://github.com/reachbrt/svelteai) | 💡 Planned |

## 📄 License

MIT © [AngularAI](https://github.com/reachbrt/angularai)
