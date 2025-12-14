import { Component, Output, EventEmitter, OnDestroy, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { AI360GeneratorService } from '../../services/ai-360-generator.service';
import { GifGeneratorService, GifGenerationProgress } from '../../services/gif-generator.service';
import { AI360GenerationResult, ANGLE_PRESETS, ImageQuality } from '../../models/spin-360.model';

@Component({
  selector: 'ai-spin-generator',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './spin-generator.component.html',
  styleUrl: './spin-generator.component.scss'
})
export class SpinGeneratorComponent implements OnDestroy {
  /** Number of angles to generate (4, 8, 12, 24, 36, or 72) */
  @Input() numAngles: 4 | 8 | 12 | 24 | 36 | 72 = 8;
  /** Image size for generated images */
  @Input() imageSize: '256x256' | '512x512' | '1024x1024' = '1024x1024';
  /** Image quality */
  @Input() quality: ImageQuality = 'standard';
  /** Background color for generated images */
  @Input() backgroundColor = '#ffffff';
  /** Auto-generate GIF after images are ready */
  @Input() generateGif = true;
  /** Frame delay in ms for GIF */
  @Input() gifFrameDelay = 150;

  @Output() generationComplete = new EventEmitter<AI360GenerationResult>();
  @Output() imagesGenerated = new EventEmitter<string[]>();
  @Output() gifGenerated = new EventEmitter<string>();

  private destroy$ = new Subject<void>();

  sourceImage: string | null = null;
  sourceFileName = '';
  objectDescription = '';
  generationState: AI360GenerationResult | null = null;
  isDragOver = false;

  // GIF generation state
  isGeneratingGif = false;
  gifProgress = 0;
  gifUrl: string | null = null;
  gifBlob: Blob | null = null;
  isHoveringGif = false;

  // Available angle presets for UI
  readonly anglePresets = [4, 8, 12, 24, 36] as const;

  constructor(
    private generator: AI360GeneratorService,
    private gifService: GifGeneratorService
  ) {
    this.generator.state$.pipe(takeUntil(this.destroy$)).subscribe(state => {
      this.generationState = state;
      if (state.status === 'complete' && state.images.length > 0) {
        this.generationComplete.emit(state);
        this.imagesGenerated.emit(state.images);

        // Auto-generate GIF after images are ready
        if (this.generateGif) {
          this.createGif(state.images);
        }
      }
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
    
    if (event.dataTransfer?.files && event.dataTransfer.files[0]) {
      this.processFile(event.dataTransfer.files[0]);
    }
  }

  private processFile(file: File): void {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file (JPEG or PNG)');
      return;
    }

    this.sourceFileName = file.name;
    const reader = new FileReader();
    reader.onload = (e) => {
      this.sourceImage = e.target?.result as string;
    };
    reader.readAsDataURL(file);
  }

  generate360(): void {
    if (!this.sourceImage) return;

    const angles = ANGLE_PRESETS[this.numAngles] || ANGLE_PRESETS[8];

    this.generator.generate360Views({
      sourceImage: this.sourceImage,
      numAngles: this.numAngles,
      angles: angles,
      objectDescription: this.objectDescription || undefined,
      imageSize: this.imageSize,
      quality: this.quality,
      backgroundColor: this.backgroundColor
    }).subscribe();
  }

  reset(): void {
    this.sourceImage = null;
    this.sourceFileName = '';
    this.objectDescription = '';
    this.generator.reset();

    // Clean up GIF
    if (this.gifUrl) {
      this.gifService.revokeGifUrl(this.gifUrl);
      this.gifUrl = null;
    }
    this.gifBlob = null;
    this.gifProgress = 0;
    this.isGeneratingGif = false;
  }

  private createGif(images: string[]): void {
    this.isGeneratingGif = true;
    this.gifProgress = 0;

    this.gifService.generateGif(images, {
      frameDelay: this.gifFrameDelay,
      width: 400,
      height: 400,
      quality: 10
    }).pipe(takeUntil(this.destroy$)).subscribe({
      next: (progress: GifGenerationProgress) => {
        this.gifProgress = progress.progress;

        if (progress.status === 'complete' && progress.gifUrl) {
          this.gifUrl = progress.gifUrl;
          this.gifBlob = progress.gifBlob || null;
          this.isGeneratingGif = false;
          this.gifGenerated.emit(progress.gifUrl);
        } else if (progress.status === 'error') {
          this.isGeneratingGif = false;
        }
      },
      error: () => {
        this.isGeneratingGif = false;
      }
    });
  }

  downloadGif(): void {
    if (!this.gifBlob) return;

    const link = document.createElement('a');
    link.href = URL.createObjectURL(this.gifBlob);
    link.download = '360-rotation.gif';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  get isGenerating(): boolean {
    return this.generationState?.status === 'generating';
  }

  get progress(): number {
    return this.generationState?.progress || 0;
  }

  get hasError(): boolean {
    return this.generationState?.status === 'error';
  }

  get errorMessage(): string {
    return this.generationState?.errorMessage || 'An error occurred';
  }

  get isComplete(): boolean {
    return this.generationState?.status === 'complete';
  }

  get generatedImages(): string[] {
    return this.generationState?.images || [];
  }

  get objectInfo(): { name: string; description: string } | null {
    return this.generationState?.objectInfo || null;
  }

  get hasGif(): boolean {
    return !!this.gifUrl;
  }
}

