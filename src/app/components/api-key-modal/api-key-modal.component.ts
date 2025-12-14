import { Component, EventEmitter, Output, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AIProvider } from '@angularai/core';
import { APIKeyService, StoredAPIKeys } from '../../services/api-key.service';

@Component({
  selector: 'app-api-key-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="modal-backdrop" (click)="onBackdropClick($event)">
      <div class="modal-content">
        <button class="close-btn" (click)="close.emit()">&times;</button>
        <h2>🔑 Configure API Key</h2>
        <p class="modal-desc">Enter your API key to enable AI features in this demo.</p>

        <div class="form-group">
          <label>Select Provider</label>
          <select [(ngModel)]="selectedProvider" (ngModelChange)="onProviderChange()">
            <option value="openai">OpenAI (GPT-4)</option>
            <option value="claude">Anthropic Claude</option>
            <option value="gemini">Google Gemini</option>
          </select>
        </div>

        <div class="form-group">
          <label>API Key</label>
          <input
            type="password"
            [(ngModel)]="apiKey"
            [placeholder]="getPlaceholder()"
            autocomplete="off"
          />
        </div>

        <div class="warning-box">
          <span class="warning-icon">⚠️</span>
          <p>Your API key is stored locally in your browser. Do not use production keys.</p>
        </div>

        <div class="button-group">
          <button class="btn-cancel" (click)="close.emit()">Cancel</button>
          <button class="btn-save" (click)="saveAndContinue()" [disabled]="!apiKey.trim()">
            Save & Continue
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .modal-backdrop {
      position: fixed; top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(0,0,0,0.6); display: flex; align-items: center; justify-content: center; z-index: 1000;
    }
    .modal-content {
      background: white; border-radius: 16px; padding: 32px; max-width: 450px; width: 90%;
      position: relative; box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    .close-btn {
      position: absolute; top: 16px; right: 16px; background: none; border: none;
      font-size: 24px; cursor: pointer; color: #999; &:hover { color: #333; }
    }
    h2 { margin: 0 0 8px; font-size: 1.5rem; }
    .modal-desc { color: #666; margin: 0 0 24px; }
    .form-group { margin-bottom: 20px;
      label { display: block; margin-bottom: 8px; font-weight: 600; color: #333; }
      select, input {
        width: 100%; padding: 12px; border: 2px solid #e0e0e0; border-radius: 8px;
        font-size: 14px; box-sizing: border-box;
        &:focus { border-color: #007bff; outline: none; }
      }
    }
    .warning-box {
      display: flex; align-items: flex-start; gap: 10px;
      background: #fff8e1; border: 1px solid #ffe082; border-radius: 8px; padding: 12px;
      margin-bottom: 24px;
      .warning-icon { font-size: 1.2rem; }
      p { margin: 0; font-size: 13px; color: #795548; }
    }
    .button-group { display: flex; gap: 12px; justify-content: flex-end; }
    .btn-cancel {
      padding: 12px 24px; border: 2px solid #e0e0e0; background: white;
      border-radius: 8px; cursor: pointer; font-size: 14px;
      &:hover { background: #f5f5f5; }
    }
    .btn-save {
      padding: 12px 24px; border: none; background: #007bff; color: white;
      border-radius: 8px; cursor: pointer; font-size: 14px; font-weight: 600;
      &:hover:not(:disabled) { background: #0056b3; }
      &:disabled { opacity: 0.5; cursor: not-allowed; }
    }
  `]
})
export class ApiKeyModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() saved = new EventEmitter<void>();

  selectedProvider: AIProvider = 'openai';
  apiKey = '';

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    const keys = this.apiKeyService.getKeys();
    this.selectedProvider = keys.selectedProvider === 'fallback' ? 'openai' : keys.selectedProvider;
    this.apiKey = this.apiKeyService.getKeyForProvider(this.selectedProvider) || '';
  }

  onProviderChange(): void {
    this.apiKey = this.apiKeyService.getKeyForProvider(this.selectedProvider) || '';
  }

  getPlaceholder(): string {
    const placeholders: Record<string, string> = {
      openai: 'sk-...',
      claude: 'sk-ant-...',
      gemini: 'AI...',
      huggingface: 'hf_...',
      deepseek: 'sk-...',
      fallback: ''
    };
    return placeholders[this.selectedProvider] || 'Enter API key...';
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close.emit();
    }
  }

  saveAndContinue(): void {
    if (this.apiKey.trim()) {
      // Build the update object explicitly
      const update: Partial<StoredAPIKeys> = {
        selectedProvider: this.selectedProvider
      };

      // Set the API key for the selected provider
      switch (this.selectedProvider) {
        case 'openai':
          update.openai = this.apiKey.trim();
          break;
        case 'claude':
          update.claude = this.apiKey.trim();
          break;
        case 'gemini':
          update.gemini = this.apiKey.trim();
          break;
        case 'huggingface':
          update.huggingface = this.apiKey.trim();
          break;
        case 'deepseek':
          update.deepseek = this.apiKey.trim();
          break;
      }

      console.log('Saving API key config:', update);
      this.apiKeyService.saveKeys(update);
      this.saved.emit();
      this.close.emit();
    }
  }
}

