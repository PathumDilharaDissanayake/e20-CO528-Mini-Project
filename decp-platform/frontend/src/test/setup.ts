import React from 'react';
import { render, RenderOptions } from '@testing-library/react';
import { configureStore, PreloadedState } from '@reduxjs/toolkit';
import { Provider } from 'react-redux';
import { MemoryRouter } from 'react-router-dom';
import { vi } from 'vitest';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';

// Import reducers
import authReducer from '@features/authSlice';
import themeReducer from '@features/themeSlice';
import uiReducer from '@features/uiSlice';
import { apiSlice } from '@services/api';

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

Object.defineProperty(URL, 'createObjectURL', {
  writable: true,
  value: vi.fn((_obj: any) => 'blob:http://localhost:5173/f1b5-f2a1-4d7e'),
});

Object.defineProperty(URL, 'revokeObjectURL', {
  writable: true,
  value: vi.fn(),
});

// ── Mock all services ────────────────────────────────────────────────────────
vi.mock('@services/postApi', () => ({
  useGetPostsQuery: vi.fn(() => ({
    data: { data: [{ id: 'p1', content: 'ML post', userId: 'u1', type: 'text', likes: [], comments: 0, shares: 0, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() }] },
    isLoading: false,
    isFetching: false,
  })),
  useLikePostMutation: () => [vi.fn(), {}],
  useDeletePostMutation: () => [vi.fn(), {}],
  useAddCommentMutation: () => [vi.fn(), {}],
  useSharePostMutation: () => [vi.fn(), {}],
  useUpdatePostMutation: () => [vi.fn(), {}],
  useGetPostCommentsQuery: () => ({ data: { data: [{ id: 'c1', content: 'Nice post!', userId: 'other-user' }] }, isLoading: false }),
  useBookmarkPostMutation: () => [vi.fn(), {}],
  useVotePollMutation: () => [vi.fn(), {}],
  useCreatePostMutation: () => [vi.fn().mockResolvedValue({ data: {}, success: true }), { isLoading: false }],
}));

vi.mock('@services/userApi', () => ({
  useGetUsersQuery: vi.fn(() => ({
    data: { data: [{ id: 'u1', firstName: 'Alice', lastName: 'Student', role: 'student', email: 'alice@decp.edu' }] },
    isLoading: false,
  })),
  useGetProfileQuery: vi.fn(() => ({ data: null, isLoading: false })),
  useSendConnectionRequestMutation: vi.fn(() => [vi.fn(), {}]),
  useAcceptConnectionMutation: vi.fn(() => [vi.fn(), {}]),
  useDeclineConnectionMutation: vi.fn(() => [vi.fn(), {}]),
  useGetConnectionRequestsQuery: () => ({
    data: { data: [], total: 0 },
    isLoading: false,
  }),
}));

vi.mock('@services/jobApi', () => ({
  useGetJobsQuery: vi.fn(() => ({
    data: { data: [{ id: 'j1', title: 'Software Intern', company: 'DECP', type: 'internship', createdAt: new Date().toISOString() }] },
    isLoading: false,
  })),
}));

vi.mock('@services/notificationApi', () => ({
  useGetUnreadCountQuery: () => ({
    data: { data: { count: 5, unread: 5 } },
    isLoading: false,
  }),
  useGetNotificationsQuery: () => ({
    data: { data: [] },
    isLoading: false,
  }),
}));

vi.mock('@services/authApi', () => ({
  useLogoutMutation: () => [vi.fn().mockResolvedValue({}), { isLoading: false }],
}));

// ── Test user ──────────────────────────────────────────────────────────────
export const mockUser = {
  id: 'mock-user-id',
  _id: 'mock-user-id',
  firstName: 'Alice',
  lastName: 'Test',
  email: 'alice@example.com',
  role: 'student',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
};

// ── Custom render helper ─────────────────────────────────────────────────────

const defaultAuthState = {
  user: mockUser,
  token: 'mock-token',
  isAuthenticated: true,
};

function createMockStore(preloadedState?: PreloadedState<any>) {
  const state: any = preloadedState ?? {
    auth: defaultAuthState,
    theme: { mode: 'light' },
    ui: { sidebarOpen: true, toasts: [], modal: { isOpen: false, type: null, data: null }, searchQuery: '' },
  };

  return configureStore({
    reducer: {
      [apiSlice.reducerPath]: apiSlice.reducer,
      auth: authReducer,
      theme: themeReducer,
      ui: uiReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware().concat(apiSlice.middleware),
    preloadedState: state,
  });
}

interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<any>;
  store?: ReturnType<typeof createMockStore>;
  initialPath?: string;
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState,
    initialPath = '/',
    ...renderOptions
  }: { preloadedState?: PreloadedState<any>; initialPath?: string } & Omit<RenderOptions, 'queries'> = {}
) {
  const store = createMockStore(preloadedState);
  function Wrapper({ children }: { children: React.ReactNode }): JSX.Element {
    const muiTheme = createTheme({ palette: { mode: store.getState().theme.mode } });
    return (
      <Provider store={store}>
        <ThemeProvider theme={muiTheme}>
          <CssBaseline />
          <MemoryRouter initialEntries={[initialPath]}>{children}</MemoryRouter>
        </ThemeProvider>
      </Provider>
    );
  }
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) };
}
