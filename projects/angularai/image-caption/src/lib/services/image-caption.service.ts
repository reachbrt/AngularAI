import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { CaptionResult, ImageCaptionConfig, DEFAULT_IMAGE_CAPTION_CONFIG } from '../models/image-caption.model';

@Injectable({
  providedIn: 'root'
})
export class ImageCaptionService {
  private config: ImageCaptionConfig = DEFAULT_IMAGE_CAPTION_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<ImageCaptionConfig>): void {
    this.config = { ...DEFAULT_IMAGE_CAPTION_CONFIG, ...config };
  }

  /**
   * Generate caption for an image
   */
  generateCaption(imageUrl: string): Observable<CaptionResult> {
    const prompt = this.buildPrompt(imageUrl);

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseResponse(response)),
      catchError(() => of(this.getFallbackResult()))
    );
  }

  /**
   * Generate caption from base64 image data
   */
  generateCaptionFromBase64(base64Data: string): Observable<CaptionResult> {
    // For vision-capable models, we'd send the image directly
    // For now, we'll use a text-based approach
    const prompt = `Describe this image (base64 encoded). Style: ${this.config.style}. Max length: ${this.config.maxLength} characters.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseResponse(response)),
      catchError(() => of(this.getFallbackResult()))
    );
  }

  private buildPrompt(imageUrl: string): string {
    let prompt = `Generate a ${this.config.style} caption for an image at URL: ${imageUrl}

Requirements:
- Maximum ${this.config.maxLength} characters
- Language: ${this.config.language}`;

    if (this.config.includeElements) {
      prompt += '\n- List detected elements/objects';
    }

    if (this.config.alternativeCount && this.config.alternativeCount > 0) {
      prompt += `\n- Provide ${this.config.alternativeCount} alternative captions`;
    }

    prompt += `

Respond in JSON format:
{
  "caption": "main caption",
  "confidence": 0.9,
  "alternatives": ["alt1", "alt2"],
  "detectedElements": ["element1", "element2"]
}`;

    return prompt;
  }

  private parseResponse(response: string): CaptionResult {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          caption: parsed.caption || 'Unable to generate caption',
          confidence: parsed.confidence || 0.5,
          alternatives: parsed.alternatives || [],
          detectedElements: parsed.detectedElements || []
        };
      }
    } catch {}

    // If JSON parsing fails, use the response as caption
    return {
      caption: response.trim().substring(0, this.config.maxLength || 200),
      confidence: 0.5
    };
  }

  private getFallbackResult(): CaptionResult {
    return {
      caption: 'Image caption unavailable',
      confidence: 0
    };
  }
}

