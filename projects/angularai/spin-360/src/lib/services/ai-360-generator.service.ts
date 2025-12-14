import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap, tap } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  AI360GenerationRequest, 
  AI360GenerationResult, 
  DEFAULT_360_ANGLES 
} from '../models/spin-360.model';

@Injectable({
  providedIn: 'root'
})
export class AI360GeneratorService {
  private generationState$ = new BehaviorSubject<AI360GenerationResult>({
    images: [],
    angles: [],
    status: 'pending',
    progress: 0
  });

  /** Observable for generation state */
  readonly state$ = this.generationState$.asObservable();

  constructor(private aiClient: AIClientService) {}

  /**
   * Generate 360-degree views from a single source image
   */
  generate360Views(request: AI360GenerationRequest): Observable<AI360GenerationResult> {
    const angles = request.angles || DEFAULT_360_ANGLES;
    const numAngles = request.numAngles || angles.length;
    
    // Update state to generating
    this.updateState({ status: 'generating', progress: 0, images: [], angles: [] });

    // First, analyze the source image to understand the object
    return this.analyzeSourceImage(request.sourceImage, request.objectDescription).pipe(
      switchMap(objectInfo => {
        this.updateState({ objectInfo, progress: 10 });
        
        // Generate images for each angle
        return this.generateAngleViews(
          request.sourceImage,
          objectInfo,
          angles.slice(0, numAngles),
          request.imageSize || '1024x1024'
        );
      }),
      tap(result => {
        this.updateState({ ...result, status: 'complete', progress: 100 });
      }),
      catchError(error => {
        const errorResult: AI360GenerationResult = {
          images: [],
          angles: [],
          status: 'error',
          progress: 0,
          errorMessage: error.message || 'Failed to generate 360 views'
        };
        this.updateState(errorResult);
        return of(errorResult);
      })
    );
  }

  /**
   * Analyze the source image to detect the main object
   */
  private analyzeSourceImage(
    imageBase64: string, 
    description?: string
  ): Observable<{ name: string; center: { x: number; y: number }; description: string }> {
    const prompt = `Analyze this image and identify the main object/product.
${description ? `Context: ${description}` : ''}

Respond in JSON format:
{
  "name": "object name",
  "center": { "x": 50, "y": 50 },
  "description": "detailed description of the object, its shape, colors, materials, and key features"
}

The center is the focal point where rotation should occur (as percentage 0-100).`;

    return this.aiClient.analyzeImage(imageBase64, prompt).pipe(
      map(response => {
        try {
          const match = response.match(/\{[\s\S]*\}/);
          if (match) {
            return JSON.parse(match[0]);
          }
        } catch {}
        return {
          name: 'Object',
          center: { x: 50, y: 50 },
          description: description || 'An object'
        };
      })
    );
  }

  /**
   * Generate views at each angle using AI image generation
   */
  private generateAngleViews(
    sourceImage: string,
    objectInfo: { name: string; center: { x: number; y: number }; description: string },
    angles: number[],
    imageSize: '256x256' | '512x512' | '1024x1024'
  ): Observable<AI360GenerationResult> {
    const imageGenerations$ = angles.map((angle, index) => {
      const prompt = this.createAnglePrompt(objectInfo, angle);
      
      return this.aiClient.generateImage({
        prompt,
        size: imageSize,
        quality: 'standard',
        style: 'natural',
        n: 1
      }).pipe(
        tap(() => {
          const progress = 10 + ((index + 1) / angles.length) * 90;
          this.updateState({ progress });
        }),
        map(response => ({
          angle,
          image: response.images[0] || ''
        })),
        catchError(() => of({ angle, image: '' }))
      );
    });

    return forkJoin(imageGenerations$).pipe(
      map(results => ({
        images: results.map(r => r.image),
        angles: results.map(r => r.angle),
        objectInfo,
        status: 'complete' as const,
        progress: 100
      }))
    );
  }

  /**
   * Create a prompt for generating a specific angle view
   */
  private createAnglePrompt(
    objectInfo: { name: string; description: string },
    angle: number
  ): string {
    const viewDescriptions: Record<number, string> = {
      0: 'front view, directly facing the camera',
      45: 'front-right view, 45 degrees to the right',
      90: 'right side view, profile from the right',
      135: 'back-right view, 45 degrees from behind on the right',
      180: 'back view, directly from behind',
      225: 'back-left view, 45 degrees from behind on the left',
      270: 'left side view, profile from the left',
      315: 'front-left view, 45 degrees to the left'
    };

    const viewDesc = viewDescriptions[angle] || `rotated ${angle} degrees`;
    
    return `Product photography of ${objectInfo.name}: ${viewDesc}.
${objectInfo.description}
Professional studio lighting, clean white/neutral background, high quality product shot.
The object should be centered and clearly visible, maintaining consistent scale and positioning.`;
  }

  private updateState(partial: Partial<AI360GenerationResult>): void {
    this.generationState$.next({ ...this.generationState$.getValue(), ...partial });
  }

  /**
   * Reset the generation state
   */
  reset(): void {
    this.generationState$.next({
      images: [],
      angles: [],
      status: 'pending',
      progress: 0
    });
  }
}

