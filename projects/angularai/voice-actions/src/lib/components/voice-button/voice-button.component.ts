import { Component, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject, takeUntil } from 'rxjs';
import { VoiceActionsService } from '../../services/voice-actions.service';
import { VoiceRecognitionResult, VoiceCommand } from '../../models/voice-actions.model';

@Component({
  selector: 'ai-voice-button',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './voice-button.component.html',
  styleUrl: './voice-button.component.scss'
})
export class VoiceButtonComponent implements OnInit, OnDestroy {
  @Output() transcript = new EventEmitter<VoiceRecognitionResult>();
  @Output() command = new EventEmitter<{ command: VoiceCommand; params: Record<string, string> }>();
  @Output() error = new EventEmitter<Error>();

  isListening = false;
  currentTranscript = '';
  isSupported = false;

  private destroy$ = new Subject<void>();

  constructor(private voiceService: VoiceActionsService) {}

  ngOnInit(): void {
    this.isSupported = this.voiceService.isSpeechRecognitionSupported();

    this.voiceService.isListening$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(listening => {
      this.isListening = listening;
    });

    this.voiceService.result$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(result => {
      this.currentTranscript = result.transcript;
      this.transcript.emit(result);
    });

    this.voiceService.command$.pipe(
      takeUntil(this.destroy$)
    ).subscribe(cmd => {
      this.command.emit(cmd);
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  toggleListening(): void {
    if (this.isListening) {
      this.voiceService.stopListening();
    } else {
      if (!this.voiceService.startListening()) {
        this.error.emit(new Error('Speech recognition not supported'));
      }
    }
  }
}

