import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { EmotionAwareComponent, EmotionService, EmotionResult } from '@angularai/emotion-ui';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-emotion-ui',
  standalone: true,
  imports: [CommonModule, RouterLink, EmotionAwareComponent, APIKeyWarningComponent],
  templateUrl: './demo-emotion-ui.component.html',
  styleUrl: './demo-emotion-ui.component.scss'
})
export class DemoEmotionUiComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  currentEmotion: EmotionResult | null = null;

  constructor(
    private emotionService: EmotionService,
    private apiKeyService: APIKeyService
  ) {
    this.emotionService.currentEmotion$.subscribe(emotion => {
      this.currentEmotion = emotion;
    });
  }

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  analyzeText(event: Event): void {
    if (!this.hasAPIKey) return;
    const text = (event.target as HTMLTextAreaElement).value;
    if (text.trim()) {
      this.emotionService.analyzeText(text).subscribe();
    }
  }
}

