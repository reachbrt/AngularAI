import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  EmotionType, 
  EmotionResult, 
  EmotionUIAdaptation, 
  EmotionUIConfig,
  DEFAULT_EMOTION_CONFIG,
  DEFAULT_EMOTION_ADAPTATIONS
} from '../models/emotion.model';

@Injectable({
  providedIn: 'root'
})
export class EmotionService {
  private config: EmotionUIConfig = DEFAULT_EMOTION_CONFIG;
  
  private currentEmotionSubject = new BehaviorSubject<EmotionResult | null>(null);
  currentEmotion$ = this.currentEmotionSubject.asObservable();

  private adaptationSubject = new BehaviorSubject<EmotionUIAdaptation>(DEFAULT_EMOTION_ADAPTATIONS.neutral);
  adaptation$ = this.adaptationSubject.asObservable();

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<EmotionUIConfig>): void {
    this.config = { ...DEFAULT_EMOTION_CONFIG, ...config };
  }

  /**
   * Analyze text for emotion
   */
  analyzeText(text: string): Observable<EmotionResult> {
    if (!this.config.enabled || !text.trim()) {
      return of(this.getNeutralResult());
    }

    const prompt = `Analyze the emotion in this text: "${text}"

Respond with JSON:
{
  "primary": "happy|sad|angry|fearful|surprised|disgusted|neutral|confused|frustrated",
  "confidence": 0.0-1.0,
  "emotions": {"happy": 0.1, "sad": 0.0, ...},
  "sentiment": -1.0 to 1.0
}`;

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const result = this.parseResponse(response);
        this.updateState(result);
        return result;
      }),
      catchError(() => of(this.getNeutralResult()))
    );
  }

  /**
   * Get UI adaptation for current emotion
   */
  getAdaptation(emotion?: EmotionType): EmotionUIAdaptation {
    const emotionType = emotion || this.currentEmotionSubject.value?.primary || 'neutral';
    return this.config.themeMapping?.[emotionType] || DEFAULT_EMOTION_ADAPTATIONS[emotionType];
  }

  /**
   * Apply CSS variables for emotion-based theming
   */
  applyTheme(element: HTMLElement, emotion?: EmotionType): void {
    const adaptation = this.getAdaptation(emotion);
    element.style.setProperty('--emotion-primary', adaptation.colors.primary);
    element.style.setProperty('--emotion-secondary', adaptation.colors.secondary);
    element.style.setProperty('--emotion-background', adaptation.colors.background);
    element.style.setProperty('--emotion-text', adaptation.colors.text);
  }

  /**
   * Reset to neutral state
   */
  reset(): void {
    this.currentEmotionSubject.next(null);
    this.adaptationSubject.next(DEFAULT_EMOTION_ADAPTATIONS.neutral);
  }

  private updateState(result: EmotionResult): void {
    if (result.confidence >= (this.config.minConfidence || 0.6)) {
      this.currentEmotionSubject.next(result);
      if (this.config.adaptUI) {
        this.adaptationSubject.next(this.getAdaptation(result.primary));
      }
    }
  }

  private parseResponse(response: string): EmotionResult {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          primary: parsed.primary || 'neutral',
          confidence: parsed.confidence || 0.5,
          emotions: parsed.emotions || {},
          sentiment: parsed.sentiment || 0
        };
      }
    } catch {}
    return this.getNeutralResult();
  }

  private getNeutralResult(): EmotionResult {
    return {
      primary: 'neutral',
      confidence: 1,
      emotions: { neutral: 1 } as Record<EmotionType, number>,
      sentiment: 0
    };
  }
}

