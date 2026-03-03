/* eslint-disable react-refresh/only-export-components */
import React from 'react';
import ReactDOM from 'react-dom/client';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material';
import CssBaseline from '@mui/material/CssBaseline';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

import { store } from '@store';
import App from './App';
import './index.css';

const lightTheme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#10b981', light: '#34d399', dark: '#059669', contrastText: '#ffffff' },
    secondary: { main: '#6366f1', light: '#818cf8', dark: '#4f46e5', contrastText: '#ffffff' },
    success: { main: '#22c55e' },
    error: { main: '#ef4444' },
    warning: { main: '#f59e0b' },
    info: { main: '#3b82f6' },
    background: { default: '#f0fdf8', paper: '#ffffff' },
    text: { primary: '#0f172a', secondary: '#475569' },
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
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          boxShadow: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.06)',
          transition: 'box-shadow 0.2s ease, transform 0.2s ease',
          '&:hover': { boxShadow: '0 8px 24px rgba(16,185,129,0.12), 0 2px 8px rgba(0,0,0,0.08)' },
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #059669, #10b981)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});

const darkTheme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#10b981', light: '#34d399', dark: '#059669', contrastText: '#ffffff' },
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
          background: 'linear-gradient(135deg, #059669 0%, #10b981 100%)',
          '&:hover': { background: 'linear-gradient(135deg, #047857 0%, #059669 100%)' },
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          backgroundImage: 'none',
          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
          transition: 'box-shadow 0.2s ease',
          '&:hover': { boxShadow: '0 8px 24px rgba(16,185,129,0.15), 0 2px 8px rgba(0,0,0,0.4)' },
        },
      },
    },
    MuiTab: { styleOverrides: { root: { fontWeight: 600, textTransform: 'none' as const, fontSize: '0.875rem' } } },
    MuiTabs: { styleOverrides: { indicator: { background: 'linear-gradient(90deg, #059669, #10b981)', height: '3px', borderRadius: '3px' } } },
    MuiChip: { styleOverrides: { root: { fontWeight: 500 } } },
  },
});

const Root: React.FC = () => {
  const [isDark, setIsDark] = React.useState(() => {
    const saved = localStorage.getItem('theme');
    if (saved) return saved === 'dark';
    return window.matchMedia('(prefers-color-scheme: dark)').matches;
  });

  React.useEffect(() => {
    const observer = new MutationObserver(() => {
      const isDarkMode = document.documentElement.classList.contains('dark');
      setIsDark(isDarkMode);
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });

    return () => observer.disconnect();
  }, []);

  return (
    <ThemeProvider theme={isDark ? darkTheme : lightTheme}>
      <CssBaseline />
      <Provider store={store}>
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
            theme={isDark ? 'dark' : 'light'}
          />
        </BrowserRouter>
      </Provider>
    </ThemeProvider>
  );
};

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Root />
  </React.StrictMode>
);
