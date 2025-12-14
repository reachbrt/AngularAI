import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { AIClientService, ChatMessage as AIChatMessage } from '@angularai/core';
import { ChatMessage, ChatConfig, ChatState, generateMessageId } from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private state$ = new BehaviorSubject<ChatState>({
    messages: [],
    isLoading: false,
    error: null
  });

  private config: ChatConfig | null = null;

  /** Observable for chat state */
  readonly chatState$ = this.state$.asObservable();

  constructor(private aiClient: AIClientService) {}

  /**
   * Configure the chatbot
   * If provider/apiKey are not provided, the globally configured AIClientService settings are used
   */
  configure(config: ChatConfig): void {
    this.config = config;

    // Only reconfigure AI client if provider is explicitly provided
    // Otherwise, use the globally configured AIClientService
    if (config.provider && config.apiKey) {
      this.aiClient.configure({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model
      });
    }

    // Add welcome message if provided
    if (config.welcomeMessage) {
      this.addMessage({
        id: generateMessageId(),
        role: 'assistant',
        content: config.welcomeMessage,
        timestamp: new Date()
      });
    }
  }

  /**
   * Get current state
   */
  getState(): ChatState {
    return this.state$.getValue();
  }

  /**
   * Get all messages
   */
  getMessages(): ChatMessage[] {
    return this.getState().messages;
  }

  /**
   * Send a message
   */
  sendMessage(content: string): Observable<ChatMessage> {
    return new Observable<ChatMessage>(subscriber => {
      // Create user message
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date()
      };

      this.addMessage(userMessage);
      this.updateState({ isLoading: true, error: null });

      // Build messages array for AI
      const aiMessages: AIChatMessage[] = [];
      
      // Add system prompt if configured
      if (this.config?.systemPrompt) {
        aiMessages.push({ role: 'system', content: this.config.systemPrompt });
      }

      // Add conversation history
      const history = this.getMessages()
        .filter(m => m.role !== 'system')
        .slice(-(this.config?.maxHistory || 20))
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));
      
      aiMessages.push(...history);

      if (this.config?.streaming) {
        // Streaming response
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: '',
          timestamp: new Date(),
          isStreaming: true
        };

        this.addMessage(assistantMessage);

        this.aiClient.chatStream(aiMessages, {
          onToken: (token) => {
            assistantMessage.content += token;
            this.updateMessage(assistantMessage.id, { content: assistantMessage.content });
          },
          onComplete: () => {
            this.updateMessage(assistantMessage.id, { isStreaming: false });
            this.updateState({ isLoading: false });
            subscriber.next(assistantMessage);
            subscriber.complete();
          },
          onError: (error) => {
            this.updateMessage(assistantMessage.id, { 
              isStreaming: false, 
              error: error.message 
            });
            this.updateState({ isLoading: false, error });
            subscriber.error(error);
          }
        }).subscribe();
      } else {
        // Non-streaming response
        this.aiClient.chat(aiMessages).subscribe({
          next: (response) => {
            const assistantMessage: ChatMessage = {
              id: generateMessageId(),
              role: 'assistant',
              content: response.message,
              timestamp: new Date()
            };

            this.addMessage(assistantMessage);
            this.updateState({ isLoading: false });
            subscriber.next(assistantMessage);
            subscriber.complete();
          },
          error: (error) => {
            this.updateState({ isLoading: false, error });
            subscriber.error(error);
          }
        });
      }
    });
  }

  /**
   * Clear chat history
   */
  clearMessages(): void {
    this.updateState({ messages: [], error: null });
  }

  private addMessage(message: ChatMessage): void {
    const messages = [...this.getState().messages, message];
    this.updateState({ messages });
  }

  private updateMessage(id: string, updates: Partial<ChatMessage>): void {
    const messages = this.getState().messages.map(m => 
      m.id === id ? { ...m, ...updates } : m
    );
    this.updateState({ messages });
  }

  private updateState(partial: Partial<ChatState>): void {
    this.state$.next({ ...this.getState(), ...partial });
  }
}

