<div align="center">
  <h1>@angularai/spin-360</h1>
  <p>🔄 AI-powered 360° product viewer with GIF generation for Angular</p>

  <p>
    <a href="https://www.npmjs.com/package/@angularai/spin-360"><img src="https://img.shields.io/npm/v/@angularai/spin-360.svg?style=flat-square" alt="npm version"></a>
    <a href="https://www.npmjs.com/package/@angularai/spin-360"><img src="https://img.shields.io/npm/l/@angularai/spin-360.svg?style=flat-square" alt="MIT License"></a>
    <a href="https://angular.dev"><img src="https://img.shields.io/badge/Angular-20+-dd0031?style=flat-square&logo=angular" alt="Angular 20+"></a>
  </p>
</div>

## Overview

`@angularai/spin-360` provides an AI-powered 360° product viewer for Angular applications. Generate 360° views from a single image using DALL-E, create interactive spin viewers, and export as hover-to-play GIFs.

## ✨ Features

- **🤖 AI Image Generation**: Generate 360° views from a single product image using DALL-E 3
- **🔄 Interactive Viewer**: Drag-to-spin 360° product viewer
- **🎬 GIF Export**: Generate hover-to-play animated GIFs
- **📱 Touch Support**: Mobile-friendly touch gestures
- **⚡ Auto-Spin**: Configurable auto-rotation
- **🎨 Customizable**: Flexible styling options
- **🔧 Fully Typed**: Complete TypeScript support

## 📦 Installation

```bash
npm install @angularai/spin-360 @angularai/core
```

## 🚀 Quick Start

### 1. Basic 360° Viewer

```typescript
import { Component } from '@angular/core';
import { SpinViewerComponent } from '@angularai/spin-360';

@Component({
  selector: 'app-product-viewer',
  standalone: true,
  imports: [SpinViewerComponent],
  template: `
    <spin-viewer
      [images]="productImages"
      [autoSpin]="true"
      [spinSpeed]="50"
    />
  `
})
export class ProductViewerComponent {
  productImages = [
    '/assets/product-0.jpg',
    '/assets/product-1.jpg',
    '/assets/product-2.jpg',
    // ... more angles
  ];
}
```

### 2. AI-Powered 360° Generation

```typescript
import { Component } from '@angular/core';
import { SpinGeneratorComponent } from '@angularai/spin-360';

@Component({
  selector: 'app-spin-generator',
  standalone: true,
  imports: [SpinGeneratorComponent],
  template: `
    <spin-generator
      [provider]="'openai'"
      [apiKey]="apiKey"
      [generateGif]="true"
      [gifFrameDelay]="150"
      (imagesGenerated)="onImagesGenerated($event)"
      (gifGenerated)="onGifGenerated($event)"
    />
  `
})
export class SpinGeneratorDemoComponent {
  apiKey = 'your-openai-api-key';

  onImagesGenerated(images: string[]) {
    console.log('Generated 360° images:', images);
  }

  onGifGenerated(gifUrl: string) {
    console.log('Generated GIF:', gifUrl);
  }
}
```

### 3. Hover-to-Play GIF Preview

```typescript
import { Component } from '@angular/core';
import { SpinGifPreviewComponent } from '@angularai/spin-360';

@Component({
  selector: 'app-gif-preview',
  standalone: true,
  imports: [SpinGifPreviewComponent],
  template: `
    <spin-gif-preview
      [gifUrl]="gifUrl"
      [staticImageUrl]="firstFrameUrl"
      [showDownloadButton]="true"
    />
  `
})
export class GifPreviewComponent {
  gifUrl = '/assets/product-360.gif';
  firstFrameUrl = '/assets/product-0.jpg';
}
```

## 📖 Component API

### SpinViewerComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `images` | `string[]` | `[]` | Array of image URLs for 360° view |
| `autoSpin` | `boolean` | `false` | Enable auto-rotation |
| `spinSpeed` | `number` | `50` | Auto-spin speed (ms per frame) |
| `reverse` | `boolean` | `false` | Reverse spin direction |
| `startIndex` | `number` | `0` | Starting frame index |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `frameChanged` | `EventEmitter<number>` | Emitted when frame changes |
| `spinStarted` | `EventEmitter<void>` | Emitted when spin starts |
| `spinStopped` | `EventEmitter<void>` | Emitted when spin stops |

### SpinGeneratorComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `provider` | `string` | `'openai'` | AI provider |
| `apiKey` | `string` | `''` | API key |
| `generateGif` | `boolean` | `true` | Auto-generate GIF |
| `gifFrameDelay` | `number` | `150` | GIF frame delay (ms) |
| `numberOfAngles` | `number` | `8` | Number of angles to generate |

#### Outputs

| Output | Type | Description |
|--------|------|-------------|
| `imagesGenerated` | `EventEmitter<string[]>` | Emitted when images are ready |
| `gifGenerated` | `EventEmitter<string>` | Emitted when GIF is ready |
| `progress` | `EventEmitter<number>` | Generation progress (0-100) |

### SpinGifPreviewComponent

#### Inputs

| Input | Type | Default | Description |
|-------|------|---------|-------------|
| `gifUrl` | `string` | `''` | URL of the animated GIF |
| `staticImageUrl` | `string` | `''` | URL of static first frame |
| `showDownloadButton` | `boolean` | `true` | Show download button |
| `downloadFilename` | `string` | `'spin-360.gif'` | Download filename |

## 🎬 GIF Generation

The package includes a built-in GIF generator service:

```typescript
import { Component, inject } from '@angular/core';
import { GifGeneratorService } from '@angularai/spin-360';

@Component({ ... })
export class GifComponent {
  private gifService = inject(GifGeneratorService);

  generateGif(images: string[]) {
    this.gifService.generateGif(images, {
      frameDelay: 150,
      width: 400,
      height: 400,
      quality: 10
    }).subscribe({
      next: (result) => {
        if (result.type === 'progress') {
          console.log('Progress:', result.progress);
        } else if (result.type === 'complete') {
          console.log('GIF URL:', result.url);
        }
      }
    });
  }
}
```

## 📦 Related Packages

| Package | Description |
|---------|-------------|
| [@angularai/core](https://www.npmjs.com/package/@angularai/core) | Core AI functionality |
| [@angularai/image-caption](https://www.npmjs.com/package/@angularai/image-caption) | AI image captioning |

## 📄 License

MIT © [AngularAI](https://github.com/angularai)
