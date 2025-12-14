import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ElementRef, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Spin360Service } from '../../services/spin-360.service';
import { Hotspot, Spin360Config, DEFAULT_SPIN_CONFIG } from '../../models/spin-360.model';

@Component({
  selector: 'ai-spin-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spin-viewer.component.html',
  styleUrl: './spin-viewer.component.scss'
})
export class SpinViewerComponent implements OnInit, OnDestroy {
  @Input() images: string[] = [];
  @Input() autoRotate = DEFAULT_SPIN_CONFIG.autoRotate!;
  @Input() rotationSpeed = DEFAULT_SPIN_CONFIG.rotationSpeed!;
  @Input() draggable = DEFAULT_SPIN_CONFIG.draggable!;
  @Input() zoomable = DEFAULT_SPIN_CONFIG.zoomable!;
  @Input() maxZoom = DEFAULT_SPIN_CONFIG.maxZoom!;
  @Input() showControls = DEFAULT_SPIN_CONFIG.showControls!;
  @Input() hotspots: Hotspot[] = [];

  @Output() frameChange = new EventEmitter<number>();
  @Output() hotspotClick = new EventEmitter<Hotspot>();

  @ViewChild('container') containerRef!: ElementRef;

  currentFrame = 0;
  zoom = 1;
  isLoading = true;
  isDragging = false;
  loadedImages: HTMLImageElement[] = [];

  private dragStartX = 0;
  private dragStartFrame = 0;
  protected autoRotateInterval: any;

  constructor(private spinService: Spin360Service) {}

  ngOnInit(): void {
    if (this.images.length > 0) {
      this.loadImages();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
  }

  loadImages(): void {
    this.isLoading = true;
    this.spinService.preloadImages(this.images).subscribe({
      next: (images) => {
        this.loadedImages = images;
        this.isLoading = false;
        if (this.autoRotate) {
          this.startAutoRotate();
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  get currentImage(): string {
    return this.images[this.currentFrame] || '';
  }

  get visibleHotspots(): Hotspot[] {
    return this.hotspots.filter(h => h.frameIndex === this.currentFrame);
  }

  // Drag handling
  onMouseDown(event: MouseEvent): void {
    if (!this.draggable) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartFrame = this.currentFrame;
    this.stopAutoRotate();
  }

  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;
    const newFrame = this.spinService.calculateFrameFromDrag(
      this.dragStartX, event.clientX, this.dragStartFrame, this.images.length
    );
    if (newFrame !== this.currentFrame) {
      this.currentFrame = newFrame;
      this.frameChange.emit(this.currentFrame);
    }
  }

  onMouseUp(): void {
    this.isDragging = false;
  }

  // Zoom handling
  onWheel(event: WheelEvent): void {
    if (!this.zoomable) return;
    event.preventDefault();
    this.zoom = this.spinService.calculateZoom(this.zoom, -event.deltaY, this.maxZoom);
  }

  // Controls
  prevFrame(): void {
    this.currentFrame = (this.currentFrame - 1 + this.images.length) % this.images.length;
    this.frameChange.emit(this.currentFrame);
  }

  nextFrame(): void {
    this.currentFrame = (this.currentFrame + 1) % this.images.length;
    this.frameChange.emit(this.currentFrame);
  }

  toggleAutoRotate(): void {
    if (this.autoRotateInterval) {
      this.stopAutoRotate();
    } else {
      this.startAutoRotate();
    }
  }

  resetZoom(): void {
    this.zoom = 1;
  }

  onHotspotClick(hotspot: Hotspot): void {
    this.hotspotClick.emit(hotspot);
  }

  private startAutoRotate(): void {
    const interval = 1000 / (this.rotationSpeed / 360 * this.images.length);
    this.autoRotateInterval = setInterval(() => this.nextFrame(), interval);
  }

  private stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = null;
    }
  }
}

