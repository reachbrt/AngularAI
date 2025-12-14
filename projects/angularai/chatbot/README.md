<div align="center">
  <h1>@angularai/chatbot</h1>
  <p>💬 AI-powered chat components for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/chatbot"><img src="https://img.shields.io/npm/v/@angularai/chatbot.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/chatbot"><img src="https://img.shields.io/npm/l/@angularai/chatbot.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/chatbot` provides ready-to-use chat components for Angular applications, powered by AI. Create engaging conversational interfaces with minimal setup, supporting multiple AI providers including OpenAI, Claude, Gemini, and more.

## ✨ Features

- **💬 Ready-to-use Chat UI**: Beautiful, responsive chat interface with minimal setup
- **🔄 Real-time Streaming**: See AI responses as they're generated, token by token
- **📱 Mobile-friendly**: Responsive design works on all devices and screen sizes
- **🎨 Customizable**: Easily style to match your application with CSS variables
- **🧠 Multiple AI Providers**: Works with OpenAI, Claude, Gemini, HuggingFace, and more
- **📝 Markdown Support**: Rich text formatting in messages with code highlighting
- **🔧 Fully Typed**: Complete TypeScript support with comprehensive type definitions
- **🚀 Standalone Components**: Angular 17+ standalone components with new control flow

## 📦 Installation

```bash
npm install @angularai/chatbot @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { AiChatWindowComponent } from '@angularai/chatbot';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [AiChatWindowComponent],
  template: `
    <ai-chat-window
      [provider]="'openai'"
      [apiKey]="apiKey"
      [model]="'gpt-4o'"
      title="AI Assistant"
      placeholder="Ask me anything..."
    />
  `
})
export class ChatComponent {
  apiKey = 'your-openai-api-key'; // Use environment variables in production
}
```

### 2. That's it!

You now have a fully functional AI chat interface in your Angular application.

## 📖 Component API

### AiChatWindowComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider ('openai', 'claude', 'gemini', etc.) |
| `apiKey` | `string` | `''` | API key for the provider |
| `model` | `string` | `'gpt-4o'` | Model to use |
| `title` | `string` | `'Chat'` | Title displayed in the chat header |
| `placeholder` | `string` | `'Type a message...'` | Input placeholder text |
| `systemPrompt` | `string` | `'You are a helpful assistant.'` | System prompt for AI behavior |
| `streaming` | `boolean` | `true` | Enable streaming responses |
| `showTimestamps` | `boolean` | `false` | Show message timestamps |
| `showCopyButton` | `boolean` | `true` | Show copy button on messages |
| `showAvatars` | `boolean` | `true` | Show user/assistant avatars |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `height` | `string` | `'500px'` | Chat window height |
| `width` | `string` | `'100%'` | Chat window width |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `messageSent` | `EventEmitter<Message>` | Emitted when user sends a message |
| `responseReceived` | `EventEmitter<Message>` | Emitted when AI response is received |
| `error` | `EventEmitter<Error>` | Emitted when an error occurs |

## 🎨 Customization

### CSS Variables

```css
:root {
  --ai-chat-bg: #ffffff;
  --ai-chat-border: #e0e0e0;
  --ai-chat-text: #333333;
  --ai-chat-user-bg: #e1f5fe;
  --ai-chat-assistant-bg: #f5f5f5;
  --ai-chat-input-bg: #ffffff;
  --ai-chat-button-bg: #2196f3;
  --ai-chat-button-text: #ffffff;
  --ai-chat-border-radius: 8px;
}
```

### Dark Theme

```typescript
<ai-chat-window
  [provider]="'openai'"
  [apiKey]="apiKey"
  theme="dark"
/>
```

## 🔧 Advanced Usage

### With Custom System Prompt

```typescript
<ai-chat-window
  [provider]="'openai'"
  [apiKey]="apiKey"
  [model]="'gpt-4o'"
  systemPrompt="You are a helpful coding assistant specializing in Angular."
  title="Angular Expert"
/>
```

### With Initial Messages

```typescript
@Component({
  template: `
    <ai-chat-window
      [provider]="'openai'"
      [apiKey]="apiKey"
      [initialMessages]="initialMessages"
    />
  `
})
export class ChatComponent {
  initialMessages = [
    { role: 'assistant', content: 'Hello! How can I help you today?' }
  ];
}
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/autosuggest](https://www.npmjs.com/package/@angularai/autosuggest) | Smart AI suggestions |
| [@angularai/smartform](https://www.npmjs.com/package/@angularai/smartform) | AI form validation |
| [@angularai/voice-actions](https://www.npmjs.com/package/@angularai/voice-actions) | Voice commands |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
