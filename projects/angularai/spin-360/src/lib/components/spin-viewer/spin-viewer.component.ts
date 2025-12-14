import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, OnChanges, SimpleChanges, ElementRef, ViewChild, NgZone } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Spin360Service } from '../../services/spin-360.service';
import { Hotspot, SpinTrigger, SpinMode, DEFAULT_SPIN_CONFIG } from '../../models/spin-360.model';

@Component({
  selector: 'ai-spin-viewer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './spin-viewer.component.html',
  styleUrl: './spin-viewer.component.scss'
})
export class SpinViewerComponent implements OnInit, OnDestroy, OnChanges {
  /** Array of frame images for 360 view */
  @Input() images: string[] = [];
  /** Static image to show initially (front view) */
  @Input() staticImage: string = '';
  /** GIF URL for gif mode */
  @Input() gifUrl: string = '';
  /** Display mode - gif or frames */
  @Input() mode: SpinMode = DEFAULT_SPIN_CONFIG.mode!;
  /** Trigger mode - hover, click, auto, drag */
  @Input() trigger: SpinTrigger = DEFAULT_SPIN_CONFIG.trigger!;
  /** Auto-rotate (for backwards compatibility, use trigger='auto' instead) */
  @Input() autoRotate = DEFAULT_SPIN_CONFIG.autoRotate!;
  /** Frame rate for animation (frames per second, default: 30) */
  @Input() frameRate = 30;
  /** Rotation speed (degrees per second) - for auto-rotate mode */
  @Input() rotationSpeed = DEFAULT_SPIN_CONFIG.rotationSpeed!;
  /** Enable drag to rotate */
  @Input() draggable = DEFAULT_SPIN_CONFIG.draggable!;
  /** Drag sensitivity - pixels needed to move one frame (default: 10) */
  @Input() dragSensitivity = 10;
  /** Enable zoom */
  @Input() zoomable = DEFAULT_SPIN_CONFIG.zoomable!;
  /** Maximum zoom level */
  @Input() maxZoom = DEFAULT_SPIN_CONFIG.maxZoom!;
  /** Show navigation controls */
  @Input() showControls = DEFAULT_SPIN_CONFIG.showControls!;
  /** Frame delay for frame animation (ms) - alternative to frameRate */
  @Input() frameDelay = DEFAULT_SPIN_CONFIG.frameDelay!;
  /** Loop animation */
  @Input() loop = DEFAULT_SPIN_CONFIG.loop!;
  /** Reverse rotation direction */
  @Input() reverse = false;
  /** Hotspots to display */
  @Input() hotspots: Hotspot[] = [];

  @Output() frameChange = new EventEmitter<number>();
  @Output() hotspotClick = new EventEmitter<Hotspot>();
  @Output() animationStart = new EventEmitter<void>();
  @Output() animationEnd = new EventEmitter<void>();

  @ViewChild('container') containerRef!: ElementRef;

  // State variables as per IMPLEMENTATION_GUIDE.md
  currentFrame = 0;
  zoom = 1;
  isLoading = true;
  isDragging = false;
  isHovering = false;
  isPlaying = false;
  loadedImages: HTMLImageElement[] = [];

  // Drag state
  private dragStartX = 0;
  private dragStartFrame = 0;

  // Animation state using requestAnimationFrame
  private animationFrameId: number | null = null;
  private lastFrameTime = 0;
  protected autoRotateInterval: ReturnType<typeof setInterval> | null = null;

  constructor(
    private spinService: Spin360Service,
    private ngZone: NgZone
  ) {}

  ngOnInit(): void {
    if (this.images.length > 0) {
      this.loadImages();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['images'] && !changes['images'].firstChange && this.images.length > 0) {
      this.loadImages();
    }
  }

  ngOnDestroy(): void {
    this.stopAutoRotate();
    this.stopAnimation();
  }

  /**
   * Preload all frame images for smooth animation
   */
  loadImages(): void {
    this.isLoading = true;
    this.spinService.preloadImages(this.images).subscribe({
      next: (images) => {
        this.loadedImages = images;
        this.isLoading = false;
        // Handle trigger modes
        if (this.autoRotate || this.trigger === 'auto') {
          this.startAutoRotate();
        }
      },
      error: () => {
        this.isLoading = false;
      }
    });
  }

  /** Get total number of frames */
  get totalFrames(): number {
    return this.images.length;
  }

