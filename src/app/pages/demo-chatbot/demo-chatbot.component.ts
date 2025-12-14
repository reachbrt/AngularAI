import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { ChatWindowComponent, ChatMessage } from '@angularai/chatbot';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-chatbot',
  standalone: true,
  imports: [CommonModule, RouterLink, ChatWindowComponent, APIKeyWarningComponent],
  templateUrl: './demo-chatbot.component.html',
  styleUrl: './demo-chatbot.component.scss'
})
export class DemoChatbotComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;

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
}

