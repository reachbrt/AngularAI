import { Component, OnInit, OnDestroy, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APIKeyService } from '../../services/api-key.service';

@Component({
  selector: 'app-api-key-warning',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    @if (!hasAPIKey) {
      <div class="api-blocked">
        <div class="blocked-icon">🔒</div>
        <div class="blocked-content">
          <strong>API Key Required</strong>
          <p>{{ featureName }} requires a valid API key to function. AI features are <strong>disabled</strong> until you configure an API key.</p>
          <p class="note">This is not a demo mode - you need a real API key from OpenAI, Claude, or Gemini to use this feature.</p>
          <a routerLink="/settings" class="setup-btn">Configure API Key →</a>
        </div>
      </div>
    } @else {
      <div class="api-configured" [class.compact]="compact">
        <span class="status-icon">✓</span>
        <span>Using <strong>{{ currentProvider }}</strong> - AI features enabled</span>
      </div>
    }
  `,
  styles: [`
    .api-blocked {
      display: flex;
      gap: 16px;
      padding: 20px 24px;
      background: linear-gradient(135deg, #ffebee, #fce4ec);
      border: 2px solid #f44336;
      border-radius: 12px;
      margin-bottom: 24px;

      .blocked-icon { font-size: 2rem; }

      .blocked-content {
        flex: 1;
        strong { display: block; margin-bottom: 8px; color: #c62828; font-size: 1.1rem; }
        p { margin: 0 0 12px; color: #c62828; font-size: 0.95rem; line-height: 1.5; }
        .note {
          font-size: 0.85rem;
          color: #d32f2f;
          background: rgba(244, 67, 54, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          margin-bottom: 16px;
        }
      }

      .setup-btn {
        display: inline-block;
        padding: 10px 20px;
        background: #f44336;
        color: white;
        text-decoration: none;
        border-radius: 8px;
        font-weight: 600;
        font-size: 0.9rem;
        transition: background 0.2s;
        &:hover { background: #d32f2f; }
      }
    }

    .api-configured {
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 12px 16px;
      background: #e8f5e9;
      border: 1px solid #4caf50;
      border-radius: 8px;
      margin-bottom: 24px;
      color: #2e7d32;

      &.compact { padding: 8px 12px; }
      .status-icon { font-size: 1.1rem; }
    }
  `]
})
export class APIKeyWarningComponent implements OnInit, OnDestroy {
  @Input() featureName = 'This feature';
  @Input() compact = false;

  private destroy$ = new Subject<void>();

  hasAPIKey = false;
  currentProvider = 'Demo Mode';

  constructor(private apiKeyService: APIKeyService) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(keys => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
      this.currentProvider = keys.selectedProvider === 'fallback' 
        ? 'Demo Mode' 
        : keys.selectedProvider.charAt(0).toUpperCase() + keys.selectedProvider.slice(1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}

