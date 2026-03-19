import React from 'react';
import {
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  Avatar,
  Chip,
  Divider,
  Badge,
  Toolbar,
} from '@mui/material';
import {
  Home,
  Work,
  Event,
  Science,
  Message,
  Person,
  AdminPanelSettings,
  TrendingUp,
  Notifications,
  Bookmark,
  Search,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { useLocation, useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@store';
import { setSidebarOpen } from '@features/uiSlice';
import { useGetUnreadCountQuery } from '@services/notificationApi';

const mainNavItems = [
  { path: '/', label: 'Feed', icon: Home },
  { path: '/jobs', label: 'Jobs', icon: Work },
  { path: '/events', label: 'Events', icon: Event },
  { path: '/research', label: 'Research', icon: Science },
  { path: '/messages', label: 'Messages', icon: Message },
  { path: '/saved', label: 'Saved Posts', icon: Bookmark },
];

const secondaryNavItems = [
  { path: '/notifications', label: 'Notifications', icon: Notifications },
  { path: '/profile', label: 'Profile', icon: Person },
  { path: '/search', label: 'Search', icon: Search },
  { path: '/admin', label: 'Admin', icon: AdminPanelSettings, adminOnly: true },
];

const getRoleColor = (role?: string) => {
  switch (role) {
    case 'admin': return { bg: 'linear-gradient(135deg,#ef4444,#dc2626)', label: 'Admin' };
    case 'faculty': return { bg: 'linear-gradient(135deg,#166534,#15803d)', label: 'Faculty' };
    case 'alumni': return { bg: 'linear-gradient(135deg,#f59e0b,#d97706)', label: 'Alumni' };
    default: return { bg: 'linear-gradient(135deg,#6366f1,#4f46e5)', label: 'Student' };
  }
};

export const Sidebar: React.FC = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const dispatch = useDispatch<AppDispatch>();
  const { sidebarOpen } = useSelector((state: RootState) => state.ui);
  const { user } = useSelector((state: RootState) => state.auth);
  const { data: unreadData } = useGetUnreadCountQuery();
  const unreadCount = unreadData?.data?.count || 0;

  const isActive = (path: string) => location.pathname === path;
  const roleInfo = getRoleColor(user?.role);

  const handleNavigate = (path: string) => {
    navigate(path);
    if (window.innerWidth < 1024) dispatch(setSidebarOpen(false));
  };

  const drawerContent = (
    <Box className="h-full flex flex-col overflow-hidden">
      {/* Spacer so content clears the fixed AppBar (64 px) */}
      <Toolbar sx={{ minHeight: '64px !important', flexShrink: 0, p: '0 !important' }} />

      {/* User Profile Card */}
      <Box
        className="relative overflow-hidden flex-shrink-0"
        sx={{
          background: 'linear-gradient(135deg, #15803d 0%, #166534 50%, #14b8a6 100%)',
          p: 2.5,
        }}
      >
        {/* Background decoration */}
        <Box
          className="absolute -top-6 -right-6 w-24 h-24 rounded-full opacity-20"
          sx={{ background: 'rgba(255,255,255,0.3)' }}
        />
        <Box
          className="absolute -bottom-4 -left-4 w-16 h-16 rounded-full opacity-15"
          sx={{ background: 'rgba(255,255,255,0.3)' }}
        />

        <Box className="relative flex items-center gap-3">
          <Badge
            overlap="circular"
            anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
            badgeContent={
              <Box className="w-3 h-3 rounded-full bg-green-300 border-2 border-white" />
            }
          >
            <Avatar
              src={user?.avatar || user?.profilePicture}
              sx={{ width: 52, height: 52, border: '2px solid rgba(255,255,255,0.6)', fontSize: '1.2rem', fontWeight: 700 }}
            >
              {user?.firstName?.[0]?.toUpperCase() || 'U'}
            </Avatar>
          </Badge>
          <Box className="flex-1 min-w-0">
            <Typography variant="subtitle1" className="font-bold text-white truncate">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Box
              className="inline-block mt-0.5 px-2 py-0.5 rounded-full text-white text-xs font-semibold"
              sx={{ background: 'rgba(255,255,255,0.25)', fontSize: '0.7rem' }}
            >
              {roleInfo.label}
            </Box>
          </Box>
        </Box>

        {user?.department && (
          <Typography
            variant="caption"
            className="mt-2 block text-white/75 truncate"
            sx={{ fontSize: '0.72rem' }}
          >
            {user.department}
          </Typography>
        )}
      </Box>

      {/* Navigation */}
      <Box className="flex-1 overflow-y-auto py-2">
        <List dense disablePadding>
          <Typography
            variant="overline"
            className="px-4 py-1 block"
            sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em' }}
          >
            Navigation
          </Typography>
          {mainNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.25 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 1,
                    px: 1.5,
                    transition: 'all 0.2s ease',
                    ...(active
                      ? {
                        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': { color: '#fff' },
                        '& .MuiListItemText-primary': { color: '#fff', fontWeight: 700 },
                      }
                      : {
                        '&:hover': {
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(22,101,52,0.12)'
                              : 'rgba(16,185,129,0.08)',
                          transform: 'translateX(4px)',
                        },
                      }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? '#fff' : 'text.secondary' }}>
                    <Icon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.875rem' }}
                  />
                  {active && (
                    <Box
                      className="w-1.5 h-1.5 rounded-full"
                      sx={{ background: 'rgba(255,255,255,0.8)' }}
                    />
                  )}
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        <Divider sx={{ my: 1.5, mx: 2 }} />

        <List dense disablePadding>
          <Typography
            variant="overline"
            className="px-4 py-1 block"
            sx={{ color: 'text.disabled', fontWeight: 600, fontSize: '0.65rem', letterSpacing: '0.1em' }}
          >
            Account
          </Typography>
          {secondaryNavItems.map((item) => {
            if (item.adminOnly && user?.role !== 'admin') return null;
            const Icon = item.icon;
            const active = isActive(item.path);
            const isNotifications = item.path === '/notifications';
            return (
              <ListItem key={item.path} disablePadding sx={{ px: 1, py: 0.25 }}>
                <ListItemButton
                  onClick={() => handleNavigate(item.path)}
                  sx={{
                    borderRadius: '10px',
                    py: 1,
                    px: 1.5,
                    transition: 'all 0.2s ease',
                    ...(active
                      ? {
                        background: 'linear-gradient(135deg, #15803d 0%, #166534 100%)',
                        boxShadow: '0 4px 12px rgba(16,185,129,0.35)',
                        transform: 'translateX(4px)',
                        '& .MuiListItemIcon-root': { color: '#fff' },
                        '& .MuiListItemText-primary': { color: '#fff', fontWeight: 700 },
                      }
                      : {
                        '&:hover': {
                          background: (theme) =>
                            theme.palette.mode === 'dark'
                              ? 'rgba(22,101,52,0.12)'
                              : 'rgba(16,185,129,0.08)',
                          transform: 'translateX(4px)',
                        },
                      }),
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36, color: active ? '#fff' : 'text.secondary' }}>
                    {isNotifications && unreadCount > 0 ? (
                      <Badge badgeContent={unreadCount} color="error" max={9}>
                        <Icon fontSize="small" />
                      </Badge>
                    ) : (
                      <Icon fontSize="small" />
                    )}
                  </ListItemIcon>
                  <ListItemText
                    primary={item.label}
                    primaryTypographyProps={{ fontWeight: active ? 700 : 500, fontSize: '0.875rem' }}
                  />
                </ListItemButton>
              </ListItem>
            );
          })}
        </List>

        {/* Quick stats chip */}
        <Box sx={{ px: 2, pt: 2 }}>
          <Chip
            icon={<TrendingUp fontSize="small" />}
            label="Analytics"
            onClick={() => navigate('/admin')}
            size="small"
            variant="outlined"
            sx={{
              borderColor: 'primary.main',
              color: 'primary.main',
              fontWeight: 600,
              fontSize: '0.72rem',
              display: user?.role === 'admin' ? 'flex' : 'none',
            }}
          />
        </Box>
      </Box>

      {/* Footer */}
      <Box
        className="flex-shrink-0 p-3 text-center"
        sx={{ borderTop: '1px solid', borderColor: 'divider' }}
      >
        <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.65rem' }}>
          © 2025 DECP Platform
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      {/* Mobile Drawer */}
      <Drawer
        variant="temporary"
        open={sidebarOpen}
        onClose={() => dispatch(setSidebarOpen(false))}
        ModalProps={{ keepMounted: true }}
        className="lg:hidden"
        PaperProps={{
          sx: {
            width: 260,
            background: (theme) =>
              theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
          },
        }}
      >
        {drawerContent}
      </Drawer>

      {/* Desktop Drawer */}
      <Drawer
        variant="permanent"
        className="hidden lg:block"
        PaperProps={{
          sx: {
            width: 260,
            background: (theme) =>
              theme.palette.mode === 'dark' ? '#1e293b' : '#ffffff',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        open
      >
        {drawerContent}
      </Drawer>
    </>
  );
};

export default Sidebar;
