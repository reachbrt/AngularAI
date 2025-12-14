<div align="center">
  <h1>@angularai/analytics</h1>
  <p>📊 AI-powered analytics and insights for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/analytics"><img src="https://img.shields.io/npm/v/@angularai/analytics.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/analytics"><img src="https://img.shields.io/npm/l/@angularai/analytics.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/analytics` provides AI-powered analytics components and services for Angular applications. Track user behavior, analyze patterns, and gain insights with intelligent data visualization.

## ✨ Features

- **📈 Smart Analytics**: AI-powered data analysis and pattern recognition
- **📊 Interactive Dashboards**: Beautiful, responsive analytics dashboards
- **🔍 Trend Detection**: Automatic trend and anomaly detection
- **📱 Real-time Updates**: Live data streaming with RxJS
- **🎨 Customizable Charts**: Flexible chart components with theming support
- **🔧 Fully Typed**: Complete TypeScript support

## 📦 Installation

```bash
npm install @angularai/analytics @angularai/core
```

## 🚀 Quick Start

### 1. Import the Module

```typescript
import { Component } from '@angular/core';
import { AnalyticsDashboardComponent } from '@angularai/analytics';

@Component({
  selector: 'app-analytics',
  standalone: true,
  imports: [AnalyticsDashboardComponent],
  template: `
    <analytics-dashboard
      [data]="analyticsData"
      [config]="dashboardConfig"
    />
  `
})
export class AnalyticsComponent {
  analyticsData = {
    pageViews: 15420,
    uniqueVisitors: 8234,
    bounceRate: 42.5,
    avgSessionDuration: 185
  };

  dashboardConfig = {
    theme: 'light',
    refreshInterval: 30000
  };
}
```

### 2. Use the Analytics Service

```typescript
import { Component, inject } from '@angular/core';
import { AnalyticsService } from '@angularai/analytics';

@Component({ ... })
export class TrackingComponent {
  private analytics = inject(AnalyticsService);

  trackEvent(eventName: string, data: any) {
    this.analytics.track(eventName, data);
  }

  getInsights() {
    this.analytics.getInsights().subscribe(insights => {
      console.log('AI Insights:', insights);
    });
  }
}
```

## 📖 API Reference

### AnalyticsService

```typescript
@Injectable({ providedIn: 'root' })
export class AnalyticsService {
  // Track an event
  track(eventName: string, data?: any): void;

  // Get AI-powered insights
  getInsights(): Observable<Insight[]>;

  // Get trend analysis
  analyzeTrends(data: DataPoint[]): Observable<TrendAnalysis>;

  // Detect anomalies
  detectAnomalies(data: DataPoint[]): Observable<Anomaly[]>;
}
```

### AnalyticsDashboardComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `AnalyticsData` | `{}` | Analytics data to display |
| `config` | `DashboardConfig` | `{}` | Dashboard configuration |
| `theme` | `'light' \| 'dark'` | `'light'` | Color theme |
| `refreshInterval` | `number` | `0` | Auto-refresh interval (ms) |

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/chatbot](https://www.npmjs.com/package/@angularai/chatbot) | AI chat components |
| [@angularai/smart-datatable](https://www.npmjs.com/package/@angularai/smart-datatable) | AI data tables |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
