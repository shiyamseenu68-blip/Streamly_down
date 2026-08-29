export type Platform = "youtube" | "instagram";

export type ContentType = "video" | "short" | "reel" | "post";

export interface ValidationSuccessData {
  isValid: true;
  platform: Platform;
  contentId: string;
  contentType: ContentType;
  cleanUrl: string;
  message: string;
}

export interface ValidationErrorData {
  isValid: false;
  code: "EMPTY_URL" | "MALFORMED_URL" | "UNSUPPORTED_PLATFORM" | "INVALID_CONTENT_ID";
  message: string;
}

export type ValidationResult = ValidationSuccessData | ValidationErrorData;

export interface ValidateApiSuccessResponse {
  success: true;
  data: ValidationSuccessData;
}

export interface ValidateApiErrorResponse {
  success: false;
  error: ValidationErrorData;
}

export type ValidateApiResponse = ValidateApiSuccessResponse | ValidateApiErrorResponse;

export interface AudioFormat {
  quality: string;        // e.g. "128 kbps", "192 kbps", "320 kbps"
  formatId: string;       // raw extractor format ID
  filesize?: number;      // estimated size in bytes
  ext: string;            // e.g. "mp3", "m4a"
}

export interface VideoFormat {
  quality: string;        // e.g. "360p", "720p HD", "1080p Full HD", "4K 2160p"
  formatId: string;       // raw format ID (e.g. "137+140" or "22")
  ext: string;            // e.g. "mp4"
  hasAudio: boolean;      // true if combined stream
  requiresMerge: boolean; // true if audio stream must be merged with video stream
  filesize?: number;      // estimated size in bytes
  height?: number;        // e.g. 1080
  fps?: number;           // e.g. 60
}

export interface MediaMetadata {
  platform: Platform;
  id: string;
  url: string;
  title: string;
  thumbnail: string;
  duration: number;       // in seconds
  uploader?: string;
  formats: {
    audio: AudioFormat[];
    video: VideoFormat[];
  };
}
