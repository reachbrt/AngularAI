import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  VoiceCommand,
  VoiceRecognitionResult,
  VoiceActionsConfig,
  VoiceState,
  VoiceInfo,
  SUPPORTED_LANGUAGES,
  DEFAULT_VOICE_CONFIG
} from '../models/voice-actions.model';

@Injectable({
  providedIn: 'root'
})
export class VoiceActionsService {
  private config: VoiceActionsConfig = DEFAULT_VOICE_CONFIG;
  private commands: VoiceCommand[] = [];
  private recognition: any = null;
  private synthesis: SpeechSynthesis | null = null;
  private wakeWordTimeout: any = null;
  private speechQueue: string[] = [];
  private isSpeakingNow = false;

  private stateSubject = new BehaviorSubject<VoiceState>({
    isListening: false,
    isSpeaking: false,
    isAwake: false,
    language: 'en-US'
  });
  state$ = this.stateSubject.asObservable();

  // Convenience observables
  get isListening$(): Observable<boolean> {
    return this.state$.pipe(map(s => s.isListening));
  }
  get isSpeaking$(): Observable<boolean> {
    return this.state$.pipe(map(s => s.isSpeaking));
  }
  get isAwake$(): Observable<boolean> {
    return this.state$.pipe(map(s => s.isAwake));
  }

  private resultSubject = new Subject<VoiceRecognitionResult>();
  result$ = this.resultSubject.asObservable();

  private commandSubject = new Subject<{ command: VoiceCommand; params: Record<string, string> }>();
  command$ = this.commandSubject.asObservable();

  private wakeWordSubject = new Subject<void>();
  wakeWord$ = this.wakeWordSubject.asObservable();

  private sleepSubject = new Subject<void>();
  sleep$ = this.sleepSubject.asObservable();

  constructor(private aiClient: AIClientService) {
    if (typeof window !== 'undefined') {
      this.synthesis = window.speechSynthesis;
    }
  }

  configure(config: Partial<VoiceActionsConfig>): void {
    this.config = {
      ...DEFAULT_VOICE_CONFIG,
      ...config,
      tts: { ...DEFAULT_VOICE_CONFIG.tts, ...config.tts },
      wakeWord: { ...DEFAULT_VOICE_CONFIG.wakeWord, ...config.wakeWord }
    };
    if (config.commands) {
      this.commands = config.commands;
    }
    this.updateState({ language: this.config.language || 'en-US' });
  }

  registerCommand(command: VoiceCommand): void {
    this.commands.push(command);
  }

  registerCommands(commands: VoiceCommand[]): void {
    this.commands.push(...commands);
  }

  getCommands(): VoiceCommand[] {
    return [...this.commands];
  }

  clearCommands(): void {
    this.commands = [];
  }

  // ==================== Speech Recognition ====================

  /**
   * Start listening for voice commands
   */
  startListening(): boolean {
    if (!this.isSpeechRecognitionSupported()) {
      console.warn('Speech recognition not supported');
      this.updateState({ error: new Error('Speech recognition not supported') });
      return false;
    }

    if (this.getState().isListening) return true;

    this.initRecognition();
    try {
      this.recognition.start();
      this.updateState({ isListening: true, error: undefined });
      return true;
    } catch (error) {
      this.updateState({ error: error as Error });
      return false;
    }
  }

  /**
   * Stop listening
   */
  stopListening(): void {
    if (this.recognition) {
      this.recognition.stop();
      this.updateState({ isListening: false });
    }
    this.clearWakeWordTimeout();
  }

  /**
   * Check if speech recognition is supported
   */
  isSpeechRecognitionSupported(): boolean {
    return typeof window !== 'undefined' &&
           ('SpeechRecognition' in window || 'webkitSpeechRecognition' in window);
  }

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Record<string, string> {
    return SUPPORTED_LANGUAGES;
  }

  /**
   * Set recognition language
   */
  setLanguage(language: string): void {
    this.config.language = language;
    this.updateState({ language });

    // Restart recognition if active
    if (this.getState().isListening) {
      this.stopListening();
      this.startListening();
    }
  }

  // ==================== Text-to-Speech ====================

  /**
   * Speak text using TTS
   */
  speak(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis || !this.config.tts?.enabled) {
        resolve();
        return;
      }

