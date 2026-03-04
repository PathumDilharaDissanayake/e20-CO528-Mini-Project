/**
 * Vitest global test setup
 * Runs once before all test files.
 */
import '@testing-library/jest-dom';
import { vi } from 'vitest';

// ── Browser API stubs not available in jsdom ────────────────────────────────

Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

(window as any).ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

(window as any).IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
  root: null,
  rootMargin: '',
  thresholds: [],
  takeRecords: () => [],
}));

// ── Silence known non-critical MUI warnings in tests ────────────────────────
const originalError = console.error.bind(console);
console.error = (...args: unknown[]) => {
  const msg = String(args[0]);
  // Suppress MUI emotion warnings in test env
  if (msg.includes('Warning: An update to') || msg.includes('not wrapped in act')) return;
  originalError(...args);
};
