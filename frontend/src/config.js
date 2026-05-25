// Central API configuration
// In development: uses localhost:5050 via Vite proxy
// In production: uses VITE_API_BASE env variable (set in Vercel dashboard)

export const API_BASE = import.meta.env.VITE_API_BASE || 'https://lostvilla-backend.onrender.com';

// Helper: resolve a media/avatar URL to absolute
export const resolveUrl = (url) => {
  if (!url) return '';
  if (url.startsWith('http')) return url;
  return `${API_BASE}${url}`;
};
