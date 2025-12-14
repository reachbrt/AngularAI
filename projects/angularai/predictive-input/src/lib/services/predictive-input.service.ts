import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { Prediction, PredictiveInputConfig, DEFAULT_PREDICTIVE_CONFIG } from '../models/predictive-input.model';

@Injectable({
  providedIn: 'root'
})
export class PredictiveInputService {
  private config: PredictiveInputConfig = DEFAULT_PREDICTIVE_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<PredictiveInputConfig>): void {
    this.config = { ...DEFAULT_PREDICTIVE_CONFIG, ...config };
  }

  /**
   * Get predictions for current input
   */
  getPredictions(text: string): Observable<Prediction[]> {
    if (text.length < (this.config.minLength || 3)) {
      return of([]);
    }

    const prompt = this.buildPrompt(text);

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseResponse(response)),
      catchError(() => of([]))
    );
  }

  /**
   * Get single best completion
   */
  getCompletion(text: string): Observable<string | null> {
    return this.getPredictions(text).pipe(
      map(predictions => predictions.length > 0 ? predictions[0].text : null)
    );
  }

  private buildPrompt(text: string): string {
    let prompt = `Complete this text naturally: "${text}"

`;
    if (this.config.context) {
      prompt += `Context: ${this.config.context}\n`;
    }

    prompt += `Provide ${this.config.maxPredictions || 3} completions in JSON:
[{"text": "completion", "confidence": 0.9, "type": "completion"}]

Only return the completion part, not the original text.`;

    return prompt;
  }

  private parseResponse(response: string): Prediction[] {
    try {
      const match = response.match(/\[[\s\S]*\]/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return parsed.map((item: any) => ({
          text: item.text || '',
          confidence: item.confidence || 0.5,
          type: item.type || 'completion'
        }));
      }
    } catch {}
    
    // Fallback: use response as single prediction
    const cleanResponse = response.trim();
    if (cleanResponse) {
      return [{ text: cleanResponse, confidence: 0.5, type: 'completion' }];
    }
    return [];
  }
}

