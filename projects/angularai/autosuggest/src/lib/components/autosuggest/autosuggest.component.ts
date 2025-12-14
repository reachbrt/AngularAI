import { Component, Input, Output, EventEmitter, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, debounceTime, distinctUntilChanged, switchMap, takeUntil } from 'rxjs';
import { AutosuggestService } from '../../services/autosuggest.service';
import { Suggestion, AutosuggestConfig, DEFAULT_AUTOSUGGEST_CONFIG } from '../../models/autosuggest.model';

@Component({
  selector: 'ai-autosuggest',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './autosuggest.component.html',
  styleUrl: './autosuggest.component.scss'
})
export class AutosuggestComponent implements OnInit, OnDestroy {
  @Input() minLength = DEFAULT_AUTOSUGGEST_CONFIG.minLength!;
  @Input() debounce = DEFAULT_AUTOSUGGEST_CONFIG.debounce!;
  @Input() maxSuggestions = DEFAULT_AUTOSUGGEST_CONFIG.maxSuggestions!;
  @Input() placeholder = DEFAULT_AUTOSUGGEST_CONFIG.placeholder!;
  @Input() context?: string;
  @Input() categories?: string[];
  @Input() value = '';

  @Output() valueChange = new EventEmitter<string>();
  @Output() suggestionSelected = new EventEmitter<Suggestion>();
  @Output() search = new EventEmitter<string>();

  suggestions: Suggestion[] = [];
  isLoading = false;
  showSuggestions = false;
  selectedIndex = -1;

  private searchSubject = new Subject<string>();
  private destroy$ = new Subject<void>();

  constructor(private autosuggestService: AutosuggestService) {}

  ngOnInit(): void {
    // Configure service
    this.autosuggestService.configure({
      minLength: this.minLength,
      debounce: this.debounce,
      maxSuggestions: this.maxSuggestions,
      context: this.context,
      categories: this.categories
    });

    // Setup search stream
    this.searchSubject.pipe(
      debounceTime(this.debounce),
      distinctUntilChanged(),
      switchMap(query => {
        this.isLoading = true;
        return this.autosuggestService.getSuggestions(query);
      }),
      takeUntil(this.destroy$)
    ).subscribe(suggestions => {
      this.suggestions = suggestions;
      this.isLoading = false;
      this.showSuggestions = suggestions.length > 0;
      this.selectedIndex = -1;
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
    this.searchSubject.next(value);
  }

  onFocus(): void {
    if (this.suggestions.length > 0) {
      this.showSuggestions = true;
    }
  }

  onBlur(): void {
    // Delay to allow click on suggestion
    setTimeout(() => {
      this.showSuggestions = false;
    }, 200);
  }

  onKeyDown(event: KeyboardEvent): void {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectedIndex = Math.min(this.selectedIndex + 1, this.suggestions.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectedIndex = Math.max(this.selectedIndex - 1, -1);
        break;
      case 'Enter':
        event.preventDefault();
        if (this.selectedIndex >= 0) {
          this.selectSuggestion(this.suggestions[this.selectedIndex]);
        } else {
          this.search.emit(this.value);
          this.showSuggestions = false;
        }
        break;
      case 'Escape':
        this.showSuggestions = false;
        this.selectedIndex = -1;
        break;
    }
  }

  selectSuggestion(suggestion: Suggestion): void {
    this.value = suggestion.text;
    this.valueChange.emit(this.value);
    this.suggestionSelected.emit(suggestion);
    this.showSuggestions = false;
    this.selectedIndex = -1;
  }
}

