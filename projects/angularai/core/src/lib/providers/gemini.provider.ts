import { AIConfig, ChatMessage, ChatResponse, StreamCallbacks, PROVIDER_ENDPOINTS, DEFAULT_MODELS } from '../models/ai-config.model';
import { BaseAIProvider } from './base.provider';

/**
 * Google Gemini provider implementation
 */
export class GeminiProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config);
  }

  getEndpoint(): string {
    const model = this.config.model || DEFAULT_MODELS.gemini;
    if (this.config.baseUrl) {
      return this.config.baseUrl;
    }
    return `${PROVIDER_ENDPOINTS.gemini}/${model}:generateContent?key=${this.config.apiKey}`;
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json'
    };
  }

  transformMessages(messages: ChatMessage[]): unknown {
    // Convert to Gemini format
    const contents = messages
      .filter(m => m.role !== 'system')
      .map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }]
      }));

    // Add system instruction if present
    const systemMessage = messages.find(m => m.role === 'system');

    return {
      contents,
      ...(systemMessage && {
        systemInstruction: {
          parts: [{ text: systemMessage.content }]
        }
      }),
      generationConfig: {
        maxOutputTokens: this.config.maxTokens || 4096,
        temperature: this.config.temperature ?? 0.7
      }
    };
  }

  parseResponse(response: any): ChatResponse {
    const candidate = response.candidates?.[0];
    return {
      message: candidate?.content?.parts?.[0]?.text || '',
      usage: response.usageMetadata ? {
        promptTokens: response.usageMetadata.promptTokenCount || 0,
        completionTokens: response.usageMetadata.candidatesTokenCount || 0,
        totalTokens: response.usageMetadata.totalTokenCount || 0
      } : undefined,
      model: this.config.model || DEFAULT_MODELS.gemini,
      finishReason: candidate?.finishReason
    };
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const body = this.transformMessages(messages);
    const response = await this.makeRequest(body);
    const data = await response.json();
    return this.parseResponse(data);
  }

  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    // For streaming, use streamGenerateContent endpoint
    const model = this.config.model || DEFAULT_MODELS.gemini;
    const endpoint = `${PROVIDER_ENDPOINTS.gemini}/${model}:streamGenerateContent?key=${this.config.apiKey}`;
    
    const body = this.transformMessages(messages);

    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body)
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.statusText}`);
      }

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      if (!reader) {
        throw new Error('No response body');
      }

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        try {
          // Gemini streams JSON array
          const parsed = JSON.parse(chunk);
          const token = parsed.candidates?.[0]?.content?.parts?.[0]?.text || '';
          if (token) {
            fullText += token;
            callbacks.onToken(token);
          }
        } catch {
          // Try to extract text from partial JSON
        }
      }

      callbacks.onComplete?.(fullText);
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

