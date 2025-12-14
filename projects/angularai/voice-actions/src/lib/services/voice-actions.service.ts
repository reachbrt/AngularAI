import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  VoiceCommand, 
  VoiceRecognitionResult, 
  VoiceActionsConfig,
  DEFAULT_VOICE_CONFIG 
} from '../models/voice-actions.model';

@Injectable({
  providedIn: 'root'
})
export class VoiceActionsService {
  private config: VoiceActionsConfig = DEFAULT_VOICE_CONFIG;
  private commands: VoiceCommand[] = [];
  private recognition: any = null;

  private isListeningSubject = new BehaviorSubject<boolean>(false);
  isListening$ = this.isListeningSubject.asObservable();

  private resultSubject = new Subject<VoiceRecognitionResult>();
  result$ = this.resultSubject.asObservable();

  private commandSubject = new Subject<{ command: VoiceCommand; params: Record<string, string> }>();
  command$ = this.commandSubject.asObservable();

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<VoiceActionsConfig>): void {
    this.config = { ...DEFAULT_VOICE_CONFIG, ...config };
    if (config.commands) {
      this.commands = config.commands;
    }
  }

  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  registerCommands(commands: VoiceCommand[]): void {
    this.commands.push(...commands);
  }

  /**
   * Start listening for voice commands
   */
  startListening(): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech recognition not supported');
      return false;
    }

    if (this.isListeningSubject.value) return true;

    this.initRecognition();
    this.recognition.start();
    this.isListeningSubject.next(true);
    return true;
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.isListeningSubject.next(false);
    }
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' && 
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  /**
   * Match transcript to command using AI
   */
  matchCommand(transcript: string): Observable<VoiceCommand | null> {
    if (!this.config.aiMatching || this.commands.length === 0) {
      return of(this.simpleMatch(transcript));
    }

    const commandList = this.commands.map(c => `${c.action}: "${c.phrase}"`).join('\n');
    const prompt = `Match this voice command to one of these actions:
"${transcript}"

Available commands:
${commandList}

Respond with JSON: {"action": "matched_action", "parameters": {}} or {"action": null} if no match.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseMatchResponse(response)),
      catchError(() => of(this.simpleMatch(transcript)))
    );
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous;
    this.recognition.interimResults = this.config.interimResults;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      this.resultSubject.next({ transcript, confidence, isFinal });

      if (isFinal) {
        this.matchCommand(transcript).subscribe(command => {
          if (command) {
            this.commandSubject.next({ command, params: {} });
          }
        });
      }
    };

    this.recognition.onend = () => {
      if (this.config.continuous && this.isListeningSubject.value) {
        this.recognition.start();
      } else {
        this.isListeningSubject.next(false);
      }
    };
  }

  private simpleMatch(transcript: string): VoiceCommand | null {
    const lower = transcript.toLowerCase();
    return this.commands.find(cmd => 
      lower.includes(cmd.phrase.toLowerCase()) ||
      cmd.aliases?.some(a => lower.includes(a.toLowerCase()))
    ) || null;
  }

  private parseMatchResponse(response: string): VoiceCommand | null {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.action) {
          return this.commands.find(c => c.action === parsed.action) || null;
        }
      }
    } catch {}
    return null;
  }
}

