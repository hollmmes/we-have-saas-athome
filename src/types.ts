export interface ConvertedImage {
  id: string;
  original_name: string;
  converted_name: string;
  original_format: string;
  converted_format: string;
  file_size: number;
  output_path: string;
  created_at: string;
}

export interface ConvertedVideo {
  id: string;
  original_name: string;
  converted_name: string;
  file_size: number;
  output_path: string;
  duration: string;
  created_at: string;
}

export interface DomainInfo {
  id: string;
  domain: string;
  ssl_status: string;
  ssl_start: string;
  ssl_end: string;
  ssl_days: number;
  ssl_issuer: string;
  domain_status: string;
  domain_start: string;
  domain_end: string;
  domain_days: number;
  last_checked: string;
}

export type MediaRecord =
  | (ConvertedImage & { type: 'image' })
  | (ConvertedVideo & { type: 'video' });

export type PresetType = 'image' | 'video' | 'seo';

export interface ImagePreset {
  id: string;
  type: 'image';
  name: string;
  format: string;
  quality: number;
  suffix: string;
  keepOriginalName: boolean;
  watermarkEnabled?: boolean;
  watermarkText?: string;
  watermarkPosition?: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkOpacity?: number;
}

export interface VideoPreset {
  id: string;
  type: 'video';
  name: string;
  quality: string;
  mode: 'optimize';
  suffix: string;
  trimStart?: string;
  trimEnd?: string;
  normalizeAudio?: boolean;
}

export interface SeoPreset {
  id: string;
  type: 'seo';
  name: string;
  maxLength: number;
  titleTemplate: string;
  descriptionTemplate: string;
}

export type WorkflowPreset = ImagePreset | VideoPreset | SeoPreset;

export type JobStatus = 'queued' | 'running' | 'success' | 'error' | 'retrying';

export interface QueueJob {
  id: string;
  tool: string;
  action: string;
  title: string;
  status: JobStatus;
  createdAt: string;
  updatedAt: string;
  inputPaths: string[];
  outputPaths: string[];
  message: string;
  metrics?: Record<string, string>;
  retryKey?: string;
  retryPayload?: string;
  retries: number;
}

export type WatchFolderTool = 'image' | 'video' | 'hex';
export type WatchFolderBehavior = 'import' | 'process';

export interface WatchFolder {
  id: string;
  name: string;
  path: string;
  tool: WatchFolderTool;
  behavior: WatchFolderBehavior;
  presetId: string;
  enabled: boolean;
  intervalMs: number;
  processedPaths: string[];
  lastRunAt: string;
}

export interface SavedPalette {
  id: string;
  name: string;
  baseHex: string;
  colors: string[];
  note: string;
  createdAt: string;
}

export interface NotificationSettings {
  enabled: boolean;
  sslThresholdDays: number;
  domainThresholdDays: number;
  queueSuccess: boolean;
  queueFailure: boolean;
  watchFolderEvents: boolean;
}

export interface WorkflowProfile {
  id: string;
  name: string;
  imagePresetId: string;
  videoPresetId: string;
  seoPresetId: string;
  watermarkText: string;
  notes: string;
}
