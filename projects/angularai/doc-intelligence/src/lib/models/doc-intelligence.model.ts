/**
 * Document extraction result
 */
export interface DocumentExtractionResult {
  /** Extracted text content */
  text: string;
  /** Structured data extracted */
  data: Record<string, any>;
  /** Document type detected */
  documentType?: string;
  /** Confidence score */
  confidence: number;
  /** Extracted fields */
  fields: ExtractedField[];
  /** Tables found in document */
  tables?: ExtractedTable[];
}

/**
 * Extracted field
 */
export interface ExtractedField {
  name: string;
  value: string;
  type: 'text' | 'number' | 'date' | 'currency' | 'email' | 'phone';
  confidence: number;
  boundingBox?: { x: number; y: number; width: number; height: number };
}

/**
 * Extracted table
 */
export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
}

/**
 * Document intelligence configuration
 */
export interface DocIntelligenceConfig {
  /** Document types to detect */
  documentTypes?: string[];
  /** Fields to extract */
  extractFields?: string[];
  /** Extract tables */
  extractTables?: boolean;
  /** Language */
  language?: string;
  /** OCR settings */
  ocrSettings?: {
    enhanceContrast?: boolean;
    deskew?: boolean;
  };
}

/**
 * Default configuration
 */
export const DEFAULT_DOC_INTELLIGENCE_CONFIG: DocIntelligenceConfig = {
  extractTables: true,
  language: 'en',
  ocrSettings: {
    enhanceContrast: true,
    deskew: true
  }
};

