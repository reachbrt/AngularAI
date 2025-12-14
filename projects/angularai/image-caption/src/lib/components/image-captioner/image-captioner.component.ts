import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ImageCaptionService } from '../../services/image-caption.service';
import { CaptionResult, ImageCaptionConfig } from '../../models/image-caption.model';

@Component({
  selector: 'ai-image-captioner',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './image-captioner.component.html',
  styleUrl: './image-captioner.component.scss'
})
export class ImageCaptionerComponent {
  @Input() imageUrl?: string;
  @Input() config: ImageCaptionConfig = {};
  @Input() showAlternatives = true;
  @Input() showElements = true;

  @Output() captionGenerated = new EventEmitter<CaptionResult>();
  @Output() error = new EventEmitter<Error>();

  result: CaptionResult | null = null;
  isLoading = false;
  selectedFile: File | null = null;
  previewUrl: string | null = null;

  constructor(private captionService: ImageCaptionService) {}

  ngOnInit(): void {
    this.captionService.configure(this.config);
    if (this.imageUrl) {
      this.generateCaption();
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.previewUrl = URL.createObjectURL(this.selectedFile);
      this.generateCaptionFromFile();
    }
  }

  generateCaption(): void {
    if (!this.imageUrl && !this.previewUrl) return;

    this.isLoading = true;
    this.result = null;

    const url = this.imageUrl || this.previewUrl!;
    this.captionService.generateCaption(url).subscribe({
      next: (result) => {
        this.result = result;
        this.isLoading = false;
        this.captionGenerated.emit(result);
      },
      error: (err) => {
        this.isLoading = false;
        this.error.emit(err);
      }
    });
  }

  generateCaptionFromFile(): void {
    if (!this.selectedFile) return;

    this.isLoading = true;
    this.result = null;

    const reader = new FileReader();
    reader.onload = () => {
      const base64 = reader.result as string;
      this.captionService.generateCaptionFromBase64(base64).subscribe({
        next: (result) => {
          this.result = result;
          this.isLoading = false;
          this.captionGenerated.emit(result);
        },
        error: (err) => {
          this.isLoading = false;
          this.error.emit(err);
        }
      });
    };
    reader.readAsDataURL(this.selectedFile);
  }

  copyCaption(): void {
    if (this.result?.caption) {
      navigator.clipboard.writeText(this.result.caption);
    }
  }
}

