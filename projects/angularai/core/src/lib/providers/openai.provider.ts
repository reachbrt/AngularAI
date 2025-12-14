import { AIConfig, ChatMessage, ChatResponse, StreamCallbacks, PROVIDER_ENDPOINTS, DEFAULT_MODELS } from '../models/ai-config.model';
import { BaseAIProvider } from './base.provider';

/**
 * OpenAI provider implementation
 */
export class OpenAIProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config);
  }

  getEndpoint(): string {
    return this.config.baseUrl || PROVIDER_ENDPOINTS.openai;
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${this.config.apiKey}`
    };
  }

  transformMessages(messages: ChatMessage[]): unknown {
    return {
      model: this.config.model || DEFAULT_MODELS.openai,
      messages: messages.map(m => ({
        role: m.role,
        content: m.content,
        ...(m.name && { name: m.name })
      })),
      max_tokens: this.config.maxTokens || 4096,
      temperature: this.config.temperature ?? 0.7
    };
  }

  parseResponse(response: any): ChatResponse {
    return {
      message: response.choices[0]?.message?.content || '',
      usage: response.usage ? {
        promptTokens: response.usage.prompt_tokens,
        completionTokens: response.usage.completion_tokens,
        totalTokens: response.usage.total_tokens
      } : undefined,
      model: response.model,
      finishReason: response.choices[0]?.finish_reason
    };
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    const body = this.transformMessages(messages);
    const response = await this.makeRequest(body);
    const data = await response.json();
    return this.parseResponse(data);
  }

  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    const body = {
      ...this.transformMessages(messages) as object,
      stream: true
    };

    try {
      const response = await this.makeRequest(body, true);
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
        const lines = chunk.split('\n').filter(line => line.trim());

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;

            try {
              const parsed = JSON.parse(data);
              const token = parsed.choices[0]?.delta?.content || '';
              if (token) {
                fullText += token;
                callbacks.onToken(token);
              }
            } catch {
              // Skip invalid JSON
            }
          }
        }
      }

      callbacks.onComplete?.(fullText);
    } catch (error) {
      callbacks.onError?.(error instanceof Error ? error : new Error(String(error)));
    }
  }
}

