<div align="center">
  <h1>@angularai/image-caption</h1>
  <p>🖼️ AI-powered image captioning with OpenAI Vision for Angular</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/image-caption"><img src="https://img.shields.io/npm/v/@angularai/image-caption.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/image-caption"><img src="https://img.shields.io/npm/l/@angularai/image-caption.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/image-caption` provides AI-powered image captioning and analysis using OpenAI Vision models. Generate descriptive captions, extract text from images, and analyze visual content.

## ✨ Features

- **🖼️ Image Captioning**: Generate descriptive captions for images
- **🔍 Visual Analysis**: Detailed image content analysis
- **📝 Text Extraction**: OCR capabilities for text in images
- **🏷️ Object Detection**: Identify objects and elements in images
- **🎨 Style Analysis**: Detect artistic styles and compositions
- **🔧 Fully Typed**: Complete TypeScript support

## 📦 Installation

```bash
npm install @angularai/image-caption @angularai/core
```

## 🚀 Quick Start

### 1. Import the Component

```typescript
import { Component } from '@angular/core';
import { ImageCaptionComponent } from '@angularai/image-caption';

@Component({
  selector: 'app-image-caption',
  standalone: true,
  imports: [ImageCaptionComponent],
  template: `
    <image-caption
      [provider]="'openai'"
      [apiKey]="apiKey"
      [imageUrl]="imageUrl"
      (captionGenerated)="onCaption($event)"
    />
  `
})
export class ImageCaptionDemoComponent {
  apiKey = 'your-openai-api-key';
  imageUrl = 'https://example.com/image.jpg';

  onCaption(caption: string) {
    console.log('Generated caption:', caption);
  }
}
```

### 2. Use the Caption Service

```typescript
import { Component, inject } from '@angular/core';
import { ImageCaptionService } from '@angularai/image-caption';

@Component({ ... })
export class CaptionComponent {
  private captionService = inject(ImageCaptionService);

  generateCaption(imageUrl: string) {
    this.captionService.caption(imageUrl).subscribe({
      next: (caption) => console.log('Caption:', caption)
    });
  }

  analyzeImage(imageUrl: string) {
    this.captionService.analyze(imageUrl).subscribe({
      next: (analysis) => {
        console.log('Objects:', analysis.objects);
        console.log('Colors:', analysis.colors);
        console.log('Text:', analysis.text);
      }
    });
  }
}
```

## 📖 API Reference

### ImageCaptionService

```typescript
@Injectable({ providedIn: 'root' })
export class ImageCaptionService {
  // Generate caption for image
  caption(imageUrl: string): Observable<string>;

  // Detailed image analysis
  analyze(imageUrl: string): Observable<ImageAnalysis>;

  // Extract text from image (OCR)
  extractText(imageUrl: string): Observable<string>;

  // Describe image in detail
  describe(imageUrl: string, prompt?: string): Observable<string>;
}
```

### ImageAnalysis Interface

```typescript
interface ImageAnalysis {
  caption: string;
  objects: string[];
  colors: string[];
  text: string | null;
  style: string;
  confidence: number;
}
```

### ImageCaptionComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key |
| `imageUrl` | `string` | `''` | URL of image to caption |
| `model` | `string` | `'gpt-4-vision-preview'` | Vision model to use |
| `maxTokens` | `number` | `300` | Max tokens for response |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `captionGenerated` | `EventEmitter<string>` | Emitted when caption is ready |
| `analysisComplete` | `EventEmitter<ImageAnalysis>` | Emitted when analysis is complete |
| `error` | `EventEmitter<Error>` | Emitted on error |

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/doc-intelligence](https://www.npmjs.com/package/@angularai/doc-intelligence) | Document processing |
| [@angularai/spin-360](https://www.npmjs.com/package/@angularai/spin-360) | 360° product viewer |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
