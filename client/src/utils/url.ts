export const API_BASE = (import.meta.env.VITE_API_URL as string) || 'http://localhost:5000/api';

/**
 * Helper to resolve profile photo URL (local uploads vs external/Cloudinary URLs)
 */
export const getPhotoUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('/uploads')) {
    const host = API_BASE.replace('/api', '');
    return `${host}${url}`;
  }
  return url;
};
