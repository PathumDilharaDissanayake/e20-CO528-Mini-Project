import React from 'react';
import { Box, Toolbar } from '@mui/material';
import { Outlet } from 'react-router-dom';
import { Header } from './Header';
import { Sidebar } from './Sidebar';
import { BottomNav } from './BottomNav';

export const MainLayout: React.FC = () => {
  return (
    <Box
      className="min-h-screen transition-colors duration-300"
      sx={{
        background: (theme) =>
          theme.palette.mode === 'dark'
            ? 'linear-gradient(135deg, #0f172a 0%, #0c1a12 50%, #0f172a 100%)'
            : 'linear-gradient(135deg, #f0fdf8 0%, #ecfdf5 60%, #f8fafc 100%)',
      }}
    >
      {/* Subtle dot-grid background */}
      <Box
        className="fixed inset-0 pointer-events-none"
        sx={{
          opacity: 0.35,
          backgroundImage: `radial-gradient(circle at 20px 20px, rgba(16,185,129,0.14) 1.5px, transparent 0)`,
          backgroundSize: '40px 40px',
        }}
      />

      <Header />
      <Sidebar />

      <Box
        component="main"
        className="flex-1 lg:ml-[260px] transition-all duration-300 relative z-10"
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
