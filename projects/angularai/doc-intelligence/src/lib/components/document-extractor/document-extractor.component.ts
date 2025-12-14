import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DocIntelligenceService } from '../../services/doc-intelligence.service';
import { DocumentExtractionResult, DocIntelligenceConfig } from '../../models/doc-intelligence.model';

@Component({
  selector: 'ai-document-extractor',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './document-extractor.component.html',
  styleUrl: './document-extractor.component.scss'
})
export class DocumentExtractorComponent {
  @Input() config: DocIntelligenceConfig = {};
  @Output() extracted = new EventEmitter<DocumentExtractionResult>();
  @Output() error = new EventEmitter<Error>();

  result: DocumentExtractionResult | null = null;
  isProcessing = false;
  documentText = '';

  constructor(private docService: DocIntelligenceService) {}

  ngOnInit(): void {
    this.docService.configure(this.config);
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.processFile(input.files[0]);
    }
  }

  processFile(file: File): void {
    this.isProcessing = true;
    this.result = null;

    const reader = new FileReader();
    reader.onload = () => {
      this.documentText = reader.result as string;
      this.extractData();
    };
    reader.onerror = () => {
      this.isProcessing = false;
      this.error.emit(new Error('Failed to read file'));
    };
    reader.readAsText(file);
  }

  extractData(): void {
    if (!this.documentText) return;

    this.docService.extractFromText(this.documentText).subscribe({
      next: (result) => {
        this.result = result;
        this.isProcessing = false;
        this.extracted.emit(result);
      },
      error: (err) => {
        this.isProcessing = false;
        this.error.emit(err);
      }
    });
  }

  onTextInput(event: Event): void {
    this.documentText = (event.target as HTMLTextAreaElement).value;
  }

  processText(): void {
    if (this.documentText.trim()) {
      this.isProcessing = true;
      this.result = null;
      this.extractData();
    }
  }
}

