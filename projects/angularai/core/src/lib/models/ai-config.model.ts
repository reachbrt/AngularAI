/**
 * Supported AI providers
 */
export type AIProvider = 'openai' | 'claude' | 'gemini' | 'huggingface' | 'ollama' | 'deepseek' | 'fallback';

/**
 * Configuration for the AI client
 */
export interface AIConfig {
  /** AI provider to use */
  provider: AIProvider;
  /** API key for the provider */
  apiKey?: string;
  /** Model to use (e.g., 'gpt-4o', 'claude-3-opus') */
  model?: string;
  /** Base URL for the API (useful for proxies or local deployments) */
  baseUrl?: string;
  /** Maximum tokens in the response */
  maxTokens?: number;
  /** Temperature for response randomness (0-2) */
  temperature?: number;
  /** Request timeout in milliseconds */
  timeout?: number;
}

/**
 * API key configuration for multiple providers
 */
export interface APIKeyConfig {
  openai?: string;
  claude?: string;
  gemini?: string;
  huggingface?: string;
  deepseek?: string;
}

/**
 * Error thrown when API key is not configured
 */
export class APIKeyNotConfiguredError extends Error {
  constructor(provider: AIProvider) {
    super(`API key not configured for ${provider}. Please configure your API key before using AI features.`);
    this.name = 'APIKeyNotConfiguredError';
  }
}

/**
 * Check if a provider requires an API key
 */
export function requiresAPIKey(provider: AIProvider): boolean {
  return provider !== 'fallback' && provider !== 'ollama';
}

/**
 * Check if an API key is valid (basic validation)
 */
export function isValidAPIKey(apiKey: string | undefined): boolean {
  return !!apiKey && apiKey.trim().length > 10;
}

/**
 * Chat message structure
 */
export interface ChatMessage {
  /** Role of the message sender */
  role: 'system' | 'user' | 'assistant';
  /** Message content */
  content: string;
  /** Optional name for the sender */
  name?: string;
}

/**
 * Chat completion response
 */
export interface ChatResponse {
  /** The generated message */
  message: string;
  /** Token usage information */
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  /** Model used for generation */
  model?: string;
  /** Finish reason */
  finishReason?: 'stop' | 'length' | 'content_filter' | 'tool_calls';
}

/**
 * Streaming callbacks for chat responses
 */
export interface StreamCallbacks {
  /** Called for each token received */
  onToken: (token: string) => void;
  /** Called when streaming is complete */
  onComplete?: (fullText: string) => void;
  /** Called on error */
  onError?: (error: Error) => void;
}

/**
 * Default models for each provider
 */
export const DEFAULT_MODELS: Record<AIProvider, string> = {
  openai: 'gpt-4o',
  claude: 'claude-3-5-sonnet-20241022',
  gemini: 'gemini-pro',
  huggingface: 'mistralai/Mixtral-8x7B-Instruct-v0.1',
  ollama: 'llama2',
  deepseek: 'deepseek-chat',
  fallback: 'mock'
};

/**
 * API endpoints for each provider
 */
export const PROVIDER_ENDPOINTS: Record<AIProvider, string> = {
  openai: 'https://api.openai.com/v1/chat/completions',
  claude: 'https://api.anthropic.com/v1/messages',
  gemini: 'https://generativelanguage.googleapis.com/v1beta/models',
  huggingface: 'https://api-inference.huggingface.co/models',
  ollama: 'http://localhost:11434/api/chat',
  deepseek: 'https://api.deepseek.com/v1/chat/completions',
  fallback: ''
};

/**
 * Image generation request
 */
export interface ImageGenerationRequest {
  /** The prompt describing the image to generate */
  prompt: string;
  /** Number of images to generate */
  n?: number;
  /** Image size */
  size?: '256x256' | '512x512' | '1024x1024' | '1792x1024' | '1024x1792';
  /** Image quality (only for DALL-E 3) */
  quality?: 'standard' | 'hd';
  /** Response format */
  responseFormat?: 'url' | 'b64_json';
  /** Style (only for DALL-E 3) */
  style?: 'vivid' | 'natural';
}

/**
 * Image generation response
 */
export interface ImageGenerationResponse {
  /** Generated image URLs or base64 data */
  images: string[];
  /** Revised prompts (for DALL-E 3) */
  revisedPrompts?: string[];
}

/**
 * Image edit/variation request (for view synthesis)
 */
export interface ImageEditRequest {
  /** Source image as base64 or URL */
  image: string;
  /** Edit instruction prompt */
  prompt: string;
  /** Number of variations to generate */
  n?: number;
  /** Image size */
  size?: '256x256' | '512x512' | '1024x1024';
  /** Response format */
  responseFormat?: 'url' | 'b64_json';
}

