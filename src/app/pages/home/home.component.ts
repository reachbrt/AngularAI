import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { Subject, takeUntil } from 'rxjs';
import { APIKeyService } from '../../services/api-key.service';
import { ApiKeyModalComponent } from '../../components/api-key-modal/api-key-modal.component';

interface DemoCard {
  title: string;
  description: string;
  route: string;
  icon: string;
  requiresAI?: boolean;
}

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterLink, ApiKeyModalComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  hasAPIKey = false;
  currentProvider = 'Demo Mode';
  showApiKeyModal = false;
  pendingRoute: string | null = null;

  demos: DemoCard[] = [
    { title: 'Core', description: 'Multi-provider AI client foundation', route: '/demo/core', icon: '🧠', requiresAI: true },
    { title: 'Chatbot', description: 'AI-powered chat interface', route: '/demo/chatbot', icon: '💬', requiresAI: true },
    { title: 'Autosuggest', description: 'Smart AI suggestions', route: '/demo/autosuggest', icon: '💡', requiresAI: true },
    { title: 'Smart Form', description: 'AI form validation & auto-correction', route: '/demo/smartform', icon: '📝', requiresAI: true },
    { title: 'Analytics', description: 'AI-powered insights dashboard', route: '/demo/analytics', icon: '📊', requiresAI: true },
    { title: 'Image Caption', description: 'AI image captioning', route: '/demo/image-caption', icon: '🖼️', requiresAI: true },
    { title: 'Emotion UI', description: 'Emotion-aware adaptive UI', route: '/demo/emotion-ui', icon: '😊', requiresAI: true },
    { title: 'Doc Intelligence', description: 'Document OCR & extraction', route: '/demo/doc-intelligence', icon: '📄', requiresAI: true },
    { title: 'Predictive Input', description: 'AI predictive text', route: '/demo/predictive-input', icon: '⌨️', requiresAI: true },
    { title: 'Smart Notify', description: 'Smart notifications', route: '/demo/smart-notify', icon: '🔔', requiresAI: true },
    { title: 'Voice Actions', description: 'Voice command processing', route: '/demo/voice-actions', icon: '🎤', requiresAI: true },
    { title: 'Smart Datatable', description: 'AI-native data tables', route: '/demo/smart-datatable', icon: '📋', requiresAI: true },
    { title: 'Spin 360', description: '360° product viewer', route: '/demo/spin-360', icon: '🔄', requiresAI: false }
  ];

  constructor(
    private apiKeyService: APIKeyService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(keys => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
      this.currentProvider = keys.selectedProvider === 'fallback'
        ? 'Not Configured'
        : keys.selectedProvider.charAt(0).toUpperCase() + keys.selectedProvider.slice(1);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onDemoClick(demo: DemoCard, event: MouseEvent): void {
    // If doesn't require AI, or already has API key, allow normal navigation
    if (!demo.requiresAI || this.hasAPIKey) {
      return; // Let the routerLink handle it
    }

    // Prevent default navigation and show modal
    event.preventDefault();
    event.stopPropagation();
    this.pendingRoute = demo.route;
    this.showApiKeyModal = true;
  }

  onModalClose(): void {
    this.showApiKeyModal = false;
    this.pendingRoute = null;
  }

  onApiKeySaved(): void {
    this.showApiKeyModal = false;
    if (this.pendingRoute) {
      this.router.navigate([this.pendingRoute]);
      this.pendingRoute = null;
    }
  }
}

