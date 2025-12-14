<div align="center">
  <h1>@angularai/smart-notify</h1>
  <p>🔔 Intelligent notification system for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/smart-notify"><img src="https://img.shields.io/npm/v/@angularai/smart-notify.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/smart-notify"><img src="https://img.shields.io/npm/l/@angularai/smart-notify.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/smart-notify` provides an intelligent notification system for Angular applications. Features AI-powered message optimization, smart timing, and context-aware notifications.

## ✨ Features

- **🧠 AI-Optimized Messages**: Improve notification clarity with AI
- **⏰ Smart Timing**: Optimal notification timing based on user behavior
- **🎯 Context-Aware**: Notifications adapt to user context
- **📱 Multi-Channel**: Toast, push, email notification support
- **🎨 Customizable**: Flexible styling and positioning
- **🔧 Fully Typed**: Complete TypeScript support

## 📦 Installation

```bash
npm install @angularai/smart-notify @angularai/core
```

## 🚀 Quick Start

### 1. Import the Service

```typescript
import { Component, inject } from '@angular/core';
import { SmartNotifyService } from '@angularai/smart-notify';

@Component({
  selector: 'app-example',
  template: `
    <button (click)="showSuccess()">Show Success</button>
    <button (click)="showError()">Show Error</button>
  `
})
export class ExampleComponent {
  private notify = inject(SmartNotifyService);

  showSuccess() {
    this.notify.success('Operation completed successfully!');
  }

  showError() {
    this.notify.error('Something went wrong. Please try again.');
  }
}
```

### 2. Add the Container Component

```typescript
import { Component } from '@angular/core';
import { NotificationContainerComponent } from '@angularai/smart-notify';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [NotificationContainerComponent],
  template: `
    <notification-container position="top-right" />
    <router-outlet />
  `
})
export class AppComponent {}
```

## 📖 API Reference

### SmartNotifyService

```typescript
@Injectable({ providedIn: 'root' })
export class SmartNotifyService {
  // Show success notification
  success(message: string, options?: NotifyOptions): void;

  // Show error notification
  error(message: string, options?: NotifyOptions): void;

  // Show warning notification
  warning(message: string, options?: NotifyOptions): void;

  // Show info notification
  info(message: string, options?: NotifyOptions): void;

  // AI-optimized notification
  smart(message: string, options?: SmartNotifyOptions): void;

  // Clear all notifications
  clear(): void;
}
```

### NotifyOptions Interface

```typescript
interface NotifyOptions {
  duration?: number; // Auto-dismiss time in ms
  position?: 'top-right' | 'top-left' | 'bottom-right' | 'bottom-left';
  dismissible?: boolean;
  icon?: string;
  action?: { label: string; callback: () => void };
}
```

### NotificationContainerComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `position` | `string` | `'top-right'` | Container position |
| `maxNotifications` | `number` | `5` | Max visible notifications |
| `animationDuration` | `number` | `300` | Animation duration in ms |

## 🔧 Advanced Usage

### AI-Optimized Notifications

```typescript
import { Component, inject } from '@angular/core';
import { SmartNotifyService } from '@angularai/smart-notify';

@Component({ ... })
export class SmartNotifyComponent {
  private notify = inject(SmartNotifyService);

  showSmartNotification() {
    // AI will optimize the message for clarity
    this.notify.smart('ur order is procesing pls wait', {
      provider: 'openai',
      apiKey: 'your-api-key',
      optimize: true
    });
    // Result: "Your order is being processed. Please wait."
  }
}
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/emotion-ui](https://www.npmjs.com/package/@angularai/emotion-ui) | Emotion-aware UI |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
