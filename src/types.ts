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
