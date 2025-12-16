import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatMessage, ChatConfig, DEFAULT_I18N } from '../../models/chat.model';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'ai-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent, ChatInputComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked, OnChanges {
  // ==================== Basic Configuration ====================
  /** Chat window title */
  @Input() title = 'AI Assistant';
  /** Provider to use. If not set, uses the globally configured provider from AIClientService */
  @Input() provider?: 'openai' | 'claude' | 'gemini' | 'huggingface' | 'deepseek' | 'ollama';
  /** API key to use. If not set, uses the globally configured API key from AIClientService */
  @Input() apiKey?: string;
  /** Model to use */
  @Input() model?: string;
  /** System prompt defining AI behavior */
  @Input() systemPrompt?: string;
  /** Enable streaming responses */
  @Input() streaming = true;
  /** Input placeholder text */
  @Input() placeholder = 'Ask me anything...';
  /** Welcome message shown on init */
  @Input() welcomeMessage?: string;
  /** Theme: light, dark, blue, green, purple */
  @Input() theme: 'light' | 'dark' | 'blue' | 'green' | 'purple' = 'light';
  /** Show timestamps on messages */
  @Input() showTimestamps = true;
  /** Max messages to keep in history */
  @Input() maxHistory = 50;

  // ==================== Toggle Options ====================
  /** Show user and assistant avatars */
  @Input() showAvatars = true;
  /** Make chat container full height */
  @Input() fullHeight = false;
  /** Enable markdown rendering in messages */
  @Input() enableMarkdown = true;
  /** Route API requests through proxy */
  @Input() useProxy = false;

  // ==================== Advanced Options ====================
  /** Proxy URL when useProxy is enabled */
  @Input() proxyUrl = '/api/chat';
  /** Language for i18n */
  @Input() language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja' = 'en';

  // ==================== Custom Text Labels (i18n) ====================
  /** Custom text labels for internationalization */
  @Input() customLabels?: {
    title?: string;
    placeholder?: string;
    sendButton?: string;
    copyButton?: string;
    clearButton?: string;
    attachButton?: string;
    voiceButton?: string;
    typing?: string;
    error?: string;
  };

  @Output() messageSent = new EventEmitter<ChatMessage>();
  @Output() messageReceived = new EventEmitter<ChatMessage>();
  @Output() error = new EventEmitter<Error>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  messages: ChatMessage[] = [];
  isLoading = false;
  i18nLabels: Record<string, string> = {};
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    this.updateConfiguration();
    this.updateI18nLabels();

    // Subscribe to state changes
    this.chatbotService.chatState$
      .pipe(takeUntil(this.destroy$))
      .subscribe(state => {
        this.messages = state.messages;
        this.isLoading = state.isLoading;
        this.shouldScrollToBottom = true;

        if (state.error) {
          this.error.emit(state.error);
        }
      });
  }

  ngOnChanges(changes: SimpleChanges): void {
    // Reconfigure when inputs change
    const configInputs = ['provider', 'apiKey', 'model', 'systemPrompt', 'streaming',
      'placeholder', 'welcomeMessage', 'theme', 'showTimestamps', 'maxHistory',
      'useProxy', 'proxyUrl', 'language'];

    if (configInputs.some(key => changes[key])) {
      this.updateConfiguration();
    }

    if (changes['language'] || changes['customLabels']) {
      this.updateI18nLabels();
    }
  }

  private updateConfiguration(): void {
    const config: ChatConfig = {
      provider: this.provider,
      apiKey: this.apiKey,
      model: this.model,
      systemPrompt: this.systemPrompt,
      streaming: this.streaming,
      placeholder: this.placeholder,
      welcomeMessage: this.welcomeMessage,
      theme: this.theme as 'light' | 'dark' | 'auto',
      showTimestamps: this.showTimestamps,
      maxHistory: this.maxHistory,
      i18n: {
        language: this.language
      },
      proxy: this.useProxy ? {
        url: this.proxyUrl
      } : undefined
    };

    this.chatbotService.configure(config);
  }

  private updateI18nLabels(): void {
    // Get base labels from i18n
    const baseLabels = DEFAULT_I18N[this.language] || DEFAULT_I18N['en'];

    // Merge with custom labels
    this.i18nLabels = {
      ...baseLabels,
      ...(this.customLabels || {})
    };
  }

  ngAfterViewChecked(): void {
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onSendMessage(content: string): void {
    if (!content.trim()) return;

    this.chatbotService.sendMessage(content)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (message) => {
          this.messageReceived.emit(message);
        },
        error: (err) => {
          this.error.emit(err);
        }
      });

    // Emit user message sent event
    const userMessage = this.messages[this.messages.length - 1];
    if (userMessage?.role === 'user') {
      this.messageSent.emit(userMessage);
    }
  }

  onClearChat(): void {
    this.chatbotService.clearMessages();
  }

  private scrollToBottom(): void {
    if (this.messagesContainer) {
      const el = this.messagesContainer.nativeElement;
      el.scrollTop = el.scrollHeight;
    }
  }

  getThemeClass(): string {
    return `theme-${this.theme}`;
  }

  getContainerClasses(): string {
    const classes = [this.getThemeClass()];
    if (this.fullHeight) classes.push('full-height');
    if (this.showAvatars) classes.push('show-avatars');
    if (this.enableMarkdown) classes.push('enable-markdown');
    return classes.join(' ');
  }

  getLabel(key: string): string {
    return this.i18nLabels[key] || key;
  }
}

