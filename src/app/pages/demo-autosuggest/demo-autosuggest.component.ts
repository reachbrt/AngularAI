import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AutosuggestComponent, Suggestion } from '@angularai/autosuggest';
import { APIKeyWarningComponent } from '../../components/api-key-warning/api-key-warning.component';
import { APIKeyService } from '../../services/api-key.service';
import { Subject, takeUntil } from 'rxjs';

@Component({
  selector: 'app-demo-autosuggest',
  standalone: true,
  imports: [CommonModule, RouterLink, AutosuggestComponent, APIKeyWarningComponent],
  templateUrl: './demo-autosuggest.component.html',
  styleUrl: './demo-autosuggest.component.scss'
})
export class DemoAutosuggestComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  hasAPIKey = false;
  selectedValue = '';

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

  onSuggestionSelected(suggestion: Suggestion): void {
    this.selectedValue = suggestion.text;
    console.log('Selected:', suggestion);
  }
}