      if (this.config.tts.queueMode === 'interrupt') {
        this.stopSpeaking();
      } else if (this.isSpeakingNow) {
        this.speechQueue.push(text);
        resolve();
        return;
      }

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = this.config.tts.language || this.config.language || 'en-US';
      utterance.rate = this.config.tts.rate || 1;
      utterance.pitch = this.config.tts.pitch || 1;
      utterance.volume = this.config.tts.volume || 1;

      // Set voice if specified
      if (this.config.tts.voice) {
        const voices = this.synthesis.getVoices();
        const voice = voices.find(v => v.name === this.config.tts!.voice);
        if (voice) utterance.voice = voice;
      }

      utterance.onstart = () => {
        this.isSpeakingNow = true;
        this.updateState({ isSpeaking: true });
      };

      utterance.onend = () => {
        this.isSpeakingNow = false;
        this.updateState({ isSpeaking: false });

        // Process queue
        if (this.speechQueue.length > 0) {
          const next = this.speechQueue.shift();
          if (next) this.speak(next);
        }

        resolve();
      };

      utterance.onerror = (event) => {
        this.isSpeakingNow = false;
        this.updateState({ isSpeaking: false, error: new Error(event.error) });
        reject(new Error(event.error));
      };

      this.synthesis.speak(utterance);
    });
  }

  /**
   * Stop speaking
   */
  stopSpeaking(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.speechQueue = [];
      this.isSpeakingNow = false;
      this.updateState({ isSpeaking: false });
    }
  }

  /**
   * Check if TTS is supported
   */
  isTTSSupported(): boolean {
    return typeof window !== 'undefined' && 'speechSynthesis' in window;
  }

  /**
   * Get available voices
   */
  getVoices(): VoiceInfo[] {
    if (!this.synthesis) return [];
    return this.synthesis.getVoices().map(v => ({
      name: v.name,
      lang: v.lang,
      default: v.default,
      localService: v.localService,
      voiceURI: v.voiceURI
    }));
  }

  /**
   * Get voices for a specific language
   */
  getVoicesForLanguage(language: string): VoiceInfo[] {
    return this.getVoices().filter(v =>
      v.lang.startsWith(language.split('-')[0])
    );
  }

  // ==================== Wake Word ====================

  /**
   * Enable wake word detection
   */
  enableWakeWord(): void {
    if (this.config.wakeWord) {
      this.config.wakeWord.enabled = true;
      this.startListening();
    }
  }

  /**
   * Disable wake word detection
   */
  disableWakeWord(): void {
    if (this.config.wakeWord) {
      this.config.wakeWord.enabled = false;
      this.updateState({ isAwake: false });
    }
    this.clearWakeWordTimeout();
  }

  /**
   * Set wake word phrase
   */
  setWakeWord(phrase: string, aliases?: string[]): void {
    if (this.config.wakeWord) {
      this.config.wakeWord.phrase = phrase;
      if (aliases) this.config.wakeWord.aliases = aliases;
    }
  }

  private checkWakeWord(transcript: string): boolean {
    if (!this.config.wakeWord?.enabled) return false;

    const lower = transcript.toLowerCase();
    const phrase = this.config.wakeWord.phrase?.toLowerCase() || '';
    const aliases = this.config.wakeWord.aliases?.map(a => a.toLowerCase()) || [];
    const allPhrases = [phrase, ...aliases].filter(Boolean);

    return allPhrases.some(p => lower.includes(p));
  }

  private activateWakeWord(): void {
    this.updateState({ isAwake: true });
    this.wakeWordSubject.next();

    // Play wake sound if configured
    if (this.config.wakeWord?.wakeSound) {
      this.playSound(this.config.wakeWord.wakeSound);
    }

    // Set timeout
    this.clearWakeWordTimeout();
    if (this.config.wakeWord?.timeout) {
      this.wakeWordTimeout = setTimeout(() => {
        this.deactivateWakeWord();
      }, this.config.wakeWord.timeout);
    }
  }

  private deactivateWakeWord(): void {
    this.updateState({ isAwake: false });
    this.sleepSubject.next();
    this.clearWakeWordTimeout();

    // Play sleep sound if configured
    if (this.config.wakeWord?.sleepSound) {
      this.playSound(this.config.wakeWord.sleepSound);
    }
  }

  private clearWakeWordTimeout(): void {
    if (this.wakeWordTimeout) {
      clearTimeout(this.wakeWordTimeout);
      this.wakeWordTimeout = null;
    }
  }

  private playSound(url: string): void {
    try {
      const audio = new Audio(url);
      audio.play();
    } catch {}
  }

  // ==================== Command Matching ====================

  /**
   * Match transcript to command using AI
   */
  matchCommand(transcript: string): Observable<{ command: VoiceCommand | null; params: Record<string, string> }> {
    if (!this.config.aiMatching || this.commands.length === 0) {
      const match = this.simpleMatch(transcript);
      return of({ command: match, params: {} });
    }

    const commandList = this.commands.map(c =>
      `${c.action}: "${c.phrase}"${c.parameters ? ` [params: ${c.parameters.join(', ')}]` : ''}`
    ).join('\n');

    const prompt = `Match this voice command to one of these actions and extract parameters:
"${transcript}"

Available commands:
${commandList}

Respond with JSON:
{"action": "matched_action", "parameters": {"param1": "value1"}, "confidence": 0.9}
or {"action": null} if no match.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseMatchResponse(response)),
      catchError(() => of({ command: this.simpleMatch(transcript), params: {} }))
    );
  }

  private initRecognition(): void {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    this.recognition = new SpeechRecognition();
    this.recognition.lang = this.config.language;
    this.recognition.continuous = this.config.continuous || this.config.wakeWord?.enabled;
    this.recognition.interimResults = this.config.interimResults;
    this.recognition.maxAlternatives = this.config.maxAlternatives || 1;

    this.recognition.onresult = (event: any) => {
      const result = event.results[event.results.length - 1];
      const transcript = result[0].transcript;
      const confidence = result[0].confidence;
      const isFinal = result.isFinal;

      const voiceResult: VoiceRecognitionResult = {
        transcript,
        confidence,
        isFinal,
        timestamp: new Date(),
        language: this.config.language
      };

      this.resultSubject.next(voiceResult);
      this.updateState({ lastTranscript: transcript });

      if (isFinal) {
        // Check for wake word
        if (this.config.wakeWord?.enabled && !this.getState().isAwake) {
          if (this.checkWakeWord(transcript)) {
            this.activateWakeWord();
            return;
          }
          return; // Ignore commands when not awake
        }

        // Reset wake word timeout on activity
        if (this.getState().isAwake) {
          this.activateWakeWord(); // Reset timeout
        }

        // Match command
        this.matchCommand(transcript).subscribe(result => {
          if (result.command) {
            voiceResult.matchedCommand = result.command;
            voiceResult.parameters = result.params;

            this.commandSubject.next({ command: result.command, params: result.params });
            this.updateState({ lastCommand: result.command });

            // Execute handler if present
            if (result.command.handler) {
              result.command.handler(result.params);
            }

            // Speak confirmation if configured
            if (this.config.tts?.speakConfirmations && result.command.confirmation) {
              this.speak(result.command.confirmation);
            }
          }
        });
      }
    };

    this.recognition.onerror = (event: any) => {
      this.updateState({ error: new Error(event.error) });

      if (this.config.autoRestart && event.error !== 'aborted') {
        setTimeout(() => {
          if (this.getState().isListening) {
            this.recognition.start();
          }
        }, 1000);
      }
    };

    this.recognition.onend = () => {
      if ((this.config.continuous || this.config.wakeWord?.enabled) &&
          this.getState().isListening) {
        try {
          this.recognition.start();
        } catch {}
      } else {
        this.updateState({ isListening: false });
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

  private parseMatchResponse(response: string): { command: VoiceCommand | null; params: Record<string, string> } {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        if (parsed.action) {
          const command = this.commands.find(c => c.action === parsed.action) || null;
          const confidence = parsed.confidence || 0;

          // Check confidence threshold
          if (confidence < (this.config.aiMatchThreshold || 0.7)) {
            return { command: null, params: {} };
          }

          return { command, params: parsed.parameters || {} };
        }
      }
    } catch {}
    return { command: null, params: {} };
  }

  // ==================== State Management ====================

  getState(): VoiceState {
    return this.stateSubject.getValue();
  }

  private updateState(partial: Partial<VoiceState>): void {
    this.stateSubject.next({ ...this.getState(), ...partial });
  }
}