  /** Get calculated frame delay based on frameRate */
  get calculatedFrameDelay(): number {
    // If frameDelay is set, use it; otherwise calculate from frameRate
    if (this.frameDelay && this.frameDelay !== DEFAULT_SPIN_CONFIG.frameDelay) {
      return this.frameDelay;
    }
    return 1000 / this.frameRate; // e.g., 30 FPS = 33.33ms per frame
  }

  get currentImage(): string {
    // In gif mode, show gif when playing/hovering
    if (this.mode === 'gif' && this.isPlaying && this.gifUrl) {
      return this.gifUrl;
    }
    return this.images[this.currentFrame] || this.staticImage || '';
  }

  get displayImage(): string {
    // For gif mode with hover trigger
    if (this.mode === 'gif') {
      if (this.isHovering && this.gifUrl) {
        return this.gifUrl;
      }
      return this.staticImage || this.images[0] || '';
    }
    return this.currentImage;
  }

  get visibleHotspots(): Hotspot[] {
    return this.hotspots.filter(h => h.frameIndex === this.currentFrame);
  }

  // ============================================
  // TRIGGER MODE HANDLERS
  // ============================================

  /** Handle mouse enter for hover trigger mode */
  onMouseEnter(): void {
    this.isHovering = true;
    if (this.trigger === 'hover') {
      this.startAnimation();
    }
  }

  /** Handle mouse leave for hover trigger mode */
  onMouseLeave(): void {
    this.isHovering = false;
    if (this.trigger === 'hover') {
      this.stopAnimation();
    }
  }

  /** Handle click for click trigger mode */
  onClick(): void {
    if (this.trigger === 'click') {
      if (this.isPlaying) {
        this.stopAnimation();
      } else {
        this.startAnimation();
      }
    }
  }

  // ============================================
  // ANIMATION LOGIC (using requestAnimationFrame)
  // As per IMPLEMENTATION_GUIDE.md
  // ============================================

  /**
   * Start the frame animation using requestAnimationFrame
   * This creates smooth animation at the specified frameRate
   */
  private startAnimation(): void {
    if (this.isPlaying) return;
    this.isPlaying = true;
    this.animationStart.emit();

    if (this.mode === 'frames') {
      this.lastFrameTime = performance.now();

      // Run animation outside Angular zone for performance
      this.ngZone.runOutsideAngular(() => {
        this.animateFrame();
      });
    }
  }

  /**
   * Core animation loop using requestAnimationFrame
   * Advances frames based on calculated frame delay
   */
  private animateFrame(): void {
    if (!this.isPlaying) return;

    const currentTime = performance.now();
    const elapsed = currentTime - this.lastFrameTime;

    // Only advance frame when enough time has passed
    if (elapsed >= this.calculatedFrameDelay) {
      this.lastFrameTime = currentTime - (elapsed % this.calculatedFrameDelay);

      // Update frame index
      this.ngZone.run(() => {
        if (this.reverse) {
          this.prevFrame();
        } else {
          this.nextFrame();
        }

        // Check if we should stop (non-looping mode)
        if (!this.loop) {
          const isAtEnd = this.reverse
            ? this.currentFrame === 0
            : this.currentFrame === this.totalFrames - 1;
          if (isAtEnd) {
            this.stopAnimation();
            return;
          }
        }
      });
    }

    // Continue animation loop
    if (this.isPlaying) {
      this.animationFrameId = requestAnimationFrame(() => this.animateFrame());
    }
  }

  /**
   * Stop the animation
   */
  private stopAnimation(): void {
    this.isPlaying = false;
    this.animationEnd.emit();

    if (this.animationFrameId !== null) {
      cancelAnimationFrame(this.animationFrameId);
      this.animationFrameId = null;
    }
  }

  // ============================================
  // DRAG-TO-SPIN LOGIC
  // As per IMPLEMENTATION_GUIDE.md
  // ============================================

  /**
   * Handle drag start (mouse down)
   */
  onMouseDown(event: MouseEvent): void {
    if (!this.draggable) return;
    this.isDragging = true;
    this.dragStartX = event.clientX;
    this.dragStartFrame = this.currentFrame;
    this.stopAutoRotate();
    this.stopAnimation();
  }

