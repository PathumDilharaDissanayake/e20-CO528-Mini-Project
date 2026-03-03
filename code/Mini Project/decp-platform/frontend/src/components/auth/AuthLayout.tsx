import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <Box className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* Animated Background - Green/Black Theme */}
      <Box className="absolute inset-0 bg-gradient-to-br from-slate-950 via-green-950 to-slate-900">
        {/* Animated Orbs */}
        <Box className="absolute top-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse-slow" />
        <Box className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '1s' }} />
        <Box className="absolute top-1/2 left-1/2 w-64 h-64 bg-teal-500/15 rounded-full blur-3xl animate-pulse-slow" style={{ animationDelay: '2s' }} />

        {/* Grid Pattern */}
        <Box className="absolute inset-0 opacity-20" style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.1) 1px, transparent 1px)`,
          backgroundSize: '50px 50px'
        }} />
      </Box>

      {/* Content */}
      <Box className="w-full max-w-md relative z-10 p-4">
        {/* Logo */}
        <Box className="text-center mb-8">
          <Box className="w-24 h-24 mx-auto rounded-3xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center shadow-2xl shadow-green-500/40 mb-4 transform hover:scale-105 transition-transform duration-300">
            <Typography className="text-white font-bold text-5xl drop-shadow-lg">D</Typography>
          </Box>
          <Typography variant="h3" className="font-bold bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 bg-clip-text text-transparent">
            DECP
          </Typography>
          <Typography variant="body1" className="text-gray-400 mt-3 font-medium">
            Department Engagement & Career Platform
          </Typography>

          {/* Feature Pills */}
          <Box className="flex flex-wrap justify-center gap-2 mt-4">
            <Box className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300 border border-white/20 backdrop-blur-sm">
              🎓 Connect
            </Box>
            <Box className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300 border border-white/20 backdrop-blur-sm">
              💼 Career
            </Box>
            <Box className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300 border border-white/20 backdrop-blur-sm">
              🔬 Research
            </Box>
            <Box className="px-3 py-1 rounded-full bg-white/10 text-xs text-gray-300 border border-white/20 backdrop-blur-sm">
              📅 Events
            </Box>
          </Box>
        </Box>

        {/* Form Container */}
        <Paper
          elevation={0}
          className="p-8 rounded-3xl bg-white/10 backdrop-blur-xl shadow-2xl border border-white/20"
          sx={{
            background: 'rgba(255, 255, 255, 0.05)',
          }}
        >
          <Outlet />
        </Paper>

        {/* Footer */}
        <Typography variant="caption" className="block text-center text-gray-500 mt-6">
          © 2024 DECP Platform. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
