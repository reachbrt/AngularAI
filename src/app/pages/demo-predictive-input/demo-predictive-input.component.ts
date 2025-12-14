import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PredictiveInputComponent, Prediction } from '@angularai/predictive-input';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-predictive-input',
  standalone: true,
  imports: [CommonModule, RouterLink, PredictiveInputComponent, APIKeyWarningComponent],
  templateUrl: './demo-predictive-input.component.html',
  styleUrl: './demo-predictive-input.component.scss'
})
export class DemoPredictiveInputComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  inputValue = '';
  lastPrediction: Prediction | null = null;

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

  onPredictionAccepted(prediction: Prediction): void {
    this.lastPrediction = prediction;
    console.log('Prediction accepted:', prediction);
  }
}

