/* eslint-disable react-refresh/only-export-components */
import React, { useLayoutEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { Provider, useSelector } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store, RootState } from '@store';
import App from './App';
import './index.css';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#059669', light: '#10b981', dark: '#047857', contrastText: '#ffffff' },
    secondary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#ffffff' },
    success: { main: '#10b981' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: { default: '#d8d8dc', paper: '#e4e4e8' },
    text: { primary: '#111827', secondary: '#374151', disabled: '#6b7280' },
    divider: 'rgba(0,0,0,0.12)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '10px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          background: 'linear-gradient(135deg, #047857 0%, #059669 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #065f46 0%, #047857 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#f2f2f5',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 16px rgba(0,0,0,0.07)',
          transition: 'box-shadow 0.25s ease, transform 0.25s ease',
          '&:hover': { boxShadow: '0 8px 28px rgba(0,0,0,0.14), 0 2px 8px rgba(0,0,0,0.09)', transform: 'translateY(-2px)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: '#ececf0',
          boxShadow: '0 1px 3px rgba(0,0,0,0.1), 0 4px 12px rgba(0,0,0,0.06)',
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #047857, #059669)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: '#e8e8ec',
          boxShadow: '0 24px 64px rgba(0,0,0,0.18)',
        },
      },
    },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#10b981', light: '#34d399', dark: '#059669', contrastText: '#ffffff' },
    secondary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1', contrastText: '#ffffff' },
    success: { main: '#10b981' },
    error: { main: '#f87171' },
    warning: { main: '#fbbf24' },
    info: { main: '#60a5fa' },
    background: { default: '#020c06', paper: 'rgba(15,23,42,0.8)' },
    text: { primary: '#f0fdf4', secondary: '#94a3b8', disabled: '#475569' },
    divider: 'rgba(255,255,255,0.07)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700, letterSpacing: '-0.02em' },
    h5: { fontWeight: 700, letterSpacing: '-0.015em' },
    h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '10px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(255,255,255,0.03)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
          transition: 'transform 0.25s ease, box-shadow 0.25s ease',
          '&:hover': { boxShadow: '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.12)' },
        },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          background: 'rgba(15,23,42,0.7)',
          backdropFilter: 'blur(12px)',
          border: '1px solid rgba(255,255,255,0.07)',
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #059669, #10b981)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiDialog: {
      styleOverrides: {
        paper: {
          background: 'rgba(15,23,42,0.95)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
        },
      },
    },
  },
});

// Inner component that can read from Redux store
const AppWithTheme: React.FC = () => {
  const mode = useSelector((state: RootState) => state.theme.mode);

  // useLayoutEffect fires synchronously before paint — eliminates the one-frame flash
  // that caused the double-click dark mode bug
  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', mode === 'dark');
  }, [mode]);

  return (
    <ThemeProvider theme={mode === 'dark' ? darkTheme : lightTheme}>
      <CssBaseline />
      <BrowserRouter>
        <App />
        <ToastContainer
          position="top-right"
          autoClose={3000}
          hideProgressBar={false}
          newestOnTop
          closeOnClick
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme={mode === 'dark' ? 'dark' : 'light'}
        />
      </BrowserRouter>
    </ThemeProvider>
  );
};

// Initialise the dark class before first render so Tailwind picks it up immediately
const initialTheme = localStorage.getItem('theme') as 'dark' | 'light' | null;
const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
const startDark = initialTheme === 'dark' || (!initialTheme && prefersDark);
document.documentElement.classList.toggle('dark', startDark);

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Provider store={store}>
      <AppWithTheme />
    </Provider>
  </React.StrictMode>
);
