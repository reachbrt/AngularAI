import { AIConfig, ChatMessage, ChatResponse, StreamCallbacks } from '../models/ai-config.model';

/**
 * Base class for AI providers
 */
export abstract class BaseAIProvider {
  protected config: AIConfig;

  constructor(config: AIConfig) {
    this.config = config;
  }

  /**
   * Send a chat request and get a complete response
   */
  abstract chat(messages: ChatMessage[]): Promise<ChatResponse>;

  /**
   * Send a chat request with streaming response
   */
  abstract chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void>;

  /**
   * Get the API endpoint for the provider
   */
  abstract getEndpoint(): string;

  /**
   * Get headers for API requests
   */
  abstract getHeaders(): Record<string, string>;

  /**
   * Transform messages to provider-specific format
   */
  abstract transformMessages(messages: ChatMessage[]): unknown;

  /**
   * Parse provider-specific response to standard format
   */
  abstract parseResponse(response: unknown): ChatResponse;

  /**
   * Helper method to make HTTP requests
   */
  protected async makeRequest(body: unknown, stream = false): Promise<Response> {
    const response = await fetch(this.getEndpoint(), {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(body),
      signal: this.config.timeout 
        ? AbortSignal.timeout(this.config.timeout) 
        : undefined
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`API Error (${response.status}): ${error}`);
    }

    return response;
  }
}

