/**
 * Supported OCR languages (Tesseract.js compatible)
 */
export const OCR_LANGUAGES: Record<string, string> = {
  'eng': 'English',
  'spa': 'Spanish',
  'fra': 'French',
  'deu': 'German',
  'ita': 'Italian',
  'por': 'Portuguese',
  'rus': 'Russian',
  'chi_sim': 'Chinese (Simplified)',
  'chi_tra': 'Chinese (Traditional)',
  'jpn': 'Japanese',
  'kor': 'Korean',
  'ara': 'Arabic',
  'hin': 'Hindi',
  'tha': 'Thai',
  'vie': 'Vietnamese',
  'nld': 'Dutch',
  'pol': 'Polish',
  'tur': 'Turkish',
  'ukr': 'Ukrainian',
  'heb': 'Hebrew'
};

/**
 * Document types for classification
 */
export type DocumentType =
  | 'invoice'
  | 'receipt'
  | 'contract'
  | 'resume'
  | 'letter'
  | 'form'
  | 'report'
  | 'id_card'
  | 'passport'
  | 'bank_statement'
  | 'tax_form'
  | 'medical_record'
  | 'unknown';

/**
 * OCR result from image processing
 */
export interface OCRResult {
  /** Extracted text */
  text: string;
  /** Confidence score (0-100) */
  confidence: number;
  /** Individual words with positions */
  words: OCRWord[];
  /** Lines of text */
  lines: OCRLine[];
  /** Blocks of text */
  blocks: OCRBlock[];
  /** Processing time in ms */
  processingTime: number;
  /** Language detected */
  language?: string;
}

/**
 * OCR word with bounding box
 */
export interface OCRWord {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  baseline?: { x0: number; y0: number; x1: number; y1: number };
}

/**
 * OCR line
 */
export interface OCRLine {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  words: OCRWord[];
}

/**
 * OCR block (paragraph)
 */
export interface OCRBlock {
  text: string;
  confidence: number;
  bbox: BoundingBox;
  lines: OCRLine[];
}

/**
 * Bounding box
 */
export interface BoundingBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
  width: number;
  height: number;
}

/**
 * Document extraction result
 */
export interface DocumentExtractionResult {
  /** Extracted text content */
  text: string;
  /** Structured data extracted */
  data: Record<string, any>;
  /** Document type detected */
  documentType?: DocumentType;
  /** Confidence score */
  confidence: number;
  /** Extracted fields */
  fields: ExtractedField[];
  /** Tables found in document */
  tables?: ExtractedTable[];
  /** Named entities extracted */
  entities?: ExtractedEntity[];
  /** OCR result if from image */
  ocrResult?: OCRResult;
  /** Source type */
  sourceType?: 'text' | 'image' | 'pdf';
  /** Page number (for multi-page docs) */
  pageNumber?: number;
  /** Total pages */
  totalPages?: number;
}

/**
 * Extracted entity (NER)
 */
export interface ExtractedEntity {
  text: string;
  type: EntityType;
  confidence: number;
  startIndex: number;
  endIndex: number;
}

/**
 * Entity types for NER
 */
export type EntityType =
  | 'person'
  | 'organization'
  | 'location'
  | 'date'
  | 'money'
  | 'email'
  | 'phone'
  | 'url'
  | 'address'
  | 'product'
  | 'quantity';

/**
 * Field types for extraction
 */
export type FieldType = 'text' | 'number' | 'date' | 'currency' | 'email' | 'phone' | 'url' | 'address' | 'name';

/**
 * Extracted field
 */
export interface ExtractedField {
  name: string;
  value: string;
  type: FieldType;
  confidence: number;
  boundingBox?: BoundingBox;
  /** Raw value before normalization */
  rawValue?: string;
  /** Validation status */
  validated?: boolean;
}

/**
 * Extracted table
 */
export interface ExtractedTable {
  headers: string[];
  rows: string[][];
  confidence: number;
  boundingBox?: BoundingBox;
  /** Number of rows */
  rowCount: number;
  /** Number of columns */
  colCount: number;
}

/**
 * OCR settings
 */
export interface OCRSettings {
  /** Enhance image contrast */
  enhanceContrast?: boolean;
  /** Deskew (straighten) image */
  deskew?: boolean;
  /** Denoise image */
  denoise?: boolean;
  /** Invert colors (for dark backgrounds) */
  invert?: boolean;
  /** Threshold for binarization */
  threshold?: number;
  /** PSM mode for Tesseract */
  psm?: number;
  /** OEM mode for Tesseract */
  oem?: number;
  /** Whitelist characters */
  whitelist?: string;
  /** Preserve interword spaces */
  preserveSpaces?: boolean;
}

/**
 * PDF processing options
 */
export interface PDFOptions {
  /** Pages to process (empty = all) */
  pages?: number[];
  /** DPI for rendering */
  dpi?: number;
  /** Password for encrypted PDFs */
  password?: string;
}

/**
 * Document intelligence configuration
 */
export interface DocIntelligenceConfig {
  /** Document types to detect */
  documentTypes?: DocumentType[];
  /** Fields to extract */
  extractFields?: string[];
  /** Extract tables */
  extractTables?: boolean;
  /** Extract named entities */
  extractEntities?: boolean;
  /** Language for OCR */
  language?: string;
  /** Additional languages for OCR */
  additionalLanguages?: string[];
  /** OCR settings */
  ocrSettings?: OCRSettings;
  /** PDF processing options */
  pdfOptions?: PDFOptions;
  /** Use AI for extraction */
  useAI?: boolean;
  /** AI model to use */
  aiModel?: string;
  /** Custom extraction prompt */
  extractionPrompt?: string;
  /** Confidence threshold */
  minConfidence?: number;
  /** Enable caching */
  enableCache?: boolean;
}

/**
 * Processing progress
 */
export interface ProcessingProgress {
  status: 'loading' | 'preprocessing' | 'recognizing' | 'extracting' | 'complete' | 'error';
  progress: number; // 0-100
  message?: string;
  currentPage?: number;
  totalPages?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_DOC_INTELLIGENCE_CONFIG: DocIntelligenceConfig = {
  extractTables: true,
  extractEntities: true,
  language: 'eng',
  useAI: true,
  minConfidence: 0.6,
  enableCache: true,
  ocrSettings: {
    enhanceContrast: true,
    deskew: true,
    denoise: true,
    preserveSpaces: true,
    psm: 3,  // Fully automatic page segmentation
    oem: 1   // LSTM only
  },
  pdfOptions: {
    dpi: 300
  }
};

