import { Injectable } from '@angular/core';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  CaptionResult,
  ImageCaptionConfig,
  BatchItem,
  BatchResult,
  CaptionHistoryEntry,
  CaptionProgress,
  ExportOptions,
  ExportFormat,
  DetectedElement,
  DEFAULT_IMAGE_CAPTION_CONFIG
} from '../models/image-caption.model';

@Injectable({
  providedIn: 'root'
})
export class ImageCaptionService {
  private config: ImageCaptionConfig = DEFAULT_IMAGE_CAPTION_CONFIG;
  private history: CaptionHistoryEntry[] = [];

  private progressSubject = new Subject<CaptionProgress>();
  progress$ = this.progressSubject.asObservable();

  private historySubject = new BehaviorSubject<CaptionHistoryEntry[]>([]);
  history$ = this.historySubject.asObservable();

  constructor(private aiClient: AIClientService) {
    this.loadHistory();
  }

  configure(config: Partial<ImageCaptionConfig>): void {
    this.config = { ...DEFAULT_IMAGE_CAPTION_CONFIG, ...config };
  }

  // ==================== Single Image Captioning ====================

  /**
   * Generate caption for an image
   */
  generateCaption(imageSource: string | File | Blob): Observable<CaptionResult> {
    const startTime = Date.now();
    this.emitProgress('loading', 0, 'Loading image...');

    return new Observable(observer => {
      this.getImageDataUrl(imageSource).then(async dataUrl => {
        this.emitProgress('analyzing', 30, 'Analyzing image...');

        const prompt = this.buildPrompt(dataUrl);

        this.emitProgress('generating', 60, 'Generating caption...');

        this.aiClient.ask(prompt).subscribe({
          next: response => {
            const result = this.parseResponse(response, dataUrl, startTime);

            // Add to history
            if (this.config.enableHistory) {
              this.addToHistory(result, dataUrl);
            }

            this.emitProgress('complete', 100, 'Caption generated');
            observer.next(result);
            observer.complete();
          },
          error: err => {
            this.emitProgress('error', 0, 'Failed to generate caption');
            observer.next(this.getFallbackResult());
            observer.complete();
          }
        });
      }).catch(err => {
        this.emitProgress('error', 0, 'Failed to load image');
        observer.next(this.getFallbackResult());
        observer.complete();
      });
    });
  }

  /**
   * Generate caption from base64 image data
   */
  generateCaptionFromBase64(base64Data: string): Observable<CaptionResult> {
    return this.generateCaption(base64Data);
  }

  // ==================== Batch Processing ====================

  /**
   * Process multiple images in batch
   */
  async processBatch(sources: (string | File | Blob)[]): Promise<BatchResult> {
    const startTime = Date.now();
    const items: BatchItem[] = sources.map((source, index) => ({
      id: `batch_${Date.now()}_${index}`,
      source,
      status: 'pending' as const,
      progress: 0
    }));

    const concurrency = this.config.batchConcurrency || 3;
    let completed = 0;
    let successCount = 0;
    let errorCount = 0;

    // Process in batches
    for (let i = 0; i < items.length; i += concurrency) {
      const batch = items.slice(i, i + concurrency);

      await Promise.all(batch.map(async item => {
        item.status = 'processing';
        this.emitProgress('analyzing', (completed / items.length) * 100,
          `Processing ${completed + 1} of ${items.length}...`, completed + 1, items.length);

        try {
          const result = await this.generateCaption(item.source).toPromise();
          item.result = result;
          item.status = 'complete';
          successCount++;
        } catch (error) {
          item.status = 'error';
          item.error = (error as Error).message;
          errorCount++;
        }

        completed++;
        item.progress = 100;
      }));
    }

    this.emitProgress('complete', 100, `Processed ${items.length} images`);

    return {
      items,
      totalCount: items.length,
      successCount,
      errorCount,
      processingTime: Date.now() - startTime
    };
  }

  // ==================== History Management ====================

  /**
   * Get caption history
   */
  getHistory(): CaptionHistoryEntry[] {
    return [...this.history];
  }

