import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APIKeyService, StoredAPIKeys } from '../../services/api-key.service';
import { AIProvider } from '@angularai/core';

interface ProviderOption {
  id: AIProvider;
  name: string;
  placeholder: string;
  description: string;
}

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  providers: ProviderOption[] = [
    { id: 'openai', name: 'OpenAI', placeholder: 'sk-...', description: 'GPT-4o, GPT-4, GPT-3.5' },
    { id: 'claude', name: 'Anthropic Claude', placeholder: 'sk-ant-...', description: 'Claude 3.5 Sonnet, Claude 3 Opus' },
    { id: 'gemini', name: 'Google Gemini', placeholder: 'AIza...', description: 'Gemini Pro, Gemini Ultra' },
    { id: 'huggingface', name: 'HuggingFace', placeholder: 'hf_...', description: 'Open source models' },
    { id: 'deepseek', name: 'DeepSeek', placeholder: 'sk-...', description: 'DeepSeek Chat' }
  ];

  keys: StoredAPIKeys = { selectedProvider: 'openai' };
  selectedProvider: AIProvider = 'openai';
  saveMessage = '';
  showKeys: Record<string, boolean> = {};

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(keys => {
      this.keys = { ...keys };
      this.selectedProvider = keys.selectedProvider;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleShowKey(provider: string): void {
    this.showKeys[provider] = !this.showKeys[provider];
  }

  getKeyValue(provider: AIProvider): string {
    return (this.keys as unknown as Record<string, string | undefined>)[provider] || '';
  }

  setKeyValue(provider: AIProvider, value: string): void {
    (this.keys as unknown as Record<string, string | undefined>)[provider] = value;
  }

  onProviderChange(): void {
    this.keys.selectedProvider = this.selectedProvider;
  }

  saveSettings(): void {
    this.apiKeyService.saveKeys({
      ...this.keys,
      selectedProvider: this.selectedProvider
    });
    this.showSaveMessage('Settings saved successfully!');
  }

  clearAllKeys(): void {
    if (confirm('Are you sure you want to clear all API keys? This cannot be undone.')) {
      this.apiKeyService.clearAllKeys();
      this.keys = { selectedProvider: 'openai' };
      this.selectedProvider = 'openai';
      this.showSaveMessage('All API keys cleared.');
    }
  }

  private showSaveMessage(message: string): void {
    this.saveMessage = message;
    setTimeout(() => {
      this.saveMessage = '';
    }, 3000);
  }

  hasKeyForProvider(provider: AIProvider): boolean {
    const key = this.getKeyValue(provider);
    return !!key && key.length > 10;
  }

  getProviderName(providerId: AIProvider): string {
    const provider = this.providers.find(p => p.id === providerId);
    return provider?.name || providerId;
  }
}

