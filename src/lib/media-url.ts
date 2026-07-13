/**
 * Google Drive share links point at an HTML viewer page, not the image bytes,
 * so an `<img>` (and our ad preview) can't render them. These helpers extract
 * the file id from any recognized Drive URL and rewrite it to the `thumbnail`
 * endpoint, which serves the raw image directly.
 *
 * Note: this is a convenience for admins pasting Drive links. Drive is NOT a
 * reliable production host for cabinet ads (hotlink throttling + the cabinet's
 * old WebView failing TLS to modern Google certs) — prefer an owned host/CDN.
 */

const DEFAULT_DRIVE_WIDTH = 1600;

/** Extract the Drive file id from `/file/d/<id>/…`, `…/d/<id>`, or `?id=<id>`. */
export function extractDriveFileId(url: string): string | null {
  const value = url.trim();
  const byPath = value.match(/\/(?:file\/d|d)\/([A-Za-z0-9_-]{10,})/);
  if (byPath) return byPath[1] ?? null;
  if (/drive\.google\.com/.test(value)) {
    const byQuery = value.match(/[?&]id=([A-Za-z0-9_-]{10,})/);
    if (byQuery) return byQuery[1] ?? null;
  }
  return null;
}

export function isDriveUrl(url: string): boolean {
  return /drive\.google\.com|lh3\.googleusercontent\.com/.test(url);
}

/**
 * Rewrite a recognized Google Drive link to a direct, embeddable image URL.
 * Non-Drive URLs (or unrecognized Drive URLs) are returned unchanged.
 */
export function toDirectMediaUrl(url: string, width: number = DEFAULT_DRIVE_WIDTH): string {
  const id = extractDriveFileId(url);
  if (!id) return url;
  return `https://drive.google.com/thumbnail?id=${id}&sz=w${width}`;
}
