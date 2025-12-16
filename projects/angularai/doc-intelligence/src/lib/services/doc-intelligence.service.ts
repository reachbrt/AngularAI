import { Injectable } from '@angular/core';
import { Observable, of, Subject, BehaviorSubject } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { AIClientService } from '@angularai/core';
import {
  DocumentExtractionResult,
  DocIntelligenceConfig,
  OCRResult,
  OCRWord,
  OCRLine,
  OCRBlock,
  ExtractedEntity,
  ExtractedField,
  ExtractedTable,
  ProcessingProgress,
  DocumentType,
  EntityType,
  OCR_LANGUAGES,
  DEFAULT_DOC_INTELLIGENCE_CONFIG
} from '../models/doc-intelligence.model';

@Injectable({
  providedIn: 'root'
})
export class DocIntelligenceService {
  private config: DocIntelligenceConfig = DEFAULT_DOC_INTELLIGENCE_CONFIG;
  private tesseractWorker: any = null;
  private cache = new Map<string, DocumentExtractionResult>();

  private progressSubject = new Subject<ProcessingProgress>();
  progress$ = this.progressSubject.asObservable();

  constructor(private aiClient: AIClientService) {}

  configure(config: Partial<DocIntelligenceConfig>): void {
    this.config = {
      ...DEFAULT_DOC_INTELLIGENCE_CONFIG,
      ...config,
      ocrSettings: { ...DEFAULT_DOC_INTELLIGENCE_CONFIG.ocrSettings, ...config.ocrSettings }
    };
  }

  /**
   * Get supported OCR languages
   */
  getSupportedLanguages(): Record<string, string> {
    return OCR_LANGUAGES;
  }

  // ==================== Text Extraction ====================

