<div align="center">
  <h1>@angularai/voice-actions</h1>
  <p>🎤 Voice command integration for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/voice-actions"><img src="https://img.shields.io/npm/v/@angularai/voice-actions.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/voice-actions"><img src="https://img.shields.io/npm/dm/@angularai/voice-actions.svg?style=flat-square" alt="npm downloads"></a>
    <a href="https://www.npmjs.com/package/@angularai/voice-actions"><img src="https://img.shields.io/npm/l/@angularai/voice-actions.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-17+-dd0031?style=flat-square&logo=angular" alt="Angular 17+"></a>
  </p>

  <p>
    <a href="https://github.com/reachbrt/angularai">GitHub</a> •
    <a href="https://angularai.netlify.app">Live Demo</a> •
    <a href="https://www.npmjs.com/package/@angularai/voice-actions">npm</a>
  </p>
</div>

## Overview

`@angularai/voice-actions` provides voice command integration for Angular applications. Add speech-to-text input, voice-activated commands, and text-to-speech responses with AI-powered natural language understanding.

## ✨ Features

- **🎤 Speech-to-Text**: Convert voice to text input
- **🔊 Text-to-Speech**: Read responses aloud
- **🧠 AI Understanding**: Natural language command processing
- **🌍 Multi-Language**: Support for 50+ languages
- **⚡ Real-time**: Live transcription as you speak
- **🔧 Fully Typed**: Complete TypeScript support
- **📱 Mobile Support**: Works on mobile browsers

## 📦 Installation

```bash
npm install @angularai/voice-actions @angularai/core
```

## 🚀 Quick Start

### 1. Voice Input Component

```typescript
import { Component } from '@angular/core';
import { VoiceInputComponent } from '@angularai/voice-actions';

@Component({
  selector: 'app-voice-search',
  standalone: true,
  imports: [VoiceInputComponent],
  template: `
    <voice-input
      [language]="'en-US'"
      placeholder="Click mic to speak..."
      (transcriptChanged)="onTranscript($event)"
      (commandDetected)="onCommand($event)"
    />
  `
})
export class VoiceSearchComponent {
  onTranscript(text: string) {
    console.log('Transcribed:', text);
  }

  onCommand(command: VoiceCommand) {
    console.log('Command detected:', command);
  }
}
```

### 2. Voice Actions Service

```typescript
import { Component, inject } from '@angular/core';
import { VoiceActionsService } from '@angularai/voice-actions';

@Component({ ... })
export class VoiceComponent {
  private voice = inject(VoiceActionsService);

  startListening() {
    this.voice.startListening({
      language: 'en-US',
      continuous: true
    }).subscribe({
      next: (result) => {
        console.log('Heard:', result.transcript);
        if (result.isFinal) {
          this.processCommand(result.transcript);
        }
      }
    });
  }

  speak(text: string) {
    this.voice.speak(text, {
      language: 'en-US',
      rate: 1.0,
      pitch: 1.0
    });
  }

  stopListening() {
    this.voice.stopListening();
  }
}
```

## 📖 API Reference

### VoiceActionsService

```typescript
@Injectable({ providedIn: 'root' })
export class VoiceActionsService {
  // Start listening for voice input
  startListening(options?: ListenOptions): Observable<SpeechResult>;

  // Stop listening
  stopListening(): void;

  // Text-to-speech
  speak(text: string, options?: SpeakOptions): Promise<void>;

  // Stop speaking
  stopSpeaking(): void;

  // Check if listening
  isListening(): boolean;

  // Check if speaking
  isSpeaking(): boolean;

  // Get supported languages
  getSupportedLanguages(): string[];
}
```

### VoiceInputComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `language` | `string` | `'en-US'` | Recognition language |
| `continuous` | `boolean` | `false` | Continuous listening |
| `placeholder` | `string` | `'Speak...'` | Input placeholder |
| `showTranscript` | `boolean` | `true` | Show live transcript |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `transcriptChanged` | `EventEmitter<string>` | Emitted on transcript update |
| `commandDetected` | `EventEmitter<VoiceCommand>` | Emitted when command detected |
| `listeningStarted` | `EventEmitter<void>` | Emitted when listening starts |
| `listeningStopped` | `EventEmitter<void>` | Emitted when listening stops |

## 🔧 Advanced Usage

### Custom Voice Commands

```typescript
import { Component, inject } from '@angular/core';
import { VoiceCommandsService } from '@angularai/voice-actions';

@Component({ ... })
export class CommandsComponent {
  private commands = inject(VoiceCommandsService);

  ngOnInit() {
    this.commands.register([
      {
        phrase: 'navigate to home',
        action: () => this.router.navigate(['/home'])
      },
      {
        phrase: 'search for *',
        action: (query) => this.search(query)
      },
      {
        phrase: 'scroll down',
        action: () => window.scrollBy(0, 500)
      }
    ]);

    this.commands.startListening();
  }
}
```

### AI-Powered Command Understanding

```typescript
<voice-input
  [provider]="'openai'"
  [apiKey]="apiKey"
  [aiUnderstanding]="true"
  (commandDetected)="onCommand($event)"
/>
```

## 🌍 Supported Languages

| Language | Code | Status |
|----------|------|--------|
| English (US) | en-US | ✅ |
| English (UK) | en-GB | ✅ |
| Spanish | es-ES | ✅ |
| French | fr-FR | ✅ |
| German | de-DE | ✅ |
| Italian | it-IT | ✅ |
| Portuguese | pt-BR | ✅ |
| Japanese | ja-JP | ✅ |
| Korean | ko-KR | ✅ |
| Chinese | zh-CN | ✅ |

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/chatbot](https://www.npmjs.com/package/@angularai/chatbot) | AI chat components |

## 🔗 Related Projects

| Framework | Repository | Status |
|-----------|-----------|--------|
| **Vue.js** | [@aivue](https://github.com/reachbrt/vueai) | ✅ Available |
| **React** | [@anthropic-ai/react](https://github.com/reachbrt/reactai) | ✅ Available |
| **Angular** | [@angularai](https://github.com/reachbrt/angularai) | ✅ Available |
| **Svelte** | [@svelteai](https://github.com/reachbrt/svelteai) | 💡 Planned |

## 📄 License

MIT © [AngularAI](https://github.com/reachbrt/angularai)
