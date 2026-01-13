function stripTrailingSlash(url: string) {
  return url.endsWith("/") ? url.slice(0, -1) : url;
}

/**
 * Returns the API base URL that includes the `/api` prefix.
 *
 * Accepts either:
 * - `VITE_API_URL=https://example.com` (origin)
 * - `VITE_API_URL=https://example.com/api` (already includes /api)
 */
export function getApiBase(): string {
  const raw = (import.meta as any).env?.VITE_API_URL || "http://localhost:8000";
  const base = stripTrailingSlash(String(raw));
  return base.endsWith("/api") ? base : `${base}/api`;
}
