import React from 'react';
import { Box, Paper, Typography } from '@mui/material';
import { Outlet } from 'react-router-dom';

export const AuthLayout: React.FC = () => {
  return (
    <Box className="min-h-screen flex items-center justify-center relative overflow-hidden">
      {/* ── Animated Background ── */}
      <Box className="absolute inset-0" style={{ background: 'linear-gradient(135deg, #020c06 0%, #051a0d 40%, #060c1a 70%, #020c06 100%)' }}>
        {/* Moving Orb 1 – large green */}
        <Box
          className="absolute rounded-full"
          style={{
            width: 700,
            height: 700,
            top: '-20%',
            left: '-15%',
            background: 'radial-gradient(circle, rgba(34,197,94,0.22) 0%, rgba(22,101,52,0.08) 50%, transparent 75%)',
            filter: 'blur(60px)',
            animation: 'floatOrb1 28s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        {/* Moving Orb 2 – teal */}
        <Box
          className="absolute rounded-full"
          style={{
            width: 600,
            height: 600,
            bottom: '-15%',
            right: '-15%',
            background: 'radial-gradient(circle, rgba(20,184,166,0.20) 0%, rgba(13,148,136,0.06) 50%, transparent 75%)',
            filter: 'blur(70px)',
            animation: 'floatOrb2 34s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        {/* Moving Orb 3 – emerald center */}
        <Box
          className="absolute rounded-full"
          style={{
            width: 400,
            height: 400,
            top: '40%',
            left: '35%',
            transform: 'translate(-50%, -50%)',
            background: 'radial-gradient(circle, rgba(16,185,129,0.18) 0%, transparent 70%)',
            filter: 'blur(50px)',
            animation: 'floatOrb3 22s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        {/* Moving Orb 4 – indigo accent top-right */}
        <Box
          className="absolute rounded-full"
          style={{
            width: 350,
            height: 350,
            top: '5%',
            right: '10%',
            background: 'radial-gradient(circle, rgba(99,102,241,0.18) 0%, transparent 70%)',
            filter: 'blur(55px)',
            animation: 'floatOrb4 38s ease-in-out infinite',
            willChange: 'transform',
          }}
        />
        {/* Moving Orb 5 – small green bottom-left */}
        <Box
          className="absolute rounded-full"
          style={{
            width: 250,
            height: 250,
            bottom: '10%',
            left: '10%',
            background: 'radial-gradient(circle, rgba(74,222,128,0.16) 0%, transparent 70%)',
            filter: 'blur(40px)',
            animation: 'floatOrb5 18s ease-in-out infinite',
            willChange: 'transform',
          }}
        />

        {/* Animated Grid Pattern */}
        <Box
          className="absolute inset-0 animate-mesh-pulse"
          style={{
            backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.07) 1px, transparent 1px), linear-gradient(90deg, rgba(16, 185, 129, 0.07) 1px, transparent 1px)`,
            backgroundSize: '50px 50px',
          }}
        />
      </Box>

      {/* ── Content ── */}
      <Box className="w-full max-w-md relative z-10 p-4">
        {/* Logo */}
        <Box className="text-center mb-8">
          <Box
            className="w-24 h-24 mx-auto rounded-3xl flex items-center justify-center shadow-2xl mb-4 animate-float"
            style={{
              background: 'linear-gradient(135deg, #22c55e 0%, #14b8a6 50%, #22c55e 100%)',
              backgroundSize: '200% 200%',
              animation: 'floatOrb5 6s ease-in-out infinite, gradientFlow 4s ease infinite',
              boxShadow: '0 0 40px rgba(34,197,94,0.5), 0 20px 40px rgba(0,0,0,0.3)',
            }}
          >
            <Typography className="text-white font-bold text-5xl drop-shadow-lg" style={{ fontFamily: 'Inter, sans-serif' }}>D</Typography>
          </Box>
          <Typography
            variant="h3"
            className="font-bold"
            style={{
              background: 'linear-gradient(135deg, #4ade80, #22c55e, #14b8a6)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}
          >
            DECP
          </Typography>
          <Typography variant="body1" className="mt-2 font-medium" style={{ color: 'rgba(148,163,184,0.9)' }}>
            Department Engagement & Career Platform
          </Typography>

          {/* Feature Pills */}
          <Box className="flex flex-wrap justify-center gap-2 mt-4">
            {[
              { icon: '🎓', label: 'Connect' },
              { icon: '💼', label: 'Career' },
              { icon: '🔬', label: 'Research' },
              { icon: '📅', label: 'Events' },
            ].map(({ icon, label }) => (
              <Box
                key={label}
                className="px-3 py-1 rounded-full text-xs font-medium"
                style={{
                  background: 'rgba(255,255,255,0.08)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)',
                  color: 'rgba(203,213,225,0.9)',
                  transition: 'all 0.3s ease',
                }}
              >
                {icon} {label}
              </Box>
            ))}
          </Box>
        </Box>

        {/* Form Container */}
        <Paper
          elevation={0}
          style={{
            padding: '2rem',
            borderRadius: '24px',
            background: 'rgba(255, 255, 255, 0.05)',
            backdropFilter: 'blur(24px)',
            WebkitBackdropFilter: 'blur(24px)',
            border: '1px solid rgba(255,255,255,0.12)',
            boxShadow: '0 25px 60px rgba(0,0,0,0.4), inset 0 1px 0 rgba(255,255,255,0.1)',
          }}
        >
          <Outlet />
        </Paper>

        {/* Footer */}
        <Typography variant="caption" className="block text-center mt-6" style={{ color: 'rgba(100,116,139,0.8)' }}>
          © 2025 DECP Platform · University of Peradeniya
        </Typography>
      </Box>
    </Box>
  );
};

export default AuthLayout;
