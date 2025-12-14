import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import { 
  DocumentExtractionResult, 
  DocIntelligenceConfig,
  DEFAULT_DOC_INTELLIGENCE_CONFIG 
} from '../models/doc-intelligence.model';

@Injectable({
  providedIn: 'root'
})
export class DocIntelligenceService {
  private config: DocIntelligenceConfig = DEFAULT_DOC_INTELLIGENCE_CONFIG;

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<DocIntelligenceConfig>): void {
    this.config = { ...DEFAULT_DOC_INTELLIGENCE_CONFIG, ...config };
  }

  /**
   * Extract data from document text
   */
  extractFromText(text: string): Observable<DocumentExtractionResult> {
    const prompt = this.buildExtractionPrompt(text);

    return this.aiClient.ask(prompt).pipe(
      map(response => this.parseExtractionResponse(response, text)),
      catchError(() => of(this.getEmptyResult(text)))
    );
  }

  /**
   * Classify document type
   */
  classifyDocument(text: string): Observable<string> {
    const prompt = `Classify this document type. Common types: invoice, receipt, contract, resume, letter, form, report.

Document text: "${text.substring(0, 1000)}"

Respond with just the document type.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => response.trim().toLowerCase()),
      catchError(() => of('unknown'))
    );
  }

  private buildExtractionPrompt(text: string): string {
    let prompt = `Extract structured data from this document:

"${text.substring(0, 2000)}"

`;

    if (this.config.extractFields?.length) {
      prompt += `Focus on these fields: ${this.config.extractFields.join(', ')}\n`;
    }

    prompt += `
Respond with JSON:
{
  "documentType": "type",
  "fields": [{"name": "field", "value": "value", "type": "text|number|date|currency|email|phone", "confidence": 0.9}],
  "tables": [{"headers": ["col1"], "rows": [["val1"]], "confidence": 0.9}]
}`;

    return prompt;
  }

  private parseExtractionResponse(response: string, originalText: string): DocumentExtractionResult {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        return {
          text: originalText,
          data: this.fieldsToData(parsed.fields || []),
          documentType: parsed.documentType,
          confidence: 0.8,
          fields: parsed.fields || [],
          tables: this.config.extractTables ? parsed.tables : undefined
        };
      }
    } catch {}
    return this.getEmptyResult(originalText);
  }

  private fieldsToData(fields: any[]): Record<string, any> {
    const data: Record<string, any> = {};
    for (const field of fields) {
      data[field.name] = field.value;
    }
    return data;
  }

  private getEmptyResult(text: string): DocumentExtractionResult {
    return {
      text,
      data: {},
      confidence: 0,
      fields: []
    };
  }
}

