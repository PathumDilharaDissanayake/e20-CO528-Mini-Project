export const getMediaUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('blob:')) {
    return url;
  }

  const normalized = url.startsWith('/') ? url : `/${url}`;

  // For deployed frontend (S3 static hosting), relative /uploads paths must target API origin.
  if (normalized.startsWith('/uploads/')) {
    const mediaBase = import.meta.env.VITE_MEDIA_BASE_URL ||
      (import.meta.env.VITE_API_URL
        ? import.meta.env.VITE_API_URL.replace(/\/api\/v1\/?$/, '')
        : '');

    if (mediaBase) {
      return `${mediaBase}${normalized}`;
    }
  }

  return normalized;
};
