import { Component, Input, Output, EventEmitter, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { GifGeneratorService, GifGenerationProgress, GifGenerationOptions } from '../../services/gif-generator.service';

@Component({
  selector: 'ai-spin-gif-preview',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spin-gif-preview.component.html',
  styleUrl: './spin-gif-preview.component.scss'
})
export class SpinGifPreviewComponent implements OnDestroy, OnChanges {
  /** Array of images to create GIF from */
  @Input() images: string[] = [];
  
  /** First frame image to show when not hovering */
  @Input() staticImage: string = '';
  
  /** GIF generation options */
  @Input() options: GifGenerationOptions = {};
  
  /** Auto-generate GIF when images change */
  @Input() autoGenerate = true;
  
  /** Show download button */
  @Input() showDownload = true;

  /** Emits when GIF is generated */
  @Output() gifGenerated = new EventEmitter<string>();
  
  /** Emits generation progress */
  @Output() progressChange = new EventEmitter<GifGenerationProgress>();

  private destroy$ = new Subject<void>();
  
  isHovering = false;
  gifUrl: string | null = null;
  gifBlob: Blob | null = null;
  isGenerating = false;
  progress = 0;
  statusMessage = '';
  hasError = false;

  constructor(private gifService: GifGeneratorService) {}

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && this.images.length > 0 && this.autoGenerate) {
      this.generateGif();
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.gifUrl) {
      this.gifService.revokeGifUrl(this.gifUrl);
    }
  }

  generateGif(): void {
    if (this.images.length === 0 || this.isGenerating) return;
    
    // Clean up previous GIF
    if (this.gifUrl) {
      this.gifService.revokeGifUrl(this.gifUrl);
      this.gifUrl = null;
    }

    this.isGenerating = true;
    this.hasError = false;
    this.progress = 0;

    this.gifService.generateGif(this.images, this.options)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (result) => {
          this.progress = result.progress;
          this.statusMessage = result.message || '';
          this.progressChange.emit(result);

          if (result.status === 'complete' && result.gifUrl) {
            this.gifUrl = result.gifUrl;
            this.gifBlob = result.gifBlob || null;
            this.isGenerating = false;
            this.gifGenerated.emit(result.gifUrl);
          } else if (result.status === 'error') {
            this.hasError = true;
            this.isGenerating = false;
          }
        },
        error: () => {
          this.hasError = true;
          this.isGenerating = false;
        }
      });
  }

  onMouseEnter(): void {
    this.isHovering = true;
  }

  onMouseLeave(): void {
    this.isHovering = false;
  }

  downloadGif(): void {
    if (!this.gifBlob) return;
    
    const link = document.createElement('a');
    link.href = URL.createObjectURL(this.gifBlob);
    link.download = '360-rotation.gif';
    link.click();
    URL.revokeObjectURL(link.href);
  }

  get displayImage(): string {
    if (this.isHovering && this.gifUrl) {
      return this.gifUrl;
    }
    return this.staticImage || this.images[0] || '';
  }

  get showGifIndicator(): boolean {
    return !!this.gifUrl && !this.isHovering;
  }
}

