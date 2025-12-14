import { Component, Input, Output, EventEmitter, OnInit, OnDestroy, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, takeUntil } from 'rxjs';
import { ChatbotService } from '../../services/chatbot.service';
import { ChatMessage, ChatConfig } from '../../models/chat.model';
import { ChatMessageComponent } from '../chat-message/chat-message.component';
import { ChatInputComponent } from '../chat-input/chat-input.component';

@Component({
  selector: 'ai-chat-window',
  standalone: true,
  imports: [CommonModule, FormsModule, ChatMessageComponent, ChatInputComponent],
  templateUrl: './chat-window.component.html',
  styleUrl: './chat-window.component.scss'
})
export class ChatWindowComponent implements OnInit, OnDestroy, AfterViewChecked {
  /** Provider to use. If not set, uses the globally configured provider from AIClientService */
  @Input() provider?: 'openai' | 'claude' | 'gemini' | 'huggingface' | 'deepseek' | 'ollama';
  /** API key to use. If not set, uses the globally configured API key from AIClientService */
  @Input() apiKey?: string;
  @Input() model?: string;
  @Input() systemPrompt?: string;
  @Input() streaming = true;
  @Input() placeholder = 'Type a message...';
  @Input() welcomeMessage?: string;
  @Input() theme: 'light' | 'dark' | 'auto' = 'light';
  @Input() showTimestamps = true;
  @Input() maxHistory = 50;

  @Output() messageSent = new EventEmitter<ChatMessage>();
  @Output() messageReceived = new EventEmitter<ChatMessage>();
  @Output() error = new EventEmitter<Error>();

  @ViewChild('messagesContainer') private messagesContainer?: ElementRef;

  messages: ChatMessage[] = [];
  isLoading = false;
  private destroy$ = new Subject<void>();
  private shouldScrollToBottom = false;

  constructor(private chatbotService: ChatbotService) {}

  ngOnInit(): void {
    // Configure chatbot - only override provider/apiKey if explicitly provided
    const config: ChatConfig = {
      provider: this.provider, // undefined means use global config
      apiKey: this.apiKey,     // undefined means use global config
      model: this.model,
      systemPrompt: this.systemPrompt,
      streaming: this.streaming,
      placeholder: this.placeholder,
      welcomeMessage: this.welcomeMessage,
      theme: this.theme,
      showTimestamps: this.showTimestamps,
      maxHistory: this.maxHistory
    };

    this.chatbotService.configure(config);

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
    if (this.theme === 'auto') {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'theme-dark' : 'theme-light';
    }
    return `theme-${this.theme}`;
  }
}

