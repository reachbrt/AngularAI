import { AIConfig, ChatMessage, ChatResponse, StreamCallbacks } from '../models/ai-config.model';
import { BaseAIProvider } from './base.provider';

/**
 * Fallback provider for development/testing
 * Returns mock responses when no API key is available
 */
export class FallbackProvider extends BaseAIProvider {
  private mockResponses: string[] = [
    "I'm a mock AI response for development. Configure a real API key to use actual AI capabilities.",
    "This is a fallback response. The system works correctly - just add your API key to enable real AI.",
    "Hello! I'm the development fallback. All systems are functioning properly.",
    "Mock response active. To use real AI, configure your preferred provider (OpenAI, Claude, Gemini, etc.).",
    "Development mode active. Your request was received successfully!"
  ];

  constructor(config: AIConfig) {
    super(config);
  }

  getEndpoint(): string {
    return '';
  }

  getHeaders(): Record<string, string> {
    return {};
  }

  transformMessages(messages: ChatMessage[]): unknown {
    return messages;
  }

  parseResponse(response: unknown): ChatResponse {
    return response as ChatResponse;
  }

  async chat(messages: ChatMessage[]): Promise<ChatResponse> {
    // Simulate network delay
    await this.delay(500);

    const lastMessage = messages[messages.length - 1];
    const response = this.generateMockResponse(lastMessage?.content || '');

    return {
      message: response,
      usage: {
        promptTokens: this.countTokens(messages),
        completionTokens: response.split(' ').length,
        totalTokens: this.countTokens(messages) + response.split(' ').length
      },
      model: 'fallback-mock',
      finishReason: 'stop'
    };
  }

  async chatStream(messages: ChatMessage[], callbacks: StreamCallbacks): Promise<void> {
    const lastMessage = messages[messages.length - 1];
    const response = this.generateMockResponse(lastMessage?.content || '');
    const words = response.split(' ');

    let fullText = '';

    for (const word of words) {
      await this.delay(50); // Simulate streaming delay
      const token = word + ' ';
      fullText += token;
      callbacks.onToken(token);
    }

    callbacks.onComplete?.(fullText.trim());
  }

  private generateMockResponse(input: string): string {
    // Return contextual mock response based on input
    const lowerInput = input.toLowerCase();

    if (lowerInput.includes('hello') || lowerInput.includes('hi')) {
      return "Hello! I'm the development fallback AI. How can I help you test today?";
    }

    if (lowerInput.includes('help')) {
      return "I'm here to help! In development mode, I provide mock responses. Configure your API key to enable real AI capabilities.";
    }

    if (lowerInput.includes('code') || lowerInput.includes('function')) {
      return "Here's a mock code response:\n\n```typescript\nfunction example() {\n  return 'This is a mock response';\n}\n```\n\nFor real code generation, configure your AI provider.";
    }

    // Return random mock response
    return this.mockResponses[Math.floor(Math.random() * this.mockResponses.length)];
  }

  private countTokens(messages: ChatMessage[]): number {
    return messages.reduce((sum, m) => sum + m.content.split(' ').length, 0);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