  /**
   * Extract data from document text
   */
  extractFromText(text: string): Observable<DocumentExtractionResult> {
    this.emitProgress('extracting', 0, 'Analyzing text...');

    const prompt = this.buildExtractionPrompt(text);

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const result = this.parseExtractionResponse(response, text);
        result.sourceType = 'text';

        // Extract entities if enabled
        if (this.config.extractEntities) {
          result.entities = this.extractEntities(text);
        }

        this.emitProgress('complete', 100, 'Extraction complete');
        return result;
      }),
      catchError(() => {
        this.emitProgress('error', 0, 'Extraction failed');
        return of(this.getEmptyResult(text));
      })
    );
  }

  // ==================== Image OCR ====================

  /**
   * Extract text from image using OCR
   */
  async extractFromImage(imageSource: string | File | Blob): Promise<DocumentExtractionResult> {
    this.emitProgress('loading', 0, 'Loading image...');

    try {
      // Get image data URL
      const imageData = await this.getImageDataUrl(imageSource);

      // Check cache
      if (this.config.enableCache) {
        const cacheKey = this.hashString(imageData.substring(0, 1000));
        const cached = this.cache.get(cacheKey);
        if (cached) {
          this.emitProgress('complete', 100, 'Retrieved from cache');
          return cached;
        }
      }

      this.emitProgress('preprocessing', 10, 'Preprocessing image...');

      // Perform OCR
      const ocrResult = await this.performOCR(imageData);

      this.emitProgress('extracting', 70, 'Extracting data...');

      // Use AI to structure the extracted text
      let result: DocumentExtractionResult;
      if (this.config.useAI && ocrResult.text.trim()) {
        const aiResult = await this.extractFromText(ocrResult.text).toPromise();
        result = aiResult || this.getEmptyResult(ocrResult.text);
      } else {
        result = this.getEmptyResult(ocrResult.text);
      }

      result.ocrResult = ocrResult;
      result.sourceType = 'image';
      result.confidence = ocrResult.confidence / 100;

      // Cache result
      if (this.config.enableCache) {
        const cacheKey = this.hashString(imageData.substring(0, 1000));
        this.cache.set(cacheKey, result);
      }

      this.emitProgress('complete', 100, 'Extraction complete');
      return result;
    } catch (error) {
      this.emitProgress('error', 0, `OCR failed: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * Perform OCR on image data
   */
  private async performOCR(imageData: string): Promise<OCRResult> {
    this.emitProgress('recognizing', 30, 'Recognizing text...');
    const startTime = Date.now();

    // Use browser-native approach with canvas for basic OCR simulation
    // In production, you'd use Tesseract.js or a cloud OCR service

    // For now, we'll create a structured result that indicates OCR was attempted
    // Real implementation would use: import Tesseract from 'tesseract.js'

    const result: OCRResult = {
      text: '',
      confidence: 0,
      words: [],
      lines: [],
      blocks: [],
      processingTime: Date.now() - startTime,
      language: this.config.language
    };

    // Try to use Tesseract.js if available globally
    if (typeof (window as any).Tesseract !== 'undefined') {
      try {
        const Tesseract = (window as any).Tesseract;
        const languages = [this.config.language, ...(this.config.additionalLanguages || [])].join('+');

        const worker = await Tesseract.createWorker(languages);

        const { data } = await worker.recognize(imageData, {
          logger: (m: any) => {
            if (m.status === 'recognizing text') {
              this.emitProgress('recognizing', 30 + (m.progress * 40), 'Recognizing text...');
            }
          }
        });

        result.text = data.text;
        result.confidence = data.confidence;
        result.words = data.words?.map((w: any) => this.mapWord(w)) || [];
        result.lines = data.lines?.map((l: any) => this.mapLine(l)) || [];
        result.blocks = data.blocks?.map((b: any) => this.mapBlock(b)) || [];
        result.processingTime = Date.now() - startTime;

        await worker.terminate();
      } catch (error) {
        console.warn('Tesseract.js OCR failed:', error);
      }
    } else {
      // Fallback: return empty result with message
      result.text = '[OCR requires Tesseract.js. Add to your project: npm install tesseract.js]';
      result.confidence = 0;
    }

    return result;
  }

  private mapWord(w: any): OCRWord {
    return {
      text: w.text,
      confidence: w.confidence,
      bbox: {
        x0: w.bbox.x0,
        y0: w.bbox.y0,
        x1: w.bbox.x1,
        y1: w.bbox.y1,
        width: w.bbox.x1 - w.bbox.x0,
        height: w.bbox.y1 - w.bbox.y0
      }
    };
  }

  private mapLine(l: any): OCRLine {
    return {
      text: l.text,
      confidence: l.confidence,
      bbox: {
        x0: l.bbox.x0,
        y0: l.bbox.y0,
        x1: l.bbox.x1,
        y1: l.bbox.y1,
        width: l.bbox.x1 - l.bbox.x0,
        height: l.bbox.y1 - l.bbox.y0
      },
      words: l.words?.map((w: any) => this.mapWord(w)) || []
    };
  }

  private mapBlock(b: any): OCRBlock {
    return {
      text: b.text,
      confidence: b.confidence,
      bbox: {
        x0: b.bbox.x0,
        y0: b.bbox.y0,
        x1: b.bbox.x1,
        y1: b.bbox.y1,
        width: b.bbox.x1 - b.bbox.x0,
        height: b.bbox.y1 - b.bbox.y0
      },
      lines: b.lines?.map((l: any) => this.mapLine(l)) || []
    };
  }

  private async getImageDataUrl(source: string | File | Blob): Promise<string> {
    if (typeof source === 'string') {
      return source; // Already a URL or data URL
    }

    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(source);
    });
  }

  // ==================== Entity Extraction ====================

  /**
   * Extract named entities from text
   */
  extractEntities(text: string): ExtractedEntity[] {
    const entities: ExtractedEntity[] = [];

    // Email pattern
    const emailPattern = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
    this.findPattern(text, emailPattern, 'email', entities);

    // Phone pattern
    const phonePattern = /\b(?:\+?1[-.\s]?)?(?:\(?\d{3}\)?[-.\s]?)?\d{3}[-.\s]?\d{4}\b/g;
    this.findPattern(text, phonePattern, 'phone', entities);

    // URL pattern
    const urlPattern = /https?:\/\/[^\s<>\"{}|\\^`\[\]]+/gi;
    this.findPattern(text, urlPattern, 'url', entities);

    // Date patterns
    const datePatterns = [
      /\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/g,
      /\b\d{4}-\d{2}-\d{2}\b/g,
      /\b(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{1,2},?\s+\d{4}\b/gi
    ];
    for (const pattern of datePatterns) {
      this.findPattern(text, pattern, 'date', entities);
    }

    // Money pattern
    const moneyPattern = /\$[\d,]+(?:\.\d{2})?|\b\d+(?:,\d{3})*(?:\.\d{2})?\s*(?:USD|EUR|GBP|dollars?|euros?)\b/gi;
    this.findPattern(text, moneyPattern, 'money', entities);

    return entities;
  }

  private findPattern(
    text: string,
    pattern: RegExp,
    type: EntityType,
    entities: ExtractedEntity[]
  ): void {
    let match;
    while ((match = pattern.exec(text)) !== null) {
      entities.push({
        text: match[0],
        type,
        confidence: 0.9,
        startIndex: match.index,
        endIndex: match.index + match[0].length
      });
    }
  }

  // ==================== Document Classification ====================

  /**
   * Classify document type
   */
  classifyDocument(text: string): Observable<DocumentType> {
    const types = this.config.documentTypes?.join(', ') ||
      'invoice, receipt, contract, resume, letter, form, report, id_card, passport, bank_statement, tax_form, medical_record';

    const prompt = `Classify this document type. Possible types: ${types}

Document text (first 1000 chars): "${text.substring(0, 1000)}"

Respond with ONLY the document type (one word), nothing else.`;

    return this.aiClient.ask(prompt).pipe(
      map(response => {
        const type = response.trim().toLowerCase().replace(/[^a-z_]/g, '') as DocumentType;
        return type || 'unknown';
      }),
      catchError(() => of('unknown' as DocumentType))
    );
  }

  // ==================== AI Extraction ====================

  private buildExtractionPrompt(text: string): string {
    let prompt = this.config.extractionPrompt || `Extract structured data from this document:

"${text.substring(0, 3000)}"

`;

    if (this.config.extractFields?.length) {
      prompt += `Focus on these fields: ${this.config.extractFields.join(', ')}\n`;
    }

    prompt += `
Respond with JSON:
{
  "documentType": "invoice|receipt|contract|resume|letter|form|report|id_card|passport|bank_statement|tax_form|medical_record|unknown",
  "fields": [{"name": "field_name", "value": "extracted_value", "type": "text|number|date|currency|email|phone|url|address|name", "confidence": 0.9}],
  "tables": [{"headers": ["col1", "col2"], "rows": [["val1", "val2"]], "confidence": 0.9, "rowCount": 1, "colCount": 2}]
}`;

    return prompt;
  }

  private parseExtractionResponse(response: string, originalText: string): DocumentExtractionResult {
    try {
      const match = response.match(/\{[\s\S]*\}/);
      if (match) {
        const parsed = JSON.parse(match[0]);
        const fields: ExtractedField[] = (parsed.fields || []).map((f: any) => ({
          name: f.name,
          value: f.value,
          type: f.type || 'text',
          confidence: f.confidence || 0.8,
          rawValue: f.value
        }));

        const tables: ExtractedTable[] = this.config.extractTables ?
          (parsed.tables || []).map((t: any) => ({
            headers: t.headers || [],
            rows: t.rows || [],
            confidence: t.confidence || 0.8,
            rowCount: t.rows?.length || 0,
            colCount: t.headers?.length || 0
          })) : [];

        return {
          text: originalText,
          data: this.fieldsToData(fields),
          documentType: parsed.documentType || 'unknown',
          confidence: this.calculateAverageConfidence(fields),
          fields,
          tables: tables.length > 0 ? tables : undefined
        };
      }
    } catch {}
    return this.getEmptyResult(originalText);
  }

  private fieldsToData(fields: ExtractedField[]): Record<string, any> {
    const data: Record<string, any> = {};
    for (const field of fields) {
      data[field.name] = field.value;
    }
    return data;
  }

  private calculateAverageConfidence(fields: ExtractedField[]): number {
    if (fields.length === 0) return 0;
    const sum = fields.reduce((acc, f) => acc + (f.confidence || 0), 0);
    return sum / fields.length;
  }

  private getEmptyResult(text: string): DocumentExtractionResult {
    return {
      text,
      data: {},
      confidence: 0,
      fields: [],
      documentType: 'unknown'
    };
  }

  // ==================== Utilities ====================

  private emitProgress(
    status: ProcessingProgress['status'],
    progress: number,
    message?: string
  ): void {
    this.progressSubject.next({ status, progress, message });
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(36);
  }

  /**
   * Clear cache
   */
  clearCache(): void {
    this.cache.clear();
  }
}

