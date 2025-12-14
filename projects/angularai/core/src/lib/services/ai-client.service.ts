import { Injectable, InjectionToken, inject } from '@angular/core';
import { Observable, from, BehaviorSubject, throwError } from 'rxjs';
import { AIConfig, AIProvider, ChatMessage, ChatResponse, StreamCallbacks, APIKeyNotConfiguredError, requiresAPIKey, isValidAPIKey, ImageGenerationRequest, ImageGenerationResponse, ImageEditRequest } from '../models/ai-config.model';
import { BaseAIProvider, OpenAIProvider, ClaudeProvider, GeminiProvider, FallbackProvider } from '../providers';

/**
 * Injection token for AI configuration
 */
export const AI_CONFIG = new InjectionToken<AIConfig>('AI_CONFIG');

/**
 * AI Client Service - Main service for interacting with AI providers
 */
@Injectable({
  providedIn: 'root'
})
export class AIClientService {
  private config$ = new BehaviorSubject<AIConfig | null>(null);
  private provider: BaseAIProvider | null = null;

  private isLoading$ = new BehaviorSubject<boolean>(false);
  private error$ = new BehaviorSubject<Error | null>(null);
  private apiKeyMissing$ = new BehaviorSubject<boolean>(true);

  /** Observable for loading state */
  readonly loading$ = this.isLoading$.asObservable();

  /** Observable for error state */
  readonly errors$ = this.error$.asObservable();

  /** Observable to track if API key is missing */
  readonly apiKeyMissing = this.apiKeyMissing$.asObservable();

  constructor() {
    // Try to inject config if provided
    try {
      const config = inject(AI_CONFIG, { optional: true });
      if (config) {
        this.configure(config);
      }
    } catch {
      // Config not provided, will need to be set manually
    }
  }

  /**
   * Configure the AI client with provider settings
   */
  configure(config: AIConfig): void {
    this.config$.next(config);
    this.provider = this.createProvider(config);

    // Check if API key is missing for providers that require it
    const needsKey = requiresAPIKey(config.provider);
    const hasValidKey = isValidAPIKey(config.apiKey);
    this.apiKeyMissing$.next(needsKey && !hasValidKey);
  }

  /**
   * Get current configuration
   */
  getConfig(): AIConfig | null {
    return this.config$.getValue();
  }

  /**
   * Check if client is configured
   */
  isConfigured(): boolean {
    return this.provider !== null;
  }

  /**
   * Check if API key is properly configured for the current provider
   */
  hasValidAPIKey(): boolean {
    const config = this.config$.getValue();
    if (!config) return false;
    if (!requiresAPIKey(config.provider)) return true;
    return isValidAPIKey(config.apiKey);
  }

  /**
   * Get current provider type
   */
  getCurrentProvider(): AIProvider | null {
    return this.config$.getValue()?.provider ?? null;
  }

  /**
   * Ensure we have a valid provider with a valid API key
   * Throws APIKeyNotConfiguredError if no valid provider is available
   */
  private ensureProvider(): Observable<BaseAIProvider> {
    // Check if we have a valid provider with API key
    if (this.provider && this.hasValidAPIKey()) {
      return new Observable(subscriber => {
        subscriber.next(this.provider!);
        subscriber.complete();
      });
    }

    // No valid provider configured - throw error
    const config = this.config$.getValue();
    const provider = config?.provider || 'openai';
    return throwError(() => new APIKeyNotConfiguredError(provider));
  }

  /**
   * Send a chat request and get a response
   */
  chat(messages: ChatMessage[]): Observable<ChatResponse> {
    return new Observable<ChatResponse>(subscriber => {
      this.ensureProvider().subscribe({
        next: (provider) => {
          this.isLoading$.next(true);
          this.error$.next(null);

          provider.chat(messages)
            .then(response => {
              subscriber.next(response);
              subscriber.complete();
            })
            .catch(error => {
              this.error$.next(error);
              subscriber.error(error);
            })
            .finally(() => {
              this.isLoading$.next(false);
            });
        },
        error: (err) => subscriber.error(err)
      });
    });
  }

