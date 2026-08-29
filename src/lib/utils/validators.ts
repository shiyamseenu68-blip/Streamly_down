import { ValidationResult, Platform } from "../types/media";

/**
 * Checks if an IP or hostname is private/internal (SSRF Prevention)
 */
function isInternalHost(hostname: string): boolean {
  const host = hostname.toLowerCase().trim();
  if (
    host === "localhost" ||
    host === "127.0.0.1" ||
    host === "0.0.0.0" ||
    host === "::1" ||
    host.endsWith(".local") ||
    host.endsWith(".internal")
  ) {
    return true;
  }

  // IPv4 private ranges (10.x.x.x, 172.16.x.x - 172.31.x.x, 192.168.x.x, 169.254.x.x)
  const ipMatch = host.match(/^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/);
  if (ipMatch) {
    const [, a, b] = ipMatch.map(Number);
    if (a === 10) return true;
    if (a === 172 && b >= 16 && b <= 31) return true;
    if (a === 192 && b === 168) return true;
    if (a === 169 && b === 254) return true;
    if (a === 127) return true;
  }

  return false;
}

/**
 * Validates whether a string is a syntactically valid external HTTP/HTTPS URL
 */
export function isValidExternalHttpUrl(urlString: string): boolean {
  if (!urlString || typeof urlString !== "string") return false;
  const trimmed = urlString.trim();

  // Max URL length constraint (500 chars)
  if (trimmed.length === 0 || trimmed.length > 500) return false;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return false;
    }

    if (isInternalHost(parsed.hostname)) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Parses and validates YouTube URLs
 */
