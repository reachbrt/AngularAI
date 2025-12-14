/**
 * Trigger mode for the 360 viewer
 */
export type SpinTrigger = 'hover' | 'click' | 'auto' | 'drag';

/**
 * Display mode for the 360 viewer
 */
export type SpinMode = 'gif' | 'frames';

/**
 * Spin 360 configuration
 */
export interface Spin360Config {
  /** Array of image URLs for 360 view */
  images: string[];
  /** Static image to show initially (first frame if not set) */
  staticImage?: string;
  /** Display mode - gif or frames */
  mode?: SpinMode;
  /** Trigger mode for animation */
  trigger?: SpinTrigger;
  /** Auto-rotate */
  autoRotate?: boolean;
  /** Frame rate for animation (frames per second, default: 30) */
  frameRate?: number;
  /** Rotation speed (degrees per second) for auto-rotate */
  rotationSpeed?: number;
  /** Enable drag to rotate */
  draggable?: boolean;
  /** Drag sensitivity - pixels per frame (default: 10) */
  dragSensitivity?: number;
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
  /** Frame delay in ms for animation (alternative to frameRate) */
  frameDelay?: number;
  /** Loop animation */
  loop?: boolean;
  /** Reverse rotation direction */
  reverse?: boolean;
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
  mode: 'frames',
  trigger: 'drag',
  autoRotate: false,
  frameRate: 30,
  rotationSpeed: 30,
  draggable: true,
  dragSensitivity: 10,
  zoomable: true,
  maxZoom: 3,
  showControls: true,
  aiHotspots: false,
  initialFrame: 0,
  frameDelay: 100,
  loop: true,
  reverse: false
};

/**
 * AI Provider for image generation
 */
export type AIImageProvider = 'openai' | 'stability';

/**
 * Image quality setting
 */
export type ImageQuality = 'standard' | 'hd';

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
  /** Background color (default: white) */
  backgroundColor?: string;
  /** Image quality */
  quality?: ImageQuality;
  /** AI provider to use */
  provider?: AIImageProvider;
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

/**
 * Angle presets for different frame counts
 */
export const ANGLE_PRESETS = {
  4: [0, 90, 180, 270],
  8: [0, 45, 90, 135, 180, 225, 270, 315],
  12: [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330],
  24: Array.from({ length: 24 }, (_, i) => i * 15),
  36: Array.from({ length: 36 }, (_, i) => i * 10),
  72: Array.from({ length: 72 }, (_, i) => i * 5)
};

