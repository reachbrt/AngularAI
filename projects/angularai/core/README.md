<div align="center">
  <h1>@angularai/core</h1>
  <p>🧠 Core AI functionality for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/core"><img src="https://img.shields.io/npm/v/@angularai/core.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/core"><img src="https://img.shields.io/npm/dm/@angularai/core.svg?style=flat-square" alt="npm downloads"></a>
    <a href="https://www.npmjs.com/package/@angularai/core"><img src="https://img.shields.io/npm/l/@angularai/core.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-17+-dd0031?style=flat-square&logo=angular" alt="Angular 17+"></a>
  </p>

  <p>
    <a href="https://github.com/reachbrt/angularai">GitHub</a> •
    <a href="https://angularai.netlify.app">Live Demo</a> •
    <a href="https://www.npmjs.com/package/@angularai/core">npm</a>
  </p>
</div>

## Overview

`@angularai/core` provides a unified interface for working with multiple AI providers in Angular applications. It serves as the foundation for all AngularAI components, offering a consistent API for interacting with various AI services.

## ✨ Features

- **🔌 Multi-provider support**: Works with OpenAI, Claude, Gemini, HuggingFace, Ollama, DeepSeek, and more
- **🌐 Fallback mechanism**: Continues to work even without API keys during development
- **🔄 Streaming support**: Real-time streaming of AI responses via RxJS Observables
- **🛡️ Type safety**: Full TypeScript support with comprehensive type definitions
- **🧩 Modular design**: Use only what you need with tree-shakable exports
- **🔧 Customizable**: Configure providers, models, and parameters
- **📱 Angular-native**: Built with Angular services, dependency injection, and RxJS

## 📦 Installation

```bash
npm install @angularai/core
```

## 🚀 Quick Start

### 1. Configure the AI Provider

In your `app.config.ts` or module:

```typescript
import { ApplicationConfig } from '@angular/core';
import { provideAIClient, AI_CONFIG } from '@angularai/core';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAIClient({
      provider: 'openai',
      apiKey: 'your-api-key', // Use environment variables in production
      model: 'gpt-4o'
    })
  ]
};
```

### 2. Use the AI Client Service

```typescript
import { Component, inject } from '@angular/core';
import { AIClientService } from '@angularai/core';

@Component({
  selector: 'app-example',
  template: `
    <button (click)="askAI()">Ask AI</button>
    <p>{{ response }}</p>
  `
})
export class ExampleComponent {
  private aiClient = inject(AIClientService);
  response = '';

  askAI() {
    this.aiClient.chat([
      { role: 'user', content: 'Hello, can you help me with Angular?' }
    ]).subscribe({
      next: (response) => this.response = response,
      error: (error) => console.error('Error:', error)
    });
  }
}
```

## 🔄 Streaming Responses

```typescript
import { Component, inject } from '@angular/core';
import { AIClientService } from '@angularai/core';

@Component({
  selector: 'app-streaming',
  template: `
    <button (click)="streamResponse()">Stream Response</button>
    <p>{{ streamedText }}</p>
  `
})
export class StreamingComponent {
  private aiClient = inject(AIClientService);
  streamedText = '';

  streamResponse() {
    this.streamedText = '';

    this.aiClient.chatStream([
      { role: 'user', content: 'Write a short poem about Angular' }
    ]).subscribe({
      next: (token) => this.streamedText += token,
      complete: () => console.log('Stream complete'),
      error: (error) => console.error('Error:', error)
    });
  }
}
```

## 🔑 Supported Providers

| Provider | Models | Status |
|----------|--------|--------|
| **OpenAI** | GPT-4o, GPT-4, GPT-3.5-turbo | ✅ Available |
| **Anthropic** | Claude 3.5 Sonnet, Claude 3 Opus | ✅ Available |
| **Google** | Gemini Pro, Gemini Ultra | ✅ Available |
| **HuggingFace** | Open-source models | ✅ Available |
| **Ollama** | Local LLM deployment | ✅ Available |
| **DeepSeek** | DeepSeek models | ✅ Available |
| **Fallback** | Mock responses for development | ✅ Available |