export function parseYouTubeUrl(url: string): { contentId: string; contentType: "video" | "short"; cleanUrl: string } | null {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();

    const isYtDomain =
      hostname === "youtube.com" ||
      hostname === "www.youtube.com" ||
      hostname === "m.youtube.com" ||
      hostname === "music.youtube.com";

    const isYotuBeDomain = hostname === "youtu.be";

    if (!isYtDomain && !isYotuBeDomain) return null;

    // Case 1: Shortened URL (youtu.be/ID)
    if (isYotuBeDomain) {
      const id = parsed.pathname.slice(1).split("/")[0].split("?")[0];
      if (id && id.length >= 10 && id.length <= 20) {
        return {
          contentId: id,
          contentType: "video",
          cleanUrl: `https://youtu.be/${id}`,
        };
      }
      return null;
    }

    // Case 2: Shorts URL (/shorts/ID)
    if (parsed.pathname.startsWith("/shorts/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1];
      if (id && id.length >= 10 && id.length <= 20) {
        return {
          contentId: id,
          contentType: "short",
          cleanUrl: `https://www.youtube.com/shorts/${id}`,
        };
      }
      return null;
    }

    // Case 3: Embed URL (/embed/ID)
    if (parsed.pathname.startsWith("/embed/")) {
      const parts = parsed.pathname.split("/").filter(Boolean);
      const id = parts[1];
      if (id && id.length >= 10 && id.length <= 20) {
        return {
          contentId: id,
          contentType: "video",
          cleanUrl: `https://www.youtube.com/watch?v=${id}`,
        };
      }
      return null;
    }

    // Case 4: Standard Watch URL (/watch?v=ID)
    const vParam = parsed.searchParams.get("v");
    if (vParam && vParam.length >= 10 && vParam.length <= 20) {
      return {
        contentId: vParam,
        contentType: "video",
        cleanUrl: `https://www.youtube.com/watch?v=${vParam}`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Parses and validates Instagram URLs
 */
export function parseInstagramUrl(url: string): { contentId: string; contentType: "reel" | "post"; cleanUrl: string } | null {
  try {
    const parsed = new URL(url.trim());
    const hostname = parsed.hostname.toLowerCase();

    const isIgDomain =
      hostname === "instagram.com" ||
      hostname === "www.instagram.com" ||
      hostname === "m.instagram.com";

    if (!isIgDomain) return null;

    const pathSegments = parsed.pathname.split("/").filter(Boolean);
    if (pathSegments.length < 2) return null;

    const typeSegment = pathSegments[0].toLowerCase();
    const id = pathSegments[1];

    if (!id || id.length < 3 || id.length > 45) return null;

    if (typeSegment === "reel" || typeSegment === "reels") {
      return {
        contentId: id,
        contentType: "reel",
        cleanUrl: `https://www.instagram.com/reel/${id}/`,
      };
    }

    if (typeSegment === "p" || typeSegment === "tv") {
      return {
        contentId: id,
        contentType: "post",
        cleanUrl: `https://www.instagram.com/p/${id}/`,
      };
    }

    return null;
  } catch {
    return null;
  }
}

/**
 * Main URL Validation & Platform Detection Entrypoint with SSRF Protection & Length Bounds
 */
export function validateMediaUrl(inputUrl: string): ValidationResult {
  if (!inputUrl || typeof inputUrl !== "string") {
    return {
      isValid: false,
      code: "EMPTY_URL",
      message: "Please enter a YouTube or Instagram link.",
    };
  }

  const trimmed = inputUrl.trim();
  if (!trimmed) {
    return {
      isValid: false,
      code: "EMPTY_URL",
      message: "Please enter a YouTube or Instagram link.",
    };
  }

  if (trimmed.length > 500) {
    return {
      isValid: false,
      code: "MALFORMED_URL",
      message: "URL exceeds maximum allowed length limit (500 characters).",
    };
  }

  if (!isValidExternalHttpUrl(trimmed)) {
    return {
      isValid: false,
      code: "MALFORMED_URL",
      message: "Please enter a valid external HTTP or HTTPS web address.",
    };
  }

  // 1. Try YouTube parser
  const ytParsed = parseYouTubeUrl(trimmed);
  if (ytParsed) {
    const typeLabel = ytParsed.contentType === "short" ? "Short" : "Video";
    return {
      isValid: true,
      platform: "youtube",
      contentId: ytParsed.contentId,
      contentType: ytParsed.contentType,
      cleanUrl: ytParsed.cleanUrl,
      message: `Valid YouTube ${typeLabel} link detected.`,
    };
  }

  // 2. Try Instagram parser
  const igParsed = parseInstagramUrl(trimmed);
  if (igParsed) {
    const typeLabel = igParsed.contentType === "reel" ? "Reel" : "Post";
    return {
      isValid: true,
      platform: "instagram",
      contentId: igParsed.contentId,
      contentType: igParsed.contentType,
      cleanUrl: igParsed.cleanUrl,
      message: `Valid Instagram ${typeLabel} link detected.`,
    };
  }

  // 3. Domain check for unsupported platform
  try {
    const parsed = new URL(trimmed);
    const hostname = parsed.hostname.toLowerCase();

    if (
      hostname.includes("youtube.com") ||
      hostname.includes("youtu.be") ||
      hostname.includes("instagram.com")
    ) {
      return {
        isValid: false,
        code: "INVALID_CONTENT_ID",
        message: "Link recognized but video or content ID could not be found.",
      };
    }
  } catch {
    // ignore
  }

  return {
    isValid: false,
    code: "UNSUPPORTED_PLATFORM",
    message: "Currently only public YouTube and Instagram links are supported.",
  };
}

/**
 * Validates requested download type and quality parameters against allowed whitelist
 */
export function validateDownloadParams(
  type: string,
  quality: string
): { isValid: true } | { isValid: false; message: string } {
  const allowedTypes = ["mp3", "mp4"];
  const allowedQualities = [
    "128kbps",
    "192kbps",
    "256kbps",
    "320kbps",
    "240p",
    "360p",
    "480p",
    "720phd",
    "1080pfullhd",
    "1440p2k",
    "2160p4k",
  ];

  const cleanType = type.toLowerCase().trim();
  const cleanQuality = quality.replace(/\s+/g, "").toLowerCase().trim();

  if (!allowedTypes.includes(cleanType)) {
    return { isValid: false, message: "Invalid download type parameter. Allowed: mp3, mp4." };
  }

  if (!allowedQualities.includes(cleanQuality) && !cleanQuality.match(/^\d+p$/)) {
    return { isValid: false, message: "Invalid quality parameter requested." };
  }

  return { isValid: true };
}
