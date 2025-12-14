import { Component, Input, OnInit, OnDestroy, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { EmotionService } from '../../services/emotion.service';
import { EmotionUIAdaptation, EmotionResult } from '../../models/emotion.model';

@Component({
  selector: 'ai-emotion-aware',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './emotion-aware.component.html',
  styleUrl: './emotion-aware.component.scss'
})
export class EmotionAwareComponent implements OnInit, OnDestroy {
  @Input() showIndicator = true;
  @Input() showSuggestions = true;

  currentEmotion: EmotionResult | null = null;
  adaptation: EmotionUIAdaptation | null = null;

  private destroy$ = new Subject<void>();

  constructor(
    private emotionService: EmotionService,
    private elementRef: ElementRef
  ) {}

  ngOnInit(): void {
    this.emotionService.currentEmotion$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(emotion => {
      this.currentEmotion = emotion;
    });

    this.emotionService.adaptation$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(adaptation => {
      this.adaptation = adaptation;
      this.applyTheme();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  private applyTheme(): void {
    if (this.adaptation) {
      this.emotionService.applyTheme(this.elementRef.nativeElement, this.currentEmotion?.primary);
    }
  }

  getEmotionEmoji(): string {
    if (!this.currentEmotion) return '😐';
    
    const emojiMap: Record<string, string> = {
      happy: '😊',
      sad: '😢',
      angry: '😠',
      fearful: '😨',
      surprised: '😲',
      disgusted: '😒',
      neutral: '😐',
      confused: '😕',
      frustrated: '😤'
    };
    
    return emojiMap[this.currentEmotion.primary] || '😐';
  }
}

