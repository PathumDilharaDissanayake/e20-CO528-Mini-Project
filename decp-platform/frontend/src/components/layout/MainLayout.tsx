import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';
import { useSocket } from '@hooks';

// Initialises the socket connection as soon as the user is logged in.
// Called here so the socket is ready before any child page (e.g. ChatRoom) mounts.
const SocketInitializer: React.FC = () => {
  useSocket();
  return null;
};

export const MainLayout: React.FC = () => {
  return (
    <Box
      className="min-h-screen transition-colors duration-300 relative"
      sx={{
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #020c06 0%, #050f0a 40%, #060c1a 100%)'
            : 'linear-gradient(135deg, #d0d0d4 0%, #d8d8dc 40%, #d2d2d6 100%)',
      }}
    >
      {/* ── Animated live-wallpaper background layer ── */}
      <Box className="fixed inset-0 pointer-events-none overflow-hidden" sx={{ zIndex: 0 }}>
        {/* Orb 1 — large green, top-left */}
        <Box
          className="absolute rounded-full animate-orb1"
          sx={{
            width: 700,
            height: 700,
            top: '-15%',
            left: '-15%',
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(34,197,94,0.18) 0%, rgba(22,101,52,0.06) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(34,197,94,0.14) 0%, rgba(22,101,52,0.04) 60%, transparent 80%)',
            filter: 'blur(60px)',
          }}
        />
        {/* Orb 2 — teal, mid-right */}
        <Box
          className="absolute rounded-full animate-orb2"
          sx={{
            width: 550,
            height: 550,
            top: '25%',
            right: '-12%',
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(20,184,166,0.16) 0%, rgba(13,148,136,0.05) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(20,184,166,0.12) 0%, rgba(13,148,136,0.04) 60%, transparent 80%)',
            filter: 'blur(70px)',
          }}
        />
        {/* Orb 3 — emerald, bottom-left */}
        <Box
          className="absolute rounded-full animate-orb3"
          sx={{
            width: 420,
            height: 420,
            bottom: '5%',
            left: '15%',
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(16,185,129,0.14) 0%, rgba(5,150,105,0.04) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(16,185,129,0.11) 0%, rgba(5,150,105,0.03) 60%, transparent 80%)',
            filter: 'blur(55px)',
          }}
        />
        {/* Orb 4 — indigo accent, top-right */}
        <Box
          className="absolute rounded-full animate-orb4"
          sx={{
            width: 380,
            height: 380,
            top: '5%',
            right: '20%',
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, rgba(79,70,229,0.04) 60%, transparent 80%)'
                : 'radial-gradient(circle, rgba(99,102,241,0.08) 0%, rgba(79,70,229,0.02) 60%, transparent 80%)',
            filter: 'blur(65px)',
          }}
        />
        {/* Orb 5 — small teal, bottom-right */}
        <Box
          className="absolute rounded-full animate-orb5"
          sx={{
            width: 300,
            height: 300,
            bottom: '20%',
            right: '8%',
            background: (t) =>
              t.palette.mode === 'dark'
                ? 'radial-gradient(circle, rgba(45,212,191,0.13) 0%, transparent 70%)'
                : 'radial-gradient(circle, rgba(45,212,191,0.10) 0%, transparent 70%)',
            filter: 'blur(50px)',
          }}
        />
        {/* Animated dot grid */}
        <Box
          className="absolute inset-0 animate-mesh-pulse"
          sx={{
            backgroundImage: (t) => t.palette.mode === 'dark'
              ? `radial-gradient(circle at 20px 20px, rgba(16,185,129,0.18) 1.5px, transparent 0)`
              : `radial-gradient(circle at 20px 20px, rgba(0,0,0,0.06) 1px, transparent 0)`,
            backgroundSize: '40px 40px',
          }}
        />
      </Box>

      <SocketInitializer />
      <Header />
      <Sidebar />

      <Box
        component="main"
        className="flex-1 lg:ml-[260px] transition-all duration-300 relative"
        sx={{ zIndex: 1 }}
      >
        <Toolbar sx={{ minHeight: '64px' }} />
        <Box className="p-3 sm:p-4 pb-20 lg:pb-6 max-w-7xl mx-auto">
          <Outlet />
        </Box>
      </Box>

      <BottomNav />
    </Box>
  );
};

export default MainLayout;
