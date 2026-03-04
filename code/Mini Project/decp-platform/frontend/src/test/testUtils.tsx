/**
 * Custom render helper that wraps components with all required providers.
 * Use this instead of the plain @testing-library/react `render`.
 */
import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter, MemoryRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// ── Feature reducers ─────────────────────────────────────────────────────────
// We import the reducers directly so the mock store mirrors the real shape.
// If these paths change, update them here.
import authReducer from '@features/authSlice';
import themeReducer from '@features/themeSlice';
import uiReducer from '@features/uiSlice';

// ── Shared mock user ─────────────────────────────────────────────────────────
export const mockUser = {
  id: 'user-test-123',
  _id: 'user-test-123',
  email: 'alice.student@decp.edu',
  firstName: 'Alice',
  lastName: 'Student',
  role: 'student' as const,
  profilePicture: null,
  isEmailVerified: true,
};

// ── Default auth state ───────────────────────────────────────────────────────
export const defaultAuthState = {
  user: mockUser,
  token: 'mock-access-token',
  refreshToken: 'mock-refresh-token',
  isAuthenticated: true,
  isLoading: false,
};

// ── Mock store factory ───────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function createMockStore(preloadedState?: any) {
  // Cast to any to avoid TypeScript preloadedState excess-property check
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const state: any = preloadedState ?? {
    auth: defaultAuthState,
    theme: { mode: 'light' },
    ui: { sidebarOpen: true },
  };
  return configureStore({
    reducer: {
      auth: authReducer,
      theme: themeReducer,
      ui: uiReducer,
    },
    preloadedState: state,
    middleware: (getDefault) =>
      getDefault({ serializableCheck: false }),
  });
}

const muiTheme = createTheme({
  palette: { primary: { main: '#10b981' }, secondary: { main: '#6366f1' } },
});

// ── Extended render options ──────────────────────────────────────────────────
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  preloadedState?: Record<string, unknown>;
  store?: ReturnType<typeof createMockStore>;
  /** Use MemoryRouter with this initial path instead of BrowserRouter */
  initialPath?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    store = createMockStore(preloadedState),
    initialPath,
    ...renderOptions
  }: CustomRenderOptions = {}
) {
  function Wrapper({ children }: { children: React.ReactNode }) {
    const Router = initialPath
      ? () => <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
      : () => <BrowserRouter>{children}</BrowserRouter>;

    return (
      <Provider store={store}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <Router />
        </ThemeProvider>
      </Provider>
    );
  }

  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
