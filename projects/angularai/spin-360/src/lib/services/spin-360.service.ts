import { Injectable } from '@angular/core';
import { Observable, of, forkJoin } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { Hotspot, Spin360Config, DEFAULT_SPIN_CONFIG } from '../models/spin-360.model';

@Injectable({
  providedIn: 'root'
})
export class Spin360Service {
  private config: Partial<Spin360Config> = DEFAULT_SPIN_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<Spin360Config>): void {
    this.config = { ...DEFAULT_SPIN_CONFIG, ...config };
  }

  /**
   * Preload all images
   */
  preloadImages(urls: string[]): Observable<HTMLImageElement[]> {
    const loadPromises = urls.map(url => {
      return new Observable<HTMLImageElement>(observer => {
        const img = new Image();
        img.onload = () => {
          observer.next(img);
          observer.complete();
        };
        img.onerror = () => {
          observer.error(new Error(`Failed to load: ${url}`));
        };
        img.src = url;
      });
    });

    return forkJoin(loadPromises);
  }

  /**
   * Generate AI hotspots for product
   */
  generateHotspots(productDescription: string, frameCount: number): Observable<Hotspot[]> {
    if (!this.config.aiHotspots) {
      return of([]);
    }

    const prompt = `Generate product hotspots for a 360° view.
Product: ${productDescription}
Total frames: ${frameCount}

Create 3-5 hotspots in JSON format:
[{
  "id": "unique_id",
  "frameIndex": 0,
  "x": 50,
  "y": 50,
  "label": "Feature Name",
  "description": "Brief description"
}]

x and y are percentages (0-100). Distribute hotspots across different frames.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseHotspots(response)),
      catchError(() => of([]))
    );
  }

  /**
   * Calculate frame index from drag distance
   */
  calculateFrameFromDrag(
    startX: number, 
    currentX: number, 
    startFrame: number, 
    totalFrames: number,
    sensitivity = 5
  ): number {
    const delta = currentX - startX;
    const frameDelta = Math.floor(delta / sensitivity);
    let newFrame = (startFrame + frameDelta) % totalFrames;
    if (newFrame < 0) newFrame += totalFrames;
    return newFrame;
  }

  /**
   * Calculate zoom level from pinch/scroll
   */
  calculateZoom(currentZoom: number, delta: number, maxZoom: number): number {
    const newZoom = currentZoom + delta * 0.01;
    return Math.max(1, Math.min(maxZoom, newZoom));
  }

  private parseHotspots(response: string): Hotspot[] {
    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.map((h: any) => ({
          id: h.id || `hotspot_${Math.random().toString(36).substr(2, 9)}`,
          frameIndex: h.frameIndex || 0,
          x: h.x || 50,
          y: h.y || 50,
          label: h.label || 'Feature',
          description: h.description,
          aiGenerated: true
        }));
      }
    } catch {}
    return [];
  }
}

