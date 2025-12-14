/**
 * Image caption result
 */
export interface CaptionResult {
  /** Generated caption */
  caption: string;
  /** Confidence score (0-1) */
  confidence: number;
  /** Alternative captions */
  alternatives?: string[];
  /** Detected objects/elements */
  detectedElements?: string[];
  /** Image dimensions */
  dimensions?: { width: number; height: number };
}

/**
 * Image caption configuration
 */
export interface ImageCaptionConfig {
  /** Maximum caption length */
  maxLength?: number;
  /** Caption style */
  style?: 'descriptive' | 'concise' | 'detailed' | 'alt-text';
  /** Language for caption */
  language?: string;
  /** Include detected elements */
  includeElements?: boolean;
  /** Number of alternative captions */
  alternativeCount?: number;
}

/**
 * Default configuration
 */
export const DEFAULT_IMAGE_CAPTION_CONFIG: ImageCaptionConfig = {
  maxLength: 200,
  style: 'descriptive',
  language: 'en',
  includeElements: true,
  alternativeCount: 2
};

