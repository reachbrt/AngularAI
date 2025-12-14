<div align="center">
  <h1>@angularai/doc-intelligence</h1>
  <p>📄 AI-powered document processing and OCR for Angular applications</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/doc-intelligence"><img src="https://img.shields.io/npm/v/@angularai/doc-intelligence.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/doc-intelligence"><img src="https://img.shields.io/npm/l/@angularai/doc-intelligence.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/doc-intelligence` provides AI-powered document processing, OCR, and text extraction capabilities for Angular applications. Extract text, analyze documents, and process PDFs with intelligent AI assistance.

## ✨ Features

- **📄 Document Processing**: Extract text from PDFs, images, and documents
- **🔍 OCR Support**: Optical character recognition for scanned documents
- **🧠 AI Analysis**: Intelligent document understanding and summarization
- **📊 Data Extraction**: Extract structured data from unstructured documents
- **🔧 Fully Typed**: Complete TypeScript support
- **📱 File Upload**: Drag-and-drop file upload component

## 📦 Installation

```bash
npm install @angularai/doc-intelligence @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { DocProcessorComponent } from '@angularai/doc-intelligence';

@Component({
  selector: 'app-doc-processor',
  standalone: true,
  imports: [DocProcessorComponent],
  template: `
    <doc-processor
      [provider]="'openai'"
      [apiKey]="apiKey"
      (textExtracted)="onTextExtracted($event)"
      (documentAnalyzed)="onAnalyzed($event)"
    />
  `
})
export class DocProcessorComponent {
  apiKey = 'your-openai-api-key';

  onTextExtracted(text: string) {
    console.log('Extracted text:', text);
  }

  onAnalyzed(analysis: DocumentAnalysis) {
    console.log('Document analysis:', analysis);
  }
}
```

### 2. Use the Document Service

```typescript
import { Component, inject } from '@angular/core';
import { DocIntelligenceService } from '@angularai/doc-intelligence';

@Component({ ... })
export class DocumentComponent {
  private docService = inject(DocIntelligenceService);

  async processDocument(file: File) {
    this.docService.extractText(file).subscribe({
      next: (text) => console.log('Extracted:', text),
      error: (err) => console.error('Error:', err)
    });
  }

  async summarizeDocument(file: File) {
    this.docService.summarize(file).subscribe({
      next: (summary) => console.log('Summary:', summary)
    });
  }
}
```

## 📖 API Reference

### DocIntelligenceService

```typescript
@Injectable({ providedIn: 'root' })
export class DocIntelligenceService {
  // Extract text from document
  extractText(file: File): Observable<string>;

  // Summarize document content
  summarize(file: File): Observable<string>;

  // Extract structured data
  extractData(file: File, schema: DataSchema): Observable<any>;

  // Analyze document
  analyze(file: File): Observable<DocumentAnalysis>;
}
```

### Supported File Types

| Type | Extensions | Status |
|------|------------|--------|
| **PDF** | .pdf | ✅ Available |
| **Images** | .jpg, .png, .gif | ✅ Available |
| **Documents** | .doc, .docx | ✅ Available |
| **Text** | .txt, .md | ✅ Available |

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/image-caption](https://www.npmjs.com/package/@angularai/image-caption) | AI image captioning |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
