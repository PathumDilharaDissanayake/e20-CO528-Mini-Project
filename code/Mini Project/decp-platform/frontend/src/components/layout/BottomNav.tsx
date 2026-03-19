import React from 'react';
import { Paper, Box, Typography } from '@mui/material';
import { Home, Work, Event, Science, Message } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';

const navItems = [
  { path: '/', label: 'Feed', icon: Home },
  { path: '/jobs', label: 'Jobs', icon: Work },
  { path: '/events', label: 'Events', icon: Event },
  { path: '/research', label: 'Research', icon: Science },
  { path: '/messages', label: 'Messages', icon: Message },
];

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const activeIndex = navItems.findIndex((item) =>
    item.path === '/'
      ? location.pathname === '/'
      : location.pathname.startsWith(item.path)
  );

  return (
    <Paper
      className="lg:hidden"
      elevation={0}
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1200,
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        overflow: 'hidden',
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(15,23,42,0.96)'
            : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'stretch', px: 1 }}>
        {navItems.map((item, index) => {
          const Icon = item.icon;
          const isActive = index === activeIndex;
          return (
            <Box
              key={item.path}
              onClick={() => navigate(item.path)}
              sx={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                py: 1.25,
                gap: 0.4,
                cursor: 'pointer',
                position: 'relative',
                transition: 'all 0.2s ease',
                '&:active': { transform: 'scale(0.93)' },
              }}
            >
              {/* Active indicator pill */}
              {isActive && (
                <Box
                  sx={{
                    position: 'absolute',
                    top: 0,
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: 32,
                    height: 3,
                    borderRadius: '0 0 4px 4px',
                    background: 'linear-gradient(90deg, #15803d, #22c55e)',
                  }}
                />
              )}

              <Box
                sx={{
                  width: 40,
                  height: 30,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  borderRadius: '10px',
                  transition: 'all 0.2s ease',
                  background: isActive
                    ? (t) => t.palette.mode === 'dark' ? 'rgba(34,197,94,0.15)' : 'rgba(22,101,52,0.1)'
                    : 'transparent',
                }}
              >
                <Icon
                  sx={{
                    fontSize: 22,
                    color: isActive
                      ? (t) => t.palette.mode === 'dark' ? '#22c55e' : '#166534'
                      : 'text.secondary',
                    transition: 'color 0.2s',
                  }}
                />
              </Box>
              <Typography
                variant="caption"
                sx={{
                  fontSize: '0.62rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive
                    ? (t) => t.palette.mode === 'dark' ? '#22c55e' : '#166534'
                    : 'text.secondary',
                  lineHeight: 1,
                  transition: 'color 0.2s',
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
      {/* Safe area spacer for iOS */}
      <Box sx={{ height: 'env(safe-area-inset-bottom, 0px)', background: 'inherit' }} />
    </Paper>
  );
};

export default BottomNav;