## 📖 API Reference

### AIClientService

```typescript
@Injectable({ providedIn: 'root' })
export class AIClientService {
  // Send a chat request
  chat(messages: Message[], options?: ChatOptions): Observable<string>;

  // Stream a chat response token by token
  chatStream(messages: Message[], options?: ChatOptions): Observable<string>;

  // Simple ask method for single questions
  ask(prompt: string, options?: ChatOptions): Observable<string>;

  // Configure the AI client
  configure(config: AIConfig): void;
}
```

### Configuration Options

```typescript
interface AIConfig {
  provider: 'openai' | 'claude' | 'gemini' | 'huggingface' | 'ollama' | 'deepseek' | 'fallback';
  apiKey?: string;
  model?: string;
  baseUrl?: string;
  organizationId?: string;
  temperature?: number;
  maxTokens?: number;
}
```

### Message Interface

```typescript
interface Message {
  role: 'system' | 'user' | 'assistant';
  content: string;
}
```

## 🔧 Advanced Configuration

### Runtime Configuration

```typescript
import { Component, inject } from '@angular/core';
import { AIClientService } from '@angularai/core';

@Component({ ... })
export class ConfigComponent {
  private aiClient = inject(AIClientService);

  switchToClaudeAI() {
    this.aiClient.configure({
      provider: 'claude',
      apiKey: 'your-anthropic-key',
      model: 'claude-3-sonnet-20240229'
    });
  }
}
```

### Using with Environment Variables

```typescript
// environment.ts
export const environment = {
  openaiApiKey: 'your-api-key'
};

// app.config.ts
import { environment } from './environments/environment';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAIClient({
      provider: 'openai',
      apiKey: environment.openaiApiKey
    })
  ]
};
```

## 📦 Related Packages

Explore the complete @angularai ecosystem:

| Package | Description |
|---------|-------------|
| [@angularai/chatbot](https://www.npmjs.com/package/@angularai/chatbot) | AI-powered chat components |
| [@angularai/autosuggest](https://www.npmjs.com/package/@angularai/autosuggest) | Smart AI suggestions |
| [@angularai/smartform](https://www.npmjs.com/package/@angularai/smartform) | AI form validation |
| [@angularai/analytics](https://www.npmjs.com/package/@angularai/analytics) | AI-powered analytics |
| [@angularai/image-caption](https://www.npmjs.com/package/@angularai/image-caption) | AI image captioning |
| [@angularai/emotion-ui](https://www.npmjs.com/package/@angularai/emotion-ui) | Emotion-aware UI |
| [@angularai/doc-intelligence](https://www.npmjs.com/package/@angularai/doc-intelligence) | Document processing |
| [@angularai/predictive-input](https://www.npmjs.com/package/@angularai/predictive-input) | Predictive text input |
| [@angularai/smart-notify](https://www.npmjs.com/package/@angularai/smart-notify) | Smart notifications |
| [@angularai/voice-actions](https://www.npmjs.com/package/@angularai/voice-actions) | Voice commands |
| [@angularai/smart-datatable](https://www.npmjs.com/package/@angularai/smart-datatable) | AI data tables |
| [@angularai/spin-360](https://www.npmjs.com/package/@angularai/spin-360) | 360° product viewer with AI generation |

## 🔗 Related Projects

| Framework | Repository | Status |
|-----------|-----------|--------|
| **Vue.js** | [@aivue](https://github.com/reachbrt/vueai) | ✅ Available |
| **React** | [@anthropic-ai/react](https://github.com/reachbrt/reactai) | ✅ Available |
| **Angular** | [@angularai](https://github.com/reachbrt/angularai) | ✅ Available |
| **Svelte** | [@svelteai](https://github.com/reachbrt/svelteai) | 💡 Planned |

## 📄 License

MIT © [AngularAI](https://github.com/reachbrt/angularai)
