import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject } from 'rxjs';
import { AIClientService, ChatMessage as AIChatMessage } from '@angularai/core';
import {
  ChatMessage,
  ChatConfig,
  ChatState,
  ChatAttachment,
  RAGChunk,
  DEFAULT_I18N,
  generateMessageId,
  generateAttachmentId
} from '../models/chat.model';

@Injectable({
  providedIn: 'root'
})
export class ChatbotService {
  private state$ = new BehaviorSubject<ChatState>({
    messages: [],
    isLoading: false,
    error: null,
    isListening: false,
    isSpeaking: false,
    currentLanguage: 'en',
    ragDocuments: 0
  });

  private config: ChatConfig | null = null;
  private ragChunks: RAGChunk[] = [];
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private conversationId: string = generateMessageId();

  // Event subjects
  private voiceResult$ = new Subject<string>();
  private speechEnd$ = new Subject<void>();

  /** Observable for chat state */
  readonly chatState$ = this.state$.asObservable();

  /** Observable for voice recognition results */
  readonly voiceResult = this.voiceResult$.asObservable();

  /** Observable for speech synthesis end */
  readonly speechEnd = this.speechEnd$.asObservable();

  constructor(private aiClient: AIClientService) {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
    }
  }

  /**
   * Configure the chatbot
   */
  configure(config: ChatConfig): void {
    this.config = config;

    // Configure AI client if provider is explicitly provided
    if (config.provider && config.apiKey) {
      this.aiClient.configure({
        provider: config.provider,
        apiKey: config.apiKey,
        model: config.model
      });
    }

    // Set language
    if (config.i18n?.language) {
      this.updateState({ currentLanguage: config.i18n.language });
    } else if (config.i18n?.autoDetect && typeof navigator !== 'undefined') {
      const browserLang = navigator.language.split('-')[0];
      this.updateState({ currentLanguage: browserLang });
    }

    // Index RAG documents if provided
    if (config.rag?.enabled && config.rag.documents?.length) {
      this.indexDocuments(config.rag.documents);
    }

    // Load stored messages if storage is configured
    if (config.storage?.autoSave) {
      this.loadFromStorage();
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

  // ==================== RAG Methods ====================

  /**
   * Index documents for RAG
   */
  indexDocuments(documents: string[]): void {
    const chunkSize = this.config?.rag?.chunkSize || 500;
    const overlap = this.config?.rag?.chunkOverlap || 50;

    this.ragChunks = [];

    for (const doc of documents) {
      const chunks = this.splitIntoChunks(doc, chunkSize, overlap);
      for (const chunk of chunks) {
        this.ragChunks.push({
          id: `chunk_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          content: chunk,
          metadata: { source: 'document' }
        });
      }
    }

    this.updateState({ ragDocuments: this.ragChunks.length });
  }

  /**
   * Add URL content for RAG (simplified - actual implementation would fetch)
   */
  async addUrlForRAG(url: string): Promise<void> {
    // In a real implementation, this would fetch and parse the URL
    // For now, we store the URL as a reference
    this.ragChunks.push({
      id: `url_${Date.now()}`,
      content: `Reference: ${url}`,
      metadata: { source: 'url', url }
    });
    this.updateState({ ragDocuments: this.ragChunks.length });
  }

  /**
   * Search RAG chunks for relevant context
   */
  private searchRAG(query: string): string[] {
    if (!this.ragChunks.length) return [];

    const topK = this.config?.rag?.topK || 3;
    const queryLower = query.toLowerCase();
    const queryWords = queryLower.split(/\s+/);

    // Simple keyword-based relevance scoring
    const scored = this.ragChunks.map(chunk => {
      const contentLower = chunk.content.toLowerCase();
      let score = 0;
      for (const word of queryWords) {
        if (word.length > 2 && contentLower.includes(word)) {
          score += 1;
        }
      }
      return { chunk, score };
    });

    return scored
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, topK)
      .map(s => s.chunk.content);
  }

  private splitIntoChunks(text: string, size: number, overlap: number): string[] {
    const chunks: string[] = [];
    let start = 0;

    while (start < text.length) {
      const end = Math.min(start + size, text.length);
      chunks.push(text.slice(start, end));
      start = end - overlap;
      if (start >= text.length - overlap) break;
    }

    return chunks;
  }

  // ==================== Voice Methods ====================

  /**
   * Start voice input
   */
  startVoiceInput(): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech recognition not supported');
      return false;
    }

    if (this.getState().isListening) return true;

    this.initRecognition();
    this.recognition.start();
    this.updateState({ isListening: true });
    return true;
  }

  /**
   * Stop voice input
   */
  stopVoiceInput(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.updateState({ isListening: false });
    }
  }

  /**
   * Speak text using TTS
   */
  speak(text: string): void {
    if (!this.synthesis || !this.config?.voice?.outputEnabled) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = this.config.voice.language || this.getState().currentLanguage || 'en';
    utterance.rate = this.config.voice.rate || 1;
    utterance.pitch = this.config.voice.pitch || 1;

    if (this.config.voice.voice) {
      const voices = this.synthesis.getVoices();
      const voice = voices.find(v => v.name === this.config!.voice!.voice);
      if (voice) utterance.voice = voice;
    }

    utterance.onstart = () => this.updateState({ isSpeaking: true });
    utterance.onend = () => {
      this.updateState({ isSpeaking: false });
      this.speechEnd$.next();
    };

    this.synthesis.speak(utterance);
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.updateState({ isSpeaking: false });
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config?.voice?.language || this.getState().currentLanguage || 'en';
    this.recognition.continuous = this.config?.voice?.continuous || false;
    this.recognition.interimResults = false;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      this.voiceResult$.next(transcript);
    };

    this.recognition.onend = () => {
      this.updateState({ isListening: false });
    };
  }

  // ==================== Storage Methods ====================

  /**
   * Save messages to storage
   */
  async saveToStorage(): Promise<void> {
    const storage = this.config?.storage;
    if (!storage) return;

    const messages = this.getMessages();

    if (storage.adapter) {
      await storage.adapter.save(this.conversationId, messages);
    } else if (storage.type === 'localStorage' && typeof localStorage !== 'undefined') {
      const key = `${storage.keyPrefix || 'chatbot'}_${this.conversationId}`;
      localStorage.setItem(key, JSON.stringify(messages));
    } else if (storage.type === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
      const key = `${storage.keyPrefix || 'chatbot'}_${this.conversationId}`;
      sessionStorage.setItem(key, JSON.stringify(messages));
    }
  }

  /**
   * Load messages from storage
   */
  async loadFromStorage(conversationId?: string): Promise<void> {
    const storage = this.config?.storage;
    if (!storage) return;

    const id = conversationId || this.conversationId;

    try {
      let messages: ChatMessage[] = [];

      if (storage.adapter) {
        messages = await storage.adapter.load(id);
      } else if (storage.type === 'localStorage' && typeof localStorage !== 'undefined') {
        const key = `${storage.keyPrefix || 'chatbot'}_${id}`;
        const stored = localStorage.getItem(key);
        if (stored) messages = JSON.parse(stored);
      } else if (storage.type === 'sessionStorage' && typeof sessionStorage !== 'undefined') {
        const key = `${storage.keyPrefix || 'chatbot'}_${id}`;
        const stored = sessionStorage.getItem(key);
        if (stored) messages = JSON.parse(stored);
      }

      if (messages.length > 0) {
        this.conversationId = id;
        this.updateState({ messages });
      }
    } catch (error) {
      console.error('Failed to load from storage:', error);
    }
  }

  /**
   * Set conversation ID
   */
  setConversationId(id: string): void {
    this.conversationId = id;
  }

  /**
   * Get conversation ID
   */
  getConversationId(): string {
    return this.conversationId;
  }

  // ==================== i18n Methods ====================

  /**
   * Get translated string
   */
  t(key: string): string {
    const lang = this.getState().currentLanguage || 'en';
    const customTranslations = this.config?.i18n?.translations;

    // Check custom translations first
    if (customTranslations?.[lang]?.[key]) {
      return customTranslations[lang][key];
    }

    // Fall back to default translations
    return DEFAULT_I18N[lang]?.[key] || DEFAULT_I18N['en']?.[key] || key;
  }

  /**
   * Set language
   */
  setLanguage(language: string): void {
    this.updateState({ currentLanguage: language });
  }

  /**
   * Get available languages
   */
  getAvailableLanguages(): string[] {
    const defaults = Object.keys(DEFAULT_I18N);
    const custom = this.config?.i18n?.availableLanguages || [];
    return [...new Set([...defaults, ...custom])];
  }

  // ==================== Attachment Methods ====================

  /**
   * Add attachment to pending message
   */
  createAttachment(file: File): Promise<ChatAttachment> {
    return new Promise((resolve, reject) => {
      if (!this.config?.allowAttachments) {
        reject(new Error('Attachments are not allowed'));
        return;
      }

      const maxSize = this.config.maxAttachmentSize || 10 * 1024 * 1024; // 10MB default
      if (file.size > maxSize) {
        reject(new Error(`File size exceeds maximum of ${maxSize} bytes`));
        return;
      }

      const allowedTypes = this.config.allowedFileTypes;
      if (allowedTypes?.length && !allowedTypes.some(t => file.type.startsWith(t))) {
        reject(new Error(`File type ${file.type} is not allowed`));
        return;
      }

      const reader = new FileReader();
      reader.onload = () => {
        resolve({
          id: generateAttachmentId(),
          name: file.name,
          type: file.type,
          size: file.size,
          base64: reader.result as string
        });
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  }

  // ==================== Core Methods ====================

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
   * Send a message with optional attachments
   */
  sendMessage(content: string, attachments?: ChatAttachment[]): Observable<ChatMessage> {
    return new Observable<ChatMessage>(subscriber => {
      const userMessage: ChatMessage = {
        id: generateMessageId(),
        role: 'user',
        content,
        timestamp: new Date(),
        attachments,
        language: this.getState().currentLanguage
      };

      this.addMessage(userMessage);
      this.updateState({ isLoading: true, error: null });

      // Build messages array for AI
      const aiMessages: AIChatMessage[] = [];

      // Build system prompt with RAG context
      let systemPrompt = this.config?.systemPrompt || '';

      if (this.config?.rag?.enabled && this.ragChunks.length > 0) {
        const relevantContext = this.searchRAG(content);
        if (relevantContext.length > 0) {
          systemPrompt += `\n\nRelevant context:\n${relevantContext.join('\n---\n')}`;
          userMessage.ragContext = relevantContext;
        }
      }

      if (systemPrompt) {
        aiMessages.push({ role: 'system', content: systemPrompt });
      }

      // Add conversation history
      const history = this.getMessages()
        .filter(m => m.role !== 'system')
        .slice(-(this.config?.maxHistory || 20))
        .map(m => ({ role: m.role as 'user' | 'assistant', content: m.content }));

      aiMessages.push(...history);

      if (this.config?.streaming) {
        this.handleStreamingResponse(aiMessages, subscriber);
      } else {
        this.handleNonStreamingResponse(aiMessages, subscriber);
      }
    });
  }

  private handleStreamingResponse(
    aiMessages: AIChatMessage[],
    subscriber: any
  ): void {
    const assistantMessage: ChatMessage = {
      id: generateMessageId(),
      role: 'assistant',
      content: '',
      timestamp: new Date(),
      isStreaming: true,
      language: this.getState().currentLanguage
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
        this.autoSave();

        // Speak response if voice output is enabled
        if (this.config?.voice?.outputEnabled) {
          this.speak(assistantMessage.content);
        }

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
  }

  private handleNonStreamingResponse(
    aiMessages: AIChatMessage[],
    subscriber: any
  ): void {
    this.aiClient.chat(aiMessages).subscribe({
      next: (response) => {
        const assistantMessage: ChatMessage = {
          id: generateMessageId(),
          role: 'assistant',
          content: response.message,
          timestamp: new Date(),
          language: this.getState().currentLanguage
        };

        this.addMessage(assistantMessage);
        this.updateState({ isLoading: false });
        this.autoSave();

        // Speak response if voice output is enabled
        if (this.config?.voice?.outputEnabled) {
          this.speak(assistantMessage.content);
        }

        subscriber.next(assistantMessage);
        subscriber.complete();
      },
      error: (error) => {
        this.updateState({ isLoading: false, error });
        subscriber.error(error);
      }
    });
  }

  private autoSave(): void {
    if (this.config?.storage?.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * Clear chat history
   */
  clearMessages(): void {
    this.updateState({ messages: [], error: null });
    if (this.config?.storage?.autoSave) {
      this.saveToStorage();
    }
  }

  /**
   * Clear RAG documents
   */
  clearRAG(): void {
    this.ragChunks = [];
    this.updateState({ ragDocuments: 0 });
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

