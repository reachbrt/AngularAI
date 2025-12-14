import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { DocumentExtractorComponent, DocumentExtractionResult } from '@angularai/doc-intelligence';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-doc-intelligence',
  standalone: true,
  imports: [CommonModule, RouterLink, DocumentExtractorComponent, APIKeyWarningComponent],
  templateUrl: './demo-doc-intelligence.component.html',
  styleUrl: './demo-doc-intelligence.component.scss'
})
export class DemoDocIntelligenceComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  extractionResult: DocumentExtractionResult | null = null;

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

  onExtractionComplete(result: DocumentExtractionResult): void {
    this.extractionResult = result;
    console.log('Extraction complete:', result);
  }
}