  /**
   * Send a chat request with streaming response
   */
  chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Observable<void> {
    return new Observable<void>(subscriber => {
      this.ensureProvider().subscribe({
        next: (provider) => {
          this.isLoading$.next(true);
          this.error$.next(null);

          const wrappedCallbacks: StreamCallbacks = {
            onToken: callbacks.onToken,
            onComplete: (text) => {
              this.isLoading$.next(false);
              callbacks.onComplete?.(text);
              subscriber.next();
              subscriber.complete();
            },
            onError: (error) => {
              this.isLoading$.next(false);
              this.error$.next(error);
              callbacks.onError?.(error);
              subscriber.error(error);
            }
          };

          provider.chatStream(messages, wrappedCallbacks);
        },
        error: (err) => {
          callbacks.onError?.(err);
          subscriber.error(err);
        }
      });
    });
  }

  /**
   * Quick chat helper - sends a single message and returns response text
   */
  ask(message: string, systemPrompt?: string): Observable<string> {
    const messages: ChatMessage[] = [];

    if (systemPrompt) {
      messages.push({ role: 'system', content: systemPrompt });
    }

    messages.push({ role: 'user', content: message });

    return new Observable<string>(subscriber => {
      this.chat(messages).subscribe({
        next: response => subscriber.next(response.message),
        error: err => subscriber.error(err),
        complete: () => subscriber.complete()
      });
    });
  }

  /**
   * Generate an image using DALL-E (OpenAI) or similar
   */
  generateImage(request: ImageGenerationRequest): Observable<ImageGenerationResponse> {
    return new Observable<ImageGenerationResponse>(subscriber => {
      const config = this.config$.getValue();
      if (!config || !config.apiKey) {
        subscriber.error(new APIKeyNotConfiguredError(config?.provider || 'openai'));
        return;
      }

      this.isLoading$.next(true);
      this.error$.next(null);

      // Currently only OpenAI supports image generation
      const endpoint = 'https://api.openai.com/v1/images/generations';

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: 'dall-e-3',
          prompt: request.prompt,
          n: request.n || 1,
          size: request.size || '1024x1024',
          quality: request.quality || 'standard',
          response_format: request.responseFormat || 'url',
          style: request.style || 'natural'
        })
      })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`Image generation failed: ${text}`);
            });
          }
          return response.json();
        })
        .then((data: { data: Array<{ url?: string; b64_json?: string; revised_prompt?: string }> }) => {
          const images = data.data.map(item => item.url || item.b64_json || '');
          const revisedPrompts = data.data.map(item => item.revised_prompt).filter(Boolean) as string[];
          subscriber.next({ images, revisedPrompts });
          subscriber.complete();
        })
        .catch(error => {
          this.error$.next(error);
          subscriber.error(error);
        })
        .finally(() => {
          this.isLoading$.next(false);
        });
    });
  }

  /**
   * Analyze an image and return a description
   */
  analyzeImage(imageBase64: string, prompt: string): Observable<string> {
    return new Observable<string>(subscriber => {
      const config = this.config$.getValue();
      if (!config || !config.apiKey) {
        subscriber.error(new APIKeyNotConfiguredError(config?.provider || 'openai'));
        return;
      }

      this.isLoading$.next(true);
      this.error$.next(null);

      // Use GPT-4 Vision for image analysis
      const endpoint = 'https://api.openai.com/v1/chat/completions';

      fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${config.apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: prompt },
                { type: 'image_url', image_url: { url: imageBase64 } }
              ]
            }
          ],
          max_tokens: 1000
        })
      })
        .then(response => {
          if (!response.ok) {
            return response.text().then(text => {
              throw new Error(`Image analysis failed: ${text}`);
            });
          }
          return response.json();
        })
        .then((data: { choices: Array<{ message: { content: string } }> }) => {
          subscriber.next(data.choices[0]?.message?.content || '');
          subscriber.complete();
        })
        .catch(error => {
          this.error$.next(error);
          subscriber.error(error);
        })
        .finally(() => {
          this.isLoading$.next(false);
        });
    });
  }

  /**
   * Create the appropriate provider based on configuration
   * Returns null if API key is required but not provided
   */
  private createProvider(config: AIConfig): BaseAIProvider | null {
    // Check if API key is needed but not provided
    const needsKey = requiresAPIKey(config.provider);
    const hasKey = isValidAPIKey(config.apiKey);

    if (needsKey && !hasKey) {
      // No valid API key - do not create provider
      console.warn(`No API key provided for ${config.provider}. AI features are disabled.`);
      return null;
    }

    switch (config.provider) {
      case 'openai':
        return new OpenAIProvider(config);
      case 'claude':
        return new ClaudeProvider(config);
      case 'gemini':
        return new GeminiProvider(config);
      default:
        // Unknown provider - require API key configuration
        return null;
    }
  }
}

