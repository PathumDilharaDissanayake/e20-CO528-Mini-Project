import React from 'react';
import { Box, Typography, Badge } from '@mui/material';
import { Home, Work, Event, Science, Message } from '@mui/icons-material';
import { useLocation, useNavigate } from 'react-router-dom';
import { useGetUnreadCountQuery } from '@services/notificationApi';
import { useGetChatsQuery } from '@services/chatApi';

const navItems = [
  { path: '/', label: 'Feed', icon: Home, key: 'feed' },
  { path: '/jobs', label: 'Jobs', icon: Work, key: 'jobs' },
  { path: '/events', label: 'Events', icon: Event, key: 'events' },
  { path: '/research', label: 'Research', icon: Science, key: 'research' },
  { path: '/messages', label: 'Chat', icon: Message, key: 'messages' },
] as const;

export const BottomNav: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const { data: unreadData } = useGetUnreadCountQuery(undefined, { pollingInterval: 30000 });
  const { data: chatsData } = useGetChatsQuery(undefined, { pollingInterval: 10000 });

  const messageUnreadCount = (chatsData?.data || []).reduce(
    (sum: number, c: any) => sum + (c.unreadCount || 0),
    0
  );
  const _notifCount = unreadData?.data?.count || 0;

  const getIsActive = (path: string) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <Box
      className="lg:hidden"
      sx={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1300,
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(5, 10, 16, 0.9)'
            : 'rgba(255, 255, 255, 0.92)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderTop: '1px solid',
        borderColor: (t) =>
          t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        borderTopLeftRadius: '20px',
        borderTopRightRadius: '20px',
        paddingBottom: 'env(safe-area-inset-bottom, 4px)',
        boxShadow: (t) =>
          t.palette.mode === 'dark'
            ? '0 -8px 40px rgba(0,0,0,0.55), 0 -1px 0 rgba(255,255,255,0.05)'
            : '0 -8px 32px rgba(0,0,0,0.1), 0 -1px 0 rgba(0,0,0,0.05)',
      }}
    >
      <Box sx={{ display: 'flex', height: 62, px: 0.5 }}>
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = getIsActive(item.path);
          const badge = item.key === 'messages' ? messageUnreadCount : 0;

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
                gap: 0.45,
                cursor: 'pointer',
                position: 'relative',
                borderRadius: 2,
                mx: 0.25,
                userSelect: 'none',
                WebkitTapHighlightColor: 'transparent',
                transition: 'transform 0.12s cubic-bezier(0.4,0,0.2,1)',
                '&:active': { transform: 'scale(0.85)' },
                py: 1,
              }}
            >
              {/* Top active pill */}
              <Box
                sx={{
                  position: 'absolute',
                  top: 0,
                  left: '50%',
                  transform: 'translateX(-50%)',
                  height: 3,
                  width: isActive ? 28 : 0,
                  borderRadius: '0 0 6px 6px',
                  background: 'linear-gradient(90deg, #10b981, #059669)',
                  boxShadow: isActive ? '0 2px 8px rgba(16,185,129,0.55)' : 'none',
                  transition: 'width 0.3s cubic-bezier(0.4,0,0.2,1), box-shadow 0.3s ease',
                }}
              />

              {/* Icon */}
              <Badge
                badgeContent={badge > 0 ? badge : 0}
                max={9}
                sx={{
                  '& .MuiBadge-badge': {
                    fontSize: '0.6rem',
                    minWidth: 16,
                    height: 16,
                    fontWeight: 700,
                    bgcolor: '#ef4444',
                    color: 'white',
                    boxShadow: '0 2px 5px rgba(239,68,68,0.45)',
                    padding: '0 3px',
                  },
                }}
              >
                <Icon
                  sx={{
                    fontSize: 22,
                    color: isActive ? '#10b981' : 'text.disabled',
                    transition: 'color 0.2s ease, filter 0.2s ease, transform 0.2s ease',
                    filter: isActive ? 'drop-shadow(0 0 5px rgba(16,185,129,0.4))' : 'none',
                    transform: isActive ? 'translateY(-1px) scale(1.05)' : 'none',
                  }}
                />
              </Badge>

              {/* Label */}
              <Typography
                sx={{
                  fontSize: '0.63rem',
                  fontWeight: isActive ? 700 : 500,
                  color: isActive ? '#10b981' : 'text.disabled',
                  lineHeight: 1,
                  transition: 'color 0.2s ease, font-weight 0.2s ease',
                  letterSpacing: isActive ? '0.02em' : 0,
                }}
              >
                {item.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Box>
  );
};

export default BottomNav;
