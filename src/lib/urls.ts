/**
 * Get the primary frontend URL for building links (verification, reset, etc.).
 * FRONTEND_ORIGIN can be comma-separated for CORS; links need a single URL.
 */
export function getPrimaryFrontendOrigin(): string {
  const raw = process.env.FRONTEND_ORIGIN || 'http://localhost:3000';
  return raw.split(',')[0].trim();
}