  /**
   * Handle drag move - update frame based on drag distance
   * Uses sensitivity to determine how many pixels = 1 frame
   */
  onMouseMove(event: MouseEvent): void {
    if (!this.isDragging) return;

    // Calculate drag distance
    const dragDistance = event.clientX - this.dragStartX;

    // Calculate frame delta based on sensitivity
    // e.g., dragSensitivity=10 means 10px drag = 1 frame
    const frameDelta = Math.floor(dragDistance / this.dragSensitivity);

    // Calculate new frame with wrapping
    let newFrame: number;
    if (this.reverse) {
      newFrame = (this.dragStartFrame - frameDelta) % this.totalFrames;
    } else {
      newFrame = (this.dragStartFrame + frameDelta) % this.totalFrames;
    }

    // Handle negative modulo
    if (newFrame < 0) {
      newFrame = this.totalFrames + newFrame;
    }

    // Only update if frame changed
    if (newFrame !== this.currentFrame) {
      this.currentFrame = newFrame;
      this.frameChange.emit(this.currentFrame);
    }
  }

  /**
   * Handle drag end (mouse up)
   */
  onMouseUp(): void {
    this.isDragging = false;
  }

  // ============================================
  // TOUCH SUPPORT FOR MOBILE
  // ============================================

  /**
   * Handle touch start
   */
  onTouchStart(event: TouchEvent): void {
    if (!this.draggable || event.touches.length !== 1) return;
    this.isDragging = true;
    this.dragStartX = event.touches[0].clientX;
    this.dragStartFrame = this.currentFrame;
    this.stopAutoRotate();
    this.stopAnimation();
  }

  /**
   * Handle touch move
   */
  onTouchMove(event: TouchEvent): void {
    if (!this.isDragging || event.touches.length !== 1) return;
    event.preventDefault(); // Prevent scrolling while spinning

    const dragDistance = event.touches[0].clientX - this.dragStartX;
    const frameDelta = Math.floor(dragDistance / this.dragSensitivity);

    let newFrame = this.reverse
      ? (this.dragStartFrame - frameDelta) % this.totalFrames
      : (this.dragStartFrame + frameDelta) % this.totalFrames;

    if (newFrame < 0) newFrame = this.totalFrames + newFrame;

    if (newFrame !== this.currentFrame) {
      this.currentFrame = newFrame;
      this.frameChange.emit(this.currentFrame);
    }
  }

  /**
   * Handle touch end
   */
  onTouchEnd(): void {
    this.isDragging = false;
  }

  // ============================================
  // ZOOM & CONTROLS
  // ============================================

  /**
   * Handle mouse wheel for zoom
   */
  onWheel(event: WheelEvent): void {
    if (!this.zoomable) return;
    event.preventDefault();
    this.zoom = this.spinService.calculateZoom(this.zoom, -event.deltaY, this.maxZoom);
  }

  /**
   * Go to previous frame
   */
  prevFrame(): void {
    this.currentFrame = (this.currentFrame - 1 + this.totalFrames) % this.totalFrames;
    this.frameChange.emit(this.currentFrame);
  }

  /**
   * Go to next frame
   */
  nextFrame(): void {
    this.currentFrame = (this.currentFrame + 1) % this.totalFrames;
    this.frameChange.emit(this.currentFrame);
  }

  /**
   * Go to a specific frame
   */
  goToFrame(frameIndex: number): void {
    if (frameIndex >= 0 && frameIndex < this.totalFrames) {
      this.currentFrame = frameIndex;
      this.frameChange.emit(this.currentFrame);
    }
  }

  /**
   * Toggle auto-rotate on/off
   */
  toggleAutoRotate(): void {
    if (this.autoRotateInterval) {
      this.stopAutoRotate();
    } else {
      this.startAutoRotate();
    }
  }

  /**
   * Reset zoom to 1x
   */
  resetZoom(): void {
    this.zoom = 1;
  }

  /**
   * Handle hotspot click
   */
  onHotspotClick(hotspot: Hotspot): void {
    this.hotspotClick.emit(hotspot);
  }

  // ============================================
  // AUTO-ROTATE
  // ============================================

  /**
   * Start auto-rotation at specified speed
   */
  private startAutoRotate(): void {
    // Calculate interval: rotationSpeed is degrees per second
    // totalFrames / 360 = frames per degree
    // So: interval = 1000 / (rotationSpeed * totalFrames / 360)
    const framesPerSecond = (this.rotationSpeed / 360) * this.totalFrames;
    const interval = 1000 / framesPerSecond;

    this.autoRotateInterval = setInterval(() => {
      if (this.reverse) {
        this.prevFrame();
      } else {
        this.nextFrame();
      }
    }, interval);
  }

  /**
   * Stop auto-rotation
   */
  private stopAutoRotate(): void {
    if (this.autoRotateInterval) {
      clearInterval(this.autoRotateInterval);
      this.autoRotateInterval = null;
    }
  }
}