  /**
   * Add to history
   */
  private async addToHistory(result: CaptionResult, imageSource: string): Promise<void> {
    let thumbnail: string | undefined;

    if (this.config.generateThumbnails) {
      thumbnail = await this.generateThumbnail(imageSource);
    }

    const entry: CaptionHistoryEntry = {
      id: result.id,
      result,
      timestamp: new Date(),
      imagePreview: thumbnail,
      favorite: false
    };

    this.history.unshift(entry);

    // Limit history size
    if (this.config.maxHistoryEntries && this.history.length > this.config.maxHistoryEntries) {
      this.history = this.history.slice(0, this.config.maxHistoryEntries);
    }

    this.saveHistory();
    this.historySubject.next([...this.history]);
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(id: string): void {
    const entry = this.history.find(h => h.id === id);
    if (entry) {
      entry.favorite = !entry.favorite;
      this.saveHistory();
      this.historySubject.next([...this.history]);
    }
  }

  /**
   * Delete from history
   */
  deleteFromHistory(id: string): void {
    this.history = this.history.filter(h => h.id !== id);
    this.saveHistory();
    this.historySubject.next([...this.history]);
  }

  /**
   * Clear history
   */
  clearHistory(): void {
    this.history = [];
    this.saveHistory();
    this.historySubject.next([]);
  }

  /**
   * Get favorites
   */
  getFavorites(): CaptionHistoryEntry[] {
    return this.history.filter(h => h.favorite);
  }

  /**
   * Search history
   */
  searchHistory(query: string): CaptionHistoryEntry[] {
    const lower = query.toLowerCase();
    return this.history.filter(h =>
      h.result.caption.toLowerCase().includes(lower) ||
      h.result.tags?.some(t => t.toLowerCase().includes(lower)) ||
      h.result.detectedElements?.some(e => e.name.toLowerCase().includes(lower))
    );
  }

  // ==================== Export ====================

  /**
   * Export captions
   */
  export(entries: CaptionHistoryEntry[], options: ExportOptions): string {
    switch (options.format) {
      case 'json':
        return this.exportToJSON(entries, options);
      case 'csv':
        return this.exportToCSV(entries, options);
      case 'txt':
        return this.exportToTXT(entries, options);
      case 'html':
        return this.exportToHTML(entries, options);
      default:
        return this.exportToJSON(entries, options);
    }
  }

  /**
   * Export and download
   */
  exportAndDownload(entries: CaptionHistoryEntry[], options: ExportOptions): void {
    const content = this.export(entries, options);
    const mimeTypes: Record<ExportFormat, string> = {
      json: 'application/json',
      csv: 'text/csv',
      txt: 'text/plain',
      html: 'text/html'
    };

    const blob = new Blob([content], { type: mimeTypes[options.format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = options.filename || `captions.${options.format}`;
    a.click();
    URL.revokeObjectURL(url);
  }

  private exportToJSON(entries: CaptionHistoryEntry[], options: ExportOptions): string {
    const data = entries.map(e => ({
      id: e.id,
      caption: e.result.caption,
      confidence: e.result.confidence,
      timestamp: e.timestamp.toISOString(),
      ...(options.includeAlternatives && { alternatives: e.result.alternatives }),
      ...(options.includeElements && { elements: e.result.detectedElements }),
      ...(options.includeTags && { tags: e.result.tags }),
      ...(options.includeImages && { image: e.imagePreview })
    }));
    return JSON.stringify(data, null, 2);
  }

  private exportToCSV(entries: CaptionHistoryEntry[], options: ExportOptions): string {
    const headers = ['ID', 'Caption', 'Confidence', 'Timestamp'];
    if (options.includeAlternatives) headers.push('Alternatives');
    if (options.includeElements) headers.push('Elements');
    if (options.includeTags) headers.push('Tags');

    const rows = entries.map(e => {
      const row = [
        e.id,
        `"${e.result.caption.replace(/"/g, '""')}"`,
        e.result.confidence.toString(),
        e.timestamp.toISOString()
      ];
      if (options.includeAlternatives) {
        row.push(`"${(e.result.alternatives || []).join('; ')}"`);
      }
      if (options.includeElements) {
        row.push(`"${(e.result.detectedElements || []).map(el => el.name).join('; ')}"`);
      }
      if (options.includeTags) {
        row.push(`"${(e.result.tags || []).join('; ')}"`);
      }
      return row.join(',');
    });

    return [headers.join(','), ...rows].join('\n');
  }

  private exportToTXT(entries: CaptionHistoryEntry[], options: ExportOptions): string {
    return entries.map(e => {
      let text = `[${e.timestamp.toISOString()}]\n${e.result.caption}`;
      if (options.includeAlternatives && e.result.alternatives?.length) {
        text += `\n\nAlternatives:\n${e.result.alternatives.map(a => `- ${a}`).join('\n')}`;
      }
      if (options.includeTags && e.result.tags?.length) {
        text += `\n\nTags: ${e.result.tags.join(', ')}`;
      }
      return text;
    }).join('\n\n---\n\n');
  }

  private exportToHTML(entries: CaptionHistoryEntry[], options: ExportOptions): string {
    const items = entries.map(e => `
      <div class="caption-entry">
        ${options.includeImages && e.imagePreview ? `<img src="${e.imagePreview}" alt="Preview">` : ''}
        <p class="caption">${e.result.caption}</p>
        <p class="meta">Confidence: ${(e.result.confidence * 100).toFixed(1)}% | ${e.timestamp.toLocaleString()}</p>
        ${options.includeAlternatives && e.result.alternatives?.length ?
          `<ul class="alternatives">${e.result.alternatives.map(a => `<li>${a}</li>`).join('')}</ul>` : ''}
        ${options.includeTags && e.result.tags?.length ?
          `<p class="tags">Tags: ${e.result.tags.join(', ')}</p>` : ''}
      </div>
    `).join('');

    return `<!DOCTYPE html>
<html><head><title>Image Captions</title>
<style>
  body { font-family: sans-serif; max-width: 800px; margin: 0 auto; padding: 20px; }
  .caption-entry { border: 1px solid #ddd; padding: 15px; margin: 10px 0; border-radius: 8px; }
  .caption { font-size: 1.1em; margin: 10px 0; }
  .meta { color: #666; font-size: 0.9em; }
  .alternatives { margin: 10px 0; padding-left: 20px; }
  .tags { color: #0066cc; }
  img { max-width: 200px; border-radius: 4px; }
</style>
</head><body><h1>Image Captions</h1>${items}</body></html>`;
  }

  // ==================== Private Methods ====================

  private buildPrompt(imageUrl: string): string {
    let prompt = `Generate a ${this.config.style} caption for an image.

Requirements:
- Maximum ${this.config.maxLength} characters
- Language: ${this.config.language}`;

    if (this.config.includeElements) {
      prompt += '\n- List detected elements/objects with confidence scores';
    }

    if (this.config.alternativeCount && this.config.alternativeCount > 0) {
      prompt += `\n- Provide ${this.config.alternativeCount} alternative captions`;
    }

    if (this.config.extractTags) {
      prompt += '\n- Extract relevant tags/keywords';
    }

    if (this.config.detectScene) {
      prompt += '\n- Identify the scene type (indoor, outdoor, portrait, landscape, etc.)';
    }

    if (this.config.detectMood) {
      prompt += '\n- Describe the mood/atmosphere';
    }

    prompt += `

Respond in JSON format:
{
  "caption": "main caption",
  "confidence": 0.9,
  "alternatives": ["alt1", "alt2"],
  "detectedElements": [{"name": "element", "confidence": 0.9, "category": "object"}],
  "tags": ["tag1", "tag2"],
  "sceneType": "outdoor",
  "mood": "peaceful"
}`;

    return prompt;
  }

  private parseResponse(response: string, imageSource: string, startTime: number): CaptionResult {
    const id = `caption_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const elements: DetectedElement[] = (parsed.detectedElements || []).map((e: any) =>
          typeof e === 'string' ? { name: e, confidence: 0.8 } : e
        );

        return {
          id,
          caption: parsed.caption || 'Unable to generate caption',
          confidence: parsed.confidence || 0.5,
          alternatives: parsed.alternatives || [],
          detectedElements: elements,
          imageSource,
          timestamp: new Date(),
          processingTime: Date.now() - startTime,
          style: this.config.style,
          language: this.config.language,
          tags: parsed.tags || [],
          sceneType: parsed.sceneType,
          mood: parsed.mood
        };
      }
    } catch {}

    return {
      id,
      caption: response.trim().substring(0, this.config.maxLength || 200),
      confidence: 0.5,
      timestamp: new Date(),
      processingTime: Date.now() - startTime
    };
  }

  private getFallbackResult(): CaptionResult {
    return {
      id: `caption_${Date.now()}`,
      caption: 'Image caption unavailable',
      confidence: 0,
      timestamp: new Date()
    };
  }

  private async getImageDataUrl(source: string | File | Blob): Promise<string> {
    if (typeof source === 'string') {
      return source;
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    });
  }

  private async generateThumbnail(imageSource: string): Promise<string> {
    return new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const size = this.config.thumbnailSize || 100;
        const scale = Math.min(size / img.width, size / img.height);
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        const ctx = canvas.getContext('2d');
        if (ctx) {
          ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
          resolve(canvas.toDataURL('image/jpeg', 0.7));
        } else {
          resolve('');
        }
      };
      img.onerror = () => resolve('');
      img.src = imageSource;
    });
  }

  private emitProgress(
    status: CaptionProgress['status'],
    progress: number,
    message?: string,
    currentItem?: number,
    totalItems?: number
  ): void {
    this.progressSubject.next({ status, progress, message, currentItem, totalItems });
  }

  private saveHistory(): void {
    if (typeof localStorage === 'undefined') return;

    try {
      const data = this.history.map(h => ({
        ...h,
        timestamp: h.timestamp.toISOString(),
        result: {
          ...h.result,
          timestamp: h.result.timestamp.toISOString()
        }
      }));
      localStorage.setItem(
        this.config.historyStorageKey || 'image_caption_history',
        JSON.stringify(data)
      );
    } catch {}
  }

  private loadHistory(): void {
    if (typeof localStorage === 'undefined' || !this.config.enableHistory) return;

    try {
      const data = localStorage.getItem(this.config.historyStorageKey || 'image_caption_history');
      if (data) {
        const parsed = JSON.parse(data);
        this.history = parsed.map((h: any) => ({
          ...h,
          timestamp: new Date(h.timestamp),
          result: {
            ...h.result,
            timestamp: new Date(h.result.timestamp)
          }
        }));
        this.historySubject.next([...this.history]);
      }
    } catch {}
  }
}

