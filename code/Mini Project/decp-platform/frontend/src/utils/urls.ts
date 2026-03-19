const DEFAULT_API_BASE = 'http://localhost:3000/api/v1';

const stripTrailingSlash = (value: string): string => value.replace(/\/+$/, '');

const isAbsoluteHttpUrl = (value: string): boolean => /^https?:\/\//i.test(value);

const normalizeApiBaseUrl = (value: string): string => {
  const trimmed = stripTrailingSlash(value.trim());
  if (!trimmed) {
    return DEFAULT_API_BASE;
  }

  if (/\/api\/v1$/i.test(trimmed)) {
    return trimmed;
  }

  return `${trimmed}/api/v1`;
};

const getApiOrigin = (): string => {
  const apiBase = getApiBaseUrl();
  if (!isAbsoluteHttpUrl(apiBase)) {
    return '';
  }

  try {
    return new URL(apiBase).origin;
  } catch {
    return '';
  }
};

export const getApiBaseUrl = (): string => normalizeApiBaseUrl(import.meta.env.VITE_API_URL || '');

export const getMediaBaseUrl = (): string => {
  const configuredMediaBase = stripTrailingSlash((import.meta.env.VITE_MEDIA_BASE_URL || '').trim());
  if (configuredMediaBase) {
    return configuredMediaBase;
  }

  if (typeof window !== 'undefined') {
    const hostname = window.location.hostname;
    if (hostname === 'localhost' || hostname === '127.0.0.1') {
      // Keep media URLs relative in local dev so Vite proxy handles /uploads.
      return '';
    }
  }

  return getApiOrigin();
};

export const getMediaUrl = (url: string): string => {
  if (!url) {
    return '';
  }

  if (/^(https?:\/\/|blob:|data:)/i.test(url)) {
    return url;
  }

  const normalizedPath = url.startsWith('/') ? url : `/${url}`;
  const mediaBase = getMediaBaseUrl();

  return mediaBase ? `${mediaBase}${normalizedPath}` : normalizedPath;
};

export const getPostUploadUrl = (): string => `${getApiBaseUrl()}/posts/upload`;
