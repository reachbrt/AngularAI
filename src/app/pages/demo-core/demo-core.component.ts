import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AIClientService } from '@angularai/core';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-core',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink, APIKeyWarningComponent],
  templateUrl: './demo-core.component.html',
  styleUrl: './demo-core.component.scss'
})
export class DemoCoreComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  prompt = '';
  response = '';
  isLoading = false;
  streamedResponse = '';

  constructor(
    private aiClient: AIClientService,
    private apiKeyService: APIKeyService
  ) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  sendPrompt(): void {
    if (!this.prompt.trim()) return;
    
    this.isLoading = true;
    this.response = '';
    
    this.aiClient.ask(this.prompt).subscribe({
      next: (response) => {
        this.response = response;
        this.isLoading = false;
      },
      error: (err) => {
        this.response = `Error: ${err.message}`;
        this.isLoading = false;
      }
    });
  }

  sendStreamingPrompt(): void {
    if (!this.prompt.trim()) return;

    this.isLoading = true;
    this.streamedResponse = '';

    this.aiClient.chatStream(
      [{ role: 'user', content: this.prompt }],
      {
        onToken: (token: string) => {
          this.streamedResponse += token;
        },
        onComplete: () => {
          this.isLoading = false;
        },
        onError: (err: Error) => {
          this.streamedResponse = `Error: ${err.message}`;
          this.isLoading = false;
        }
      }
    ).subscribe();
  }
}

