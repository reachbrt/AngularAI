import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';
import GIF from 'gif.js';

export interface GifGenerationOptions {
  /** Frame delay in milliseconds (default: 100ms = 10fps) */
  frameDelay?: number;
  /** GIF width (default: 400) */
  width?: number;
  /** GIF height (default: 400) */
  height?: number;
  /** Quality 1-20, lower is better (default: 10) */
  quality?: number;
  /** Number of workers for encoding (default: 2) */
  workers?: number;
  /** Whether to loop the GIF (default: true) */
  loop?: boolean;
}

export interface GifGenerationProgress {
  status: 'loading' | 'encoding' | 'complete' | 'error';
  progress: number;
  message?: string;
  gifUrl?: string;
  gifBlob?: Blob;
}

@Injectable({
  providedIn: 'root'
})
export class GifGeneratorService {
  private defaultOptions: GifGenerationOptions = {
    frameDelay: 100,
    width: 400,
    height: 400,
    quality: 10,
    workers: 2,
    loop: true
  };

  /**
   * Generate a GIF from an array of image URLs or base64 strings
   */
  generateGif(images: string[], options?: GifGenerationOptions): Observable<GifGenerationProgress> {
    const subject = new Subject<GifGenerationProgress>();
    const opts = { ...this.defaultOptions, ...options };

    subject.next({ status: 'loading', progress: 0, message: 'Loading images...' });

    // Load all images first
    this.loadImages(images, opts.width!, opts.height!).then(loadedImages => {
      subject.next({ status: 'encoding', progress: 10, message: 'Creating GIF...' });

      const gif = new GIF({
        workers: opts.workers,
        quality: opts.quality,
        width: opts.width,
        height: opts.height,
        workerScript: this.getWorkerScript()
      });

      // Add each frame
      loadedImages.forEach((img, index) => {
        gif.addFrame(img, { delay: opts.frameDelay });
        const loadProgress = 10 + ((index + 1) / loadedImages.length) * 40;
        subject.next({ status: 'encoding', progress: loadProgress, message: `Adding frame ${index + 1}/${loadedImages.length}` });
      });

      // Handle progress
      gif.on('progress', (p: number) => {
        const encodeProgress = 50 + p * 50;
        subject.next({ status: 'encoding', progress: encodeProgress, message: 'Encoding GIF...' });
      });

      // Handle completion
      gif.on('finished', (blob: Blob) => {
        const gifUrl = URL.createObjectURL(blob);
        subject.next({ 
          status: 'complete', 
          progress: 100, 
          message: 'GIF created successfully!',
          gifUrl,
          gifBlob: blob
        });
        subject.complete();
      });

      // Render the GIF
      gif.render();
    }).catch(error => {
      subject.next({ 
        status: 'error', 
        progress: 0, 
        message: error.message || 'Failed to generate GIF' 
      });
      subject.complete();
    });

    return subject.asObservable();
  }

  /**
   * Load images and resize them to the target dimensions
   */
  private loadImages(urls: string[], width: number, height: number): Promise<HTMLCanvasElement[]> {
    return Promise.all(urls.map(url => this.loadAndResizeImage(url, width, height)));
  }

  private loadAndResizeImage(url: string, width: number, height: number): Promise<HTMLCanvasElement> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        
        // Calculate scaling to cover the canvas while maintaining aspect ratio
        const scale = Math.max(width / img.width, height / img.height);
        const scaledWidth = img.width * scale;
        const scaledHeight = img.height * scale;
        const x = (width - scaledWidth) / 2;
        const y = (height - scaledHeight) / 2;
        
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, width, height);
        ctx.drawImage(img, x, y, scaledWidth, scaledHeight);
        
        resolve(canvas);
      };

      img.onerror = () => reject(new Error(`Failed to load image: ${url.substring(0, 50)}...`));
      img.src = url;
    });
  }

  /**
   * Get the GIF worker script as a blob URL
   * This embeds the worker code so we don't need external files
   */
  private getWorkerScript(): string {
    // gif.js requires a worker script - we use the CDN version
    return 'https://cdnjs.cloudflare.com/ajax/libs/gif.js/0.2.0/gif.worker.js';
  }

  /**
   * Revoke a GIF URL to free memory
   */
  revokeGifUrl(url: string): void {
    if (url.startsWith('blob:')) {
      URL.revokeObjectURL(url);
    }
  }
}

