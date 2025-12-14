import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { Suggestion, AutosuggestConfig, DEFAULT_AUTOSUGGEST_CONFIG } from '../models/autosuggest.model';

@Injectable({
  providedIn: 'root'
})
export class AutosuggestService {
  private config: AutosuggestConfig = DEFAULT_AUTOSUGGEST_CONFIG;

  constructor(private aiClient: AIClientService) {}

  /**
   * Configure the autosuggest service
   */
  configure(config: Partial<AutosuggestConfig>): void {
    this.config = { ...DEFAULT_AUTOSUGGEST_CONFIG, ...config };
  }

  /**
   * Get suggestions for the given query
   */
  getSuggestions(query: string): Observable<Suggestion[]> {
    if (query.length < (this.config.minLength || 2)) {
      return of([]);
    }

    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = `Generate ${this.config.maxSuggestions || 5} relevant suggestions for: "${query}"
    
Return ONLY a JSON array of suggestions in this format:
[{"text": "suggestion 1"}, {"text": "suggestion 2"}]

No explanations, just the JSON array.`;

    return this.aiClient.ask(userPrompt, systemPrompt).pipe(
      map(response => this.parseSuggestions(response, query)),
      catchError(() => of(this.getFallbackSuggestions(query)))
    );
  }

  private buildSystemPrompt(): string {
    let prompt = 'You are an autocomplete suggestion engine. Generate concise, relevant suggestions.';
    
    if (this.config.context) {
      prompt += ` Context: ${this.config.context}`;
    }
    
    if (this.config.categories?.length) {
      prompt += ` Categories: ${this.config.categories.join(', ')}`;
    }

    return prompt;
  }

  private parseSuggestions(response: string, query: string): Suggestion[] {
    try {
      // Try to extract JSON array from response
      const jsonMatch = response.match(/\[[\s\S]*\]/);
      if (jsonMatch) {
        const parsed = JSON.parse(jsonMatch[0]);
        return parsed.map((item: any, index: number) => ({
          id: `suggestion_${Date.now()}_${index}`,
          text: item.text || item,
          score: 1 - (index * 0.1),
          category: item.category
        }));
      }
    } catch {
      // Fall through to fallback
    }

    return this.getFallbackSuggestions(query);
  }

  private getFallbackSuggestions(query: string): Suggestion[] {
    // Generate basic fallback suggestions
    const suggestions: Suggestion[] = [];
    const baseText = query.trim();

    if (baseText) {
      suggestions.push(
        { id: 'fallback_1', text: `${baseText}...`, score: 0.9 },
        { id: 'fallback_2', text: `Search for "${baseText}"`, score: 0.8 },
        { id: 'fallback_3', text: `Find ${baseText}`, score: 0.7 }
      );
    }

    return suggestions;
  }
}

