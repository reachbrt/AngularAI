/**
 * Caption style options
 */
export type CaptionStyle = 'descriptive' | 'concise' | 'detailed' | 'alt-text' | 'social' | 'seo' | 'poetic';

/**
 * Supported languages for captions
 */
export const CAPTION_LANGUAGES: Record<string, string> = {
  'en': 'English',
  'es': 'Spanish',
  'fr': 'French',
  'de': 'German',
  'it': 'Italian',
  'pt': 'Portuguese',
  'zh': 'Chinese',
  'ja': 'Japanese',
  'ko': 'Korean',
  'ar': 'Arabic',
  'hi': 'Hindi',
  'ru': 'Russian'
};

/**
 * Image caption result
 */
export interface CaptionResult {
  /** Unique ID */
  id: string;
  /** Generated caption */
  caption: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative captions */
  alternatives?: string[];
  /** Detected objects/elements */
  detectedElements?: DetectedElement[];
  /** Image dimensions */
  dimensions?: { width: number; height: number };
  /** Image source (URL or data URL) */
  imageSource?: string;
  /** Timestamp */
  timestamp: Date;
  /** Processing time in ms */
  processingTime?: number;
  /** Style used */
  style?: CaptionStyle;
  /** Language used */
  language?: string;
  /** Tags extracted */
  tags?: string[];
  /** Dominant colors */
  colors?: string[];
  /** Scene type */
  sceneType?: string;
  /** Mood/atmosphere */
  mood?: string;
}

/**
 * Detected element in image
 */
export interface DetectedElement {
  name: string;
  confidence: number;
  boundingBox?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  category?: string;
}

/**
 * Batch processing item
 */
export interface BatchItem {
  id: string;
  source: string | File | Blob;
  status: 'pending' | 'processing' | 'complete' | 'error';
  result?: CaptionResult;
  error?: string;
  progress?: number;
}

/**
 * Batch processing result
 */
export interface BatchResult {
  items: BatchItem[];
  totalCount: number;
  successCount: number;
  errorCount: number;
  processingTime: number;
}

/**
 * History entry
 */
export interface CaptionHistoryEntry {
  id: string;
  result: CaptionResult;
  timestamp: Date;
  imagePreview?: string; // Thumbnail data URL
  favorite?: boolean;
  tags?: string[];
}

/**
 * Export format
 */
export type ExportFormat = 'json' | 'csv' | 'txt' | 'html';

/**
 * Export options
 */
export interface ExportOptions {
  format: ExportFormat;
  includeImages?: boolean;
  includeAlternatives?: boolean;
  includeElements?: boolean;
  includeTags?: boolean;
  filename?: string;
}

/**
 * Image caption configuration
 */
export interface ImageCaptionConfig {
  /** Maximum caption length */
  maxLength?: number;
  /** Caption style */
  style?: CaptionStyle;
  /** Language for caption */
  language?: string;
  /** Include detected elements */
  includeElements?: boolean;
  /** Number of alternative captions */
  alternativeCount?: number;
  /** Extract tags */
  extractTags?: boolean;
  /** Detect colors */
  detectColors?: boolean;
  /** Detect scene type */
  detectScene?: boolean;
  /** Detect mood */
  detectMood?: boolean;
  /** Enable history */
  enableHistory?: boolean;
  /** Max history entries */
  maxHistoryEntries?: number;
  /** Storage key for history */
  historyStorageKey?: string;
  /** Batch concurrency */
  batchConcurrency?: number;
  /** Generate thumbnails for history */
  generateThumbnails?: boolean;
  /** Thumbnail size */
  thumbnailSize?: number;
}

/**
 * Processing progress
 */
export interface CaptionProgress {
  status: 'idle' | 'loading' | 'analyzing' | 'generating' | 'complete' | 'error';
  progress: number;
  message?: string;
  currentItem?: number;
  totalItems?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_IMAGE_CAPTION_CONFIG: ImageCaptionConfig = {
  maxLength: 200,
  style: 'descriptive',
  language: 'en',
  includeElements: true,
  alternativeCount: 2,
  extractTags: true,
  detectColors: false,
  detectScene: true,
  detectMood: false,
  enableHistory: true,
  maxHistoryEntries: 100,
  historyStorageKey: 'image_caption_history',
  batchConcurrency: 3,
  generateThumbnails: true,
  thumbnailSize: 100
};

