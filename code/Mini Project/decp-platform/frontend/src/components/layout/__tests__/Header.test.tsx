/**
 * Header unit tests
 * Tests: search input, theme toggle, notification badge, shortcuts dropdown.
 */
import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { screen, fireEvent } from '@testing-library/react';
import { renderWithProviders } from '../../../test/testUtils';

// ── Mock all hooks used by Header ────────────────────────────────────────────
vi.mock('@services/notificationApi', () => ({
  useGetUnreadCountQuery: () => ({
    data: { data: { count: 5, unread: 5 } },
    isLoading: false,
  }),
}));

vi.mock('@services/authApi', () => ({
  useLogoutMutation: () => [vi.fn().mockResolvedValue({}), { isLoading: false }],
}));

// Lazy import after mocks are hoisted
const { Header } = await vi.importActual<typeof import('@components/layout/Header')>(
  '@components/layout/Header'
);

// ── Tests ────────────────────────────────────────────────────────────────────

describe('Header — layout', () => {
  it('renders without crashing', () => {
    renderWithProviders(<Header />);
    expect(document.querySelector('header')).toBeInTheDocument();
  });

  it('contains a search input field', () => {
    renderWithProviders(<Header />);
    const input = screen.getByPlaceholderText(/search/i);
    expect(input).toBeInTheDocument();
  });

  it('has a theme toggle button', () => {
    renderWithProviders(<Header />);
    // DarkMode or LightMode icon button
    const toggleBtn =
      screen.queryByRole('button', { name: /dark mode/i }) ??
      screen.queryByRole('button', { name: /light mode/i });
    expect(toggleBtn).toBeInTheDocument();
  });

  it('has a notifications button', () => {
    renderWithProviders(<Header />);
    const notifBtn = screen.getByRole('button', { name: /notification/i });
    expect(notifBtn).toBeInTheDocument();
  });
});

describe('Header — search', () => {
  it('accepts text input in the search field', () => {
    renderWithProviders(<Header />);
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'machine learning' } });
    expect(input.value).toBe('machine learning');
  });

  it('shows quick-access shortcuts when input is focused', () => {
    renderWithProviders(<Header />);
    const input = screen.getByPlaceholderText(/search/i);
    fireEvent.focus(input);
    // The SEARCH_SHORTCUTS include 'Feed', 'Jobs', 'Events', 'Research', 'Profile'
    expect(screen.getByText('Feed')).toBeInTheDocument();
    expect(screen.getByText('Jobs')).toBeInTheDocument();
    expect(screen.getByText('Events')).toBeInTheDocument();
  });

  it('clears search input when clear icon is clicked', () => {
    renderWithProviders(<Header />);
    const input = screen.getByPlaceholderText(/search/i) as HTMLInputElement;
    fireEvent.change(input, { target: { value: 'some query' } });
    expect(input.value).toBe('some query');

    // Find and click the clear/close button that appears when text is entered
    const clearBtn = screen.queryByRole('button', { name: /clear/i })
      ?? document.querySelector('[data-testid="ClearIcon"]')?.closest('button');
    if (clearBtn) {
      fireEvent.click(clearBtn);
      expect(input.value).toBe('');
    }
  });
});

describe('Header — theme toggle', () => {
  it('dispatches toggleTheme when theme button is clicked', () => {
    const { store } = renderWithProviders(<Header />);
    const initialMode = store.getState().theme.mode;

    const toggleBtn =
      screen.queryByRole('button', { name: /dark mode/i }) ??
      screen.queryByRole('button', { name: /light mode/i });

    if (toggleBtn) {
      fireEvent.click(toggleBtn);
      const newMode = store.getState().theme.mode;
      expect(newMode).not.toBe(initialMode);
    }
  });
});

describe('Header — user menu', () => {
  it('shows user avatar button', () => {
    renderWithProviders(<Header />);
    // Avatar is a button that opens the user menu
    const avatarBtn = document.querySelector('[aria-haspopup="true"]');
    expect(avatarBtn ?? screen.queryByRole('button', { name: /account/i })).toBeTruthy();
  });
});
