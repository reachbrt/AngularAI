import { AIConfig, ChatMessage, ChatResponse, StreamCallbacks, PROVIDER_ENDPOINTS, DEFAULT_MODELS } from '../models/ai-config.model';
import { BaseAIProvider } from './base.provider';

/**
 * Claude (Anthropic) provider implementation
 */
export class ClaudeProvider extends BaseAIProvider {
  constructor(config: AIConfig) {
    super(config);
  }

  getEndpoint(): string {
    return this.config.baseUrl || PROVIDER_ENDPOINTS.claude;
  }

  getHeaders(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'x-api-key': this.config.apiKey || '',
      'anthropic-version': '2023-06-01'
    };
  }

  transformMessages(messages: ChatMessage[]): unknown {
    // Extract system message if present
    const systemMessage = messages.find(m => m.role === 'system');
    const chatMessages = messages.filter(m => m.role !== 'system');

    return {
      model: this.config.model || DEFAULT_MODELS.claude,
      max_tokens: this.config.maxTokens || 4096,
      ...(systemMessage && { system: systemMessage.content }),
      messages: chatMessages.map(m => ({
        role: m.role,
        content: m.content
      }))
    };
  }

  parseResponse(response: any): ChatResponse {
    return {
      message: response.content?.[0]?.text || '',
      usage: response.usage ? {
        promptTokens: response.usage.input_tokens,
        completionTokens: response.usage.output_tokens,
        totalTokens: response.usage.input_tokens + response.usage.output_tokens
      } : undefined,
      model: response.model,
      finishReason: response.stop_reason
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

            try {
              const parsed = JSON.parse(data);
              if (parsed.type === 'content_block_delta') {
                const token = parsed.delta?.text || '';
                if (token) {
                  fullText += token;
                  callbacks.onToken(token);
                }
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

