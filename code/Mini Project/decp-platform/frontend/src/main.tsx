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
    primary: { main: '#166534', light: '#22c55e', dark: '#14532d', contrastText: '#ffffff' },
    secondary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#ffffff' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: { default: '#f5f5f5', paper: '#ffffff' },
    text: { primary: '#1f2937', secondary: '#4b5563' },
    divider: 'rgba(0,0,0,0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '10px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #0d3d1f 0%, #14532d 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: '0 8px 24px rgba(22,101,52,0.12), 0 2px 8px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #14532d, #166534)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#22c55e', light: '#4ade80', dark: '#166534', contrastText: '#ffffff' },
    secondary: { main: '#818cf8', light: '#a5b4fc', dark: '#6366f1', contrastText: '#ffffff' },
    success: { main: '#22c55e' },
    error: { main: '#f87171' },
    warning: { main: '#fbbf24' },
    info: { main: '#60a5fa' },
    background: { default: '#0f172a', paper: '#1e293b' },
    text: { primary: '#f1f5f9', secondary: '#94a3b8' },
    divider: 'rgba(255,255,255,0.08)',
  },
  typography: {
    fontFamily: '"Inter", -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    h4: { fontWeight: 700 }, h5: { fontWeight: 600 }, h6: { fontWeight: 600 },
    button: { fontWeight: 600, textTransform: 'none' as const },
  },
  shape: { borderRadius: 12 },
  components: {
    MuiButton: {
      styleOverrides: {
        root: { borderRadius: '10px', boxShadow: 'none', '&:hover': { boxShadow: 'none' } },
        containedPrimary: {
          background: 'linear-gradient(135deg, #166534 0%, #22c55e 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #14532d 0%, #166534 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 8px 24px rgba(22,101,52,0.2), 0 2px 8px rgba(0,0,0,0.4)' },
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #166534, #22c55e)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
    MuiPaper: { styleOverrides: { root: { backgroundImage: 'none' } } },
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
