import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { PredictiveInputService } from '../../services/predictive-input.service';
import { Prediction, PredictiveInputConfig, DEFAULT_PREDICTIVE_CONFIG } from '../../models/predictive-input.model';

@Component({
  selector: 'ai-predictive-input',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './predictive-input.component.html',
  styleUrl: './predictive-input.component.scss'
})
export class PredictiveInputComponent implements OnInit, OnDestroy {
  @Input() value = '';
  @Input() placeholder = DEFAULT_PREDICTIVE_CONFIG.placeholder!;
  @Input() minLength = DEFAULT_PREDICTIVE_CONFIG.minLength!;
  @Input() debounce = DEFAULT_PREDICTIVE_CONFIG.debounce!;
  @Input() showGhostText = DEFAULT_PREDICTIVE_CONFIG.showGhostText!;
  @Input() context?: string;

  @Output() valueChange = new EventEmitter<string>();
  @Output() predictionAccepted = new EventEmitter<Prediction>();

  predictions: Prediction[] = [];
  ghostText = '';
  isLoading = false;

  private inputSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private predictiveService: PredictiveInputService) {}

  ngOnInit(): void {
    this.predictiveService.configure({
      minLength: this.minLength,
      debounce: this.debounce,
      context: this.context
    });

    this.inputSubject.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged(),
      switchMap(text => {
        this.isLoading = true;
        return this.predictiveService.getPredictions(text);
      }),
      takeUntil(this.destroy$)
    ).subscribe(predictions => {
      this.predictions = predictions;
      this.ghostText = predictions.length > 0 ? predictions[0].text : '';
      this.isLoading = false;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  onInput(event: Event): void {
    const value = (event.target as HTMLInputElement).value;
    this.value = value;
    this.valueChange.emit(value);
    this.inputSubject.next(value);
  }

  onKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Tab' && this.ghostText) {
      event.preventDefault();
      this.acceptPrediction(this.predictions[0]);
    }
  }

  acceptPrediction(prediction: Prediction): void {
    this.value = this.value + prediction.text;
    this.valueChange.emit(this.value);
    this.predictionAccepted.emit(prediction);
    this.ghostText = '';
    this.predictions = [];
  }
}

