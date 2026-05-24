// Central API configuration
// In development: uses localhost:5050
// In production (Vercel): uses the same origin with /_/backend prefix

const isProd = import.meta.env.PROD;

export const API_BASE = isProd
  ? '/_/backend'
  : 'http://localhost:5050';

// Helper: resolve a media/avatar URL to absolute
export const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};
