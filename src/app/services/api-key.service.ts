import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { AIClientService, AIProvider } from '@angularai/core';

const STORAGE_KEY = 'angularai_api_keys';

export interface StoredAPIKeys {
  openai?: string;
  claude?: string;
  gemini?: string;
  huggingface?: string;
  deepseek?: string;
  selectedProvider: AIProvider;
}

@Injectable({
  providedIn: 'root'
})
export class APIKeyService {
  private apiKeys$ = new BehaviorSubject<StoredAPIKeys>(this.loadFromStorage());

  /** Observable for current API key configuration */
  readonly keys$ = this.apiKeys$.asObservable();

  constructor(private aiClient: AIClientService) {
    // Initialize AI client with stored configuration
    this.initializeAIClient();
  }

  /**
   * Get current stored API keys
   */
  getKeys(): StoredAPIKeys {
    return this.apiKeys$.getValue();
  }

  /**
   * Check if any API key is configured
   */
  hasAnyKey(): boolean {
    const keys = this.getKeys();
    return !!(keys.openai || keys.claude || keys.gemini || keys.huggingface || keys.deepseek);
  }

  /**
   * Check if the selected provider has a valid key
   * Note: 'fallback' is NOT valid - users must configure a real API key
   */
  hasKeyForSelectedProvider(): boolean {
    const keys = this.getKeys();
    const provider = keys.selectedProvider;

    // Fallback is NOT valid - we require a real API key
    if (provider === 'fallback') return false;

    // Ollama runs locally without API key
    if (provider === 'ollama') return true;

    switch (provider) {
      case 'openai': return !!keys.openai;
      case 'claude': return !!keys.claude;
      case 'gemini': return !!keys.gemini;
      case 'huggingface': return !!keys.huggingface;
      case 'deepseek': return !!keys.deepseek;
      default: return false;
    }
  }

  /**
   * Get the key for the selected provider
   */
  getKeyForProvider(provider: AIProvider): string | undefined {
    const keys = this.getKeys();
    switch (provider) {
      case 'openai': return keys.openai;
      case 'claude': return keys.claude;
      case 'gemini': return keys.gemini;
      case 'huggingface': return keys.huggingface;
      case 'deepseek': return keys.deepseek;
      default: return undefined;
    }
  }

  /**
   * Save API key for a specific provider
   */
  saveKey(provider: AIProvider, apiKey: string): void {
    const current = this.getKeys();
    const updated: StoredAPIKeys = { ...current, [provider]: apiKey };
    this.saveToStorage(updated);
    this.apiKeys$.next(updated);
    this.initializeAIClient();
  }

  /**
   * Save all API keys and selected provider
   */
  saveKeys(keys: Partial<StoredAPIKeys>): void {
    const current = this.getKeys();
    const updated: StoredAPIKeys = { ...current, ...keys };
    console.log('APIKeyService.saveKeys - Saving:', keys);
    console.log('APIKeyService.saveKeys - Updated state:', updated);
    this.saveToStorage(updated);
    this.apiKeys$.next(updated);
    this.initializeAIClient();
    console.log('APIKeyService.saveKeys - hasKeyForSelectedProvider:', this.hasKeyForSelectedProvider());
  }

  /**
   * Set the selected provider
   */
  setProvider(provider: AIProvider): void {
    const current = this.getKeys();
    const updated: StoredAPIKeys = { ...current, selectedProvider: provider };
    this.saveToStorage(updated);
    this.apiKeys$.next(updated);
    this.initializeAIClient();
  }

  /**
   * Clear all stored API keys
   */
  clearAllKeys(): void {
    localStorage.removeItem(STORAGE_KEY);
    const empty: StoredAPIKeys = { selectedProvider: 'openai' };
    this.apiKeys$.next(empty);
    this.initializeAIClient();
  }

  /**
   * Initialize AI client with current configuration
   */
  private initializeAIClient(): void {
    const keys = this.getKeys();
    const provider = keys.selectedProvider || 'fallback';
    const apiKey = this.getKeyForProvider(provider);

    this.aiClient.configure({
      provider,
      apiKey
    });
  }

  private loadFromStorage(): StoredAPIKeys {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        // Migrate from fallback to openai if needed
        if (parsed.selectedProvider === 'fallback') {
          parsed.selectedProvider = 'openai';
        }
        return parsed;
      }
    } catch (e) {
      console.warn('Failed to load API keys from localStorage:', e);
    }
    return { selectedProvider: 'openai' };
  }

  private saveToStorage(keys: StoredAPIKeys): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(keys));
    } catch (e) {
      console.warn('Failed to save API keys to localStorage:', e);
    }
  }
}

