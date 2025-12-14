import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { VoiceButtonComponent, VoiceActionsService, VoiceRecognitionResult, VoiceCommand } from '@angularai/voice-actions';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-voice-actions',
  standalone: true,
  imports: [CommonModule, RouterLink, VoiceButtonComponent, APIKeyWarningComponent],
  templateUrl: './demo-voice-actions.component.html',
  styleUrl: './demo-voice-actions.component.scss'
})
export class DemoVoiceActionsComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  lastTranscript = '';
  lastCommand: VoiceCommand | null = null;

  constructor(
    private voiceService: VoiceActionsService,
    private apiKeyService: APIKeyService
  ) {}

  ngOnInit(): void {
    this.apiKeyService.keys$.pipe(takeUntil(this.destroy$)).subscribe(() => {
      this.hasAPIKey = this.apiKeyService.hasKeyForSelectedProvider();
    });

    // Register some demo commands
    this.voiceService.registerCommands([
      { phrase: 'go home', action: 'navigate_home', description: 'Navigate to home page' },
      { phrase: 'search', action: 'open_search', description: 'Open search' },
      { phrase: 'help', action: 'show_help', description: 'Show help' }
    ]);
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onTranscript(result: VoiceRecognitionResult): void {
    this.lastTranscript = result.transcript;
  }

  onCommand(event: { command: VoiceCommand; params: Record<string, string> }): void {
    this.lastCommand = event.command;
    console.log('Command executed:', event);
  }
}

