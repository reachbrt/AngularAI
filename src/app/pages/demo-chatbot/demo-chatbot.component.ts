import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ChatWindowComponent, ChatMessage } from '@angularai/chatbot';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

// Configuration interface
interface ChatbotConfig {
  // Basic
  title: string;
  placeholder: string;
  theme: 'light' | 'dark' | 'blue' | 'green' | 'purple';
  model: string;
  // Toggles
  showAvatars: boolean;
  streaming: boolean;
  fullHeight: boolean;
  enableMarkdown: boolean;
  useProxy: boolean;
  // Advanced
  proxyUrl: string;
  language: 'en' | 'es' | 'fr' | 'de' | 'zh' | 'ja';
  systemPrompt: string;
  // Custom labels
  customLabels: {
    title: string;
    placeholder: string;
    sendButton: string;
    copyButton: string;
    clearButton: string;
    attachButton: string;
    voiceButton: string;
    typing: string;
    error: string;
  };
}

const DEFAULT_CONFIG: ChatbotConfig = {
  title: 'AI Assistant',
  placeholder: 'Ask me anything...',
  theme: 'light',
  model: 'gpt-3.5-turbo',
  showAvatars: true,
  streaming: true,
  fullHeight: false,
  enableMarkdown: true,
  useProxy: false,
  proxyUrl: '/api/chat',
  language: 'en',
  systemPrompt: 'You are a helpful AI assistant. Answer questions concisely and accurately.',
  customLabels: {
    title: 'AI Assistant',
    placeholder: 'Ask me anything...',
    sendButton: 'Send',
    copyButton: 'Copy',
    clearButton: 'Clear chat',
    attachButton: 'Attach file',
    voiceButton: 'Voice input',
    typing: 'Thinking...',
    error: 'An error occurred'
  }
};

@Component({
  selector: 'app-demo-chatbot',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, ChatWindowComponent, APIKeyWarningComponent],
  templateUrl: './demo-chatbot.component.html',
  styleUrl: './demo-chatbot.component.scss'
})
export class DemoChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

  // Configuration options
  config: ChatbotConfig = { ...DEFAULT_CONFIG, customLabels: { ...DEFAULT_CONFIG.customLabels } };

  // Dropdown options
  themeOptions = [
    { value: 'light', label: 'Light' },
    { value: 'dark', label: 'Dark' },
    { value: 'blue', label: 'Blue' },
    { value: 'green', label: 'Green' },
    { value: 'purple', label: 'Purple' }
  ];

  modelOptions = [
    { value: 'gpt-3.5-turbo', label: 'GPT-3.5 Turbo' },
    { value: 'gpt-4', label: 'GPT-4' },
    { value: 'gpt-4-turbo', label: 'GPT-4 Turbo' }
  ];

  languageOptions = [
    { value: 'en', label: 'English' },
    { value: 'es', label: 'Español' },
    { value: 'fr', label: 'Français' },
    { value: 'de', label: 'Deutsch' },
    { value: 'zh', label: '中文' },
    { value: 'ja', label: '日本語' }
  ];

  // Collapsible sections
  showAdvanced = false;
  showCustomLabels = false;

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onMessageSent(message: ChatMessage): void {
    console.log('Message sent:', message);
  }

  resetConfig(): void {
    this.config = { ...DEFAULT_CONFIG, customLabels: { ...DEFAULT_CONFIG.customLabels } };
  }

  getContainerClass(): string {
    return this.config.fullHeight ? 'chat-container full-height' : 'chat-container';
  }
}

