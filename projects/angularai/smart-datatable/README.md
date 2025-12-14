<div align="center">
  <h1>@angularai/smart-datatable</h1>
  <p>📋 AI-powered data table components for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/smart-datatable"><img src="https://img.shields.io/npm/v/@angularai/smart-datatable.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/smart-datatable"><img src="https://img.shields.io/npm/l/@angularai/smart-datatable.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/smart-datatable` provides AI-enhanced data table components for Angular. Features intelligent sorting, filtering, natural language queries, and smart data insights.

## ✨ Features

- **🧠 AI-Powered Search**: Natural language queries for data filtering
- **📊 Smart Sorting**: Intelligent column sorting with AI ranking
- **🔍 Advanced Filtering**: Context-aware filtering suggestions
- **📈 Data Insights**: AI-generated insights from your data
- **📱 Responsive**: Mobile-friendly table layouts
- **🔧 Fully Typed**: Complete TypeScript support
- **⚡ Virtual Scrolling**: Handle large datasets efficiently

## 📦 Installation

```bash
npm install @angularai/smart-datatable @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { SmartDatatableComponent } from '@angularai/smart-datatable';

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [SmartDatatableComponent],
  template: `
    <smart-datatable
      [data]="users"
      [columns]="columns"
      [provider]="'openai'"
      [apiKey]="apiKey"
      [enableAISearch]="true"
    />
  `
})
export class DataTableComponent {
  apiKey = 'your-openai-api-key';

  columns = [
    { field: 'name', header: 'Name' },
    { field: 'email', header: 'Email' },
    { field: 'role', header: 'Role' }
  ];

  users = [
    { name: 'John Doe', email: 'john@example.com', role: 'Admin' },
    { name: 'Jane Smith', email: 'jane@example.com', role: 'User' }
  ];
}
```

## 📖 Component API

### SmartDatatableComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `data` | `any[]` | `[]` | Data array to display |
| `columns` | `Column[]` | `[]` | Column definitions |
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key |
| `enableAISearch` | `boolean` | `true` | Enable AI-powered search |
| `pageSize` | `number` | `10` | Rows per page |
| `sortable` | `boolean` | `true` | Enable sorting |
| `filterable` | `boolean` | `true` | Enable filtering |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `rowSelected` | `EventEmitter<any>` | Emitted when row is selected |
| `dataFiltered` | `EventEmitter<any[]>` | Emitted when data is filtered |
| `insightGenerated` | `EventEmitter<string>` | Emitted when AI generates insight |

## 🔧 Advanced Usage

### Natural Language Queries

```typescript
<smart-datatable
  [data]="salesData"
  [columns]="columns"
  [provider]="'openai'"
  [apiKey]="apiKey"
  [enableAISearch]="true"
  searchPlaceholder="Ask about your data..."
/>
```

Users can type queries like:
- "Show me sales over $1000"
- "Find customers from California"
- "Sort by highest revenue"

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/analytics](https://www.npmjs.com/package/@angularai/analytics) | AI analytics |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
