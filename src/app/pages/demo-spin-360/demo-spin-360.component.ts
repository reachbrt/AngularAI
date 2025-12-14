import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { SpinViewerComponent, SpinGeneratorComponent, Hotspot, AI360GenerationResult } from '@angularai/spin-360';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';

@Component({
  selector: 'app-demo-spin-360',
  standalone: true,
  imports: [CommonModule, RouterLink, SpinViewerComponent, SpinGeneratorComponent, APIKeyWarningComponent],
  templateUrl: './demo-spin-360.component.html',
  styleUrl: './demo-spin-360.component.scss'
})
export class DemoSpin360Component implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  hasAPIKey = false;
  activeTab: 'viewer' | 'generator' = 'viewer';

  // Demo images for the basic viewer
  demoImages: string[] = Array.from({ length: 8 }, (_, i) =>
    `https://picsum.photos/seed/product${i + 1}/800/600`
  );

  // AI-generated images
  generatedImages: string[] = [];
  generationComplete = false;
  generatedGifUrl: string | null = null;

  hotspots: Hotspot[] = [
    { id: '1', frameIndex: 0, x: 30, y: 40, label: 'Feature 1', description: 'Main product feature' },
    { id: '2', frameIndex: 2, x: 70, y: 50, label: 'Feature 2', description: 'Secondary feature' },
    { id: '3', frameIndex: 4, x: 50, y: 30, label: 'Feature 3', description: 'Additional detail' }
  ];

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFrameChange(frame: number): void {
    console.log('Frame changed:', frame);
  }

  onHotspotClick(hotspot: Hotspot): void {
    console.log('Hotspot clicked:', hotspot);
    alert(`${hotspot.label}: ${hotspot.description}`);
  }

  onGenerationComplete(result: AI360GenerationResult): void {
    console.log('360 generation complete:', result);
    this.generatedImages = result.images;
    this.generationComplete = true;
  }

  onImagesGenerated(images: string[]): void {
    this.generatedImages = images;
    this.generationComplete = true;
  }

  onGifGenerated(gifUrl: string): void {
    console.log('GIF generated:', gifUrl);
    this.generatedGifUrl = gifUrl;
  }

  get currentImages(): string[] {
    return this.generationComplete && this.generatedImages.length > 0
      ? this.generatedImages
      : this.demoImages;
  }

  resetGeneration(): void {
    this.generatedImages = [];
    this.generationComplete = false;
    this.generatedGifUrl = null;
  }
}

