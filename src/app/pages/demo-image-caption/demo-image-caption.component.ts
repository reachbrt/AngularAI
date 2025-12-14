import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ImageCaptionerComponent, CaptionResult } from '@angularai/image-caption';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-image-caption',
  standalone: true,
  imports: [CommonModule, RouterLink, ImageCaptionerComponent, APIKeyWarningComponent],
  templateUrl: './demo-image-caption.component.html',
  styleUrl: './demo-image-caption.component.scss'
})
export class DemoImageCaptionComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  lastCaption: CaptionResult | null = null;

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

  onCaptionGenerated(result: CaptionResult): void {
    this.lastCaption = result;
    console.log('Caption generated:', result);
  }
}

