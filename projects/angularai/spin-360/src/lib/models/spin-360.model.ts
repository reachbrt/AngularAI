/**
 * Spin 360 configuration
 */
export interface Spin360Config {
  /** Array of image URLs for 360 view */
  images: string[];
  /** Auto-rotate */
  autoRotate?: boolean;
  /** Rotation speed (degrees per second) */
  rotationSpeed?: number;
  /** Enable drag to rotate */
  draggable?: boolean;
  /** Enable zoom */
  zoomable?: boolean;
  /** Maximum zoom level */
  maxZoom?: number;
  /** Show navigation controls */
  showControls?: boolean;
  /** Enable AI hotspot detection */
  aiHotspots?: boolean;
  /** Initial frame index */
  initialFrame?: number;
}

/**
 * Hotspot on the 360 view
 */
export interface Hotspot {
  /** Unique ID */
  id: string;
  /** Frame index where hotspot appears */
  frameIndex: number;
  /** X position (percentage) */
  x: number;
  /** Y position (percentage) */
  y: number;
  /** Label */
  label: string;
  /** Description */
  description?: string;
  /** AI-generated */
  aiGenerated?: boolean;
}

/**
 * Default configuration
 */
export const DEFAULT_SPIN_CONFIG: Partial<Spin360Config> = {
  autoRotate: false,
  rotationSpeed: 30,
  draggable: true,
  zoomable: true,
  maxZoom: 3,
  showControls: true,
  aiHotspots: false,
  initialFrame: 0
};

/**
 * AI 360 Generation request
 */
export interface AI360GenerationRequest {
  /** Source image as base64 data URL */
  sourceImage: string;
  /** Number of angles to generate (default: 8) */
  numAngles?: number;
  /** Rotation angles in degrees (e.g., [0, 45, 90, 135, 180, 225, 270, 315]) */
  angles?: number[];
  /** Optional object description to help AI understand the subject */
  objectDescription?: string;
  /** Image size for generated images */
  imageSize?: '256x256' | '512x512' | '1024x1024';
}

/**
 * AI 360 Generation result
 */
export interface AI360GenerationResult {
  /** Generated images as URLs or base64 */
  images: string[];
  /** Angles corresponding to each image */
  angles: number[];
  /** Object detection info */
  objectInfo?: {
    name: string;
    center: { x: number; y: number };
    description: string;
  };
  /** Generation status */
  status: 'pending' | 'generating' | 'complete' | 'error';
  /** Progress percentage (0-100) */
  progress: number;
  /** Error message if failed */
  errorMessage?: string;
}

/**
 * Default angles for 360 generation (8 angles at 45° intervals)
 */
export const DEFAULT_360_ANGLES = [0, 45, 90, 135, 180, 225, 270, 315];

