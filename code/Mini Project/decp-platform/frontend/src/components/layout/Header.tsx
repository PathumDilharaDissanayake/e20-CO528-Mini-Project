import React, { useState, useRef } from 'react';
import {
  AppBar,
  Toolbar,
  IconButton,
  Badge,
  Box,
  Tooltip,
  Avatar,
  Menu,
  MenuItem,
  ListItemIcon,
  Typography,
  Divider,
  TextField,
  InputAdornment,
  Paper,
  List,
  ListItemButton,
  ListItemText,
  ClickAwayListener,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  DarkMode,
  LightMode,
  Logout,
  Person,
  Settings,
  Search,
  Clear,
  Work,
  Event,
  Science,
  Home,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@store';
import { toggleTheme } from '@features/themeSlice';
import { logout } from '@features/authSlice';
import { toggleSidebar } from '@features/uiSlice';
import { useGetUnreadCountQuery } from '@services/notificationApi';
import { useLogoutMutation } from '@services/authApi';

const SEARCH_SHORTCUTS = [
  { label: 'Feed', path: '/', icon: Home },
  { label: 'Jobs', path: '/jobs', icon: Work },
  { label: 'Events', path: '/events', icon: Event },
  { label: 'Research', path: '/research', icon: Science },
  { label: 'Profile', path: '/profile', icon: Person },
];

export const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { data: unreadData } = useGetUnreadCountQuery(undefined, { pollingInterval: 15000 });
  const [logoutMutation] = useLogoutMutation();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const [searchValue, setSearchValue] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const handleMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    try {
      if (refreshToken) {
        await logoutMutation({ refreshToken }).unwrap();
      }
    } catch {
      // Proceed with client-side logout even if API call fails
    }
    dispatch(logout());
    navigate('/login');
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      setSearchOpen(false);
      navigate(`/search?q=${encodeURIComponent(searchValue.trim())}`);
    }
  };

  const handleSearchShortcut = (path: string) => {
    setSearchOpen(false);
    setSearchValue('');
    navigate(path);
  };

  const unreadCount = unreadData?.data?.count || 0;

  const displayName = `${user?.firstName || ''} ${user?.lastName || ''}`.trim() || 'User';
  const initials = (user?.firstName?.[0] || '') + (user?.lastName?.[0] || '');

  return (
    <AppBar
      position="fixed"
      elevation={0}
      sx={{
        backgroundColor: (theme) =>
          theme.palette.mode === 'dark'
            ? 'rgba(15,23,42,0.92)'
            : 'rgba(255,255,255,0.92)',
        backdropFilter: 'blur(20px)',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Toolbar sx={{ minHeight: '64px !important', px: { xs: 1.5, sm: 2 } }}>
        {/* Left Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <IconButton
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            sx={{ display: { lg: 'none' }, color: 'text.primary' }}
          >
            <MenuIcon />
          </IconButton>

          <Box
            sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
            onClick={() => navigate('/')}
          >
            <Box
              sx={{
                width: 38,
                height: 38,
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #15803d, #166534)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 12px rgba(22,101,52,0.3)',
                flexShrink: 0,
              }}
            >
              <Typography sx={{ color: 'white', fontWeight: 800, fontSize: '1.1rem' }}>D</Typography>
            </Box>
            <Typography
              variant="h6"
              sx={{
                display: { xs: 'none', sm: 'block' },
                fontWeight: 800,
                background: 'linear-gradient(135deg, #15803d, #166534)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
                letterSpacing: '-0.5px',
              }}
            >
              DECP
            </Typography>
          </Box>
        </Box>

        {/* Center - Search */}
        <Box sx={{ flex: 1, maxWidth: 480, mx: { xs: 1, md: 3 }, display: { xs: 'none', md: 'block' }, position: 'relative' }}>
          <ClickAwayListener onClickAway={() => setSearchOpen(false)}>
            <Box ref={searchRef}>
              <Box component="form" onSubmit={handleSearch}>
                <TextField
                  size="small"
                  fullWidth
                  placeholder="Search posts, jobs, events, people..."
                  value={searchValue}
                  onChange={(e) => { setSearchValue(e.target.value); setSearchOpen(true); }}
                  onFocus={() => setSearchOpen(true)}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <Search sx={{ color: 'text.disabled', fontSize: 18 }} />
                      </InputAdornment>
                    ),
                    endAdornment: searchValue && (
                      <InputAdornment position="end">
                        <IconButton size="small" onClick={() => { setSearchValue(''); setSearchOpen(false); }}>
                          <Clear fontSize="small" />
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: '24px',
                      backgroundColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      '& fieldset': { borderColor: 'transparent' },
                      '&:hover fieldset': { borderColor: 'primary.light' },
                      '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '1.5px' },
                    },
                  }}
                />
              </Box>

              {/* Search dropdown */}
              {searchOpen && (
                <Paper
                  elevation={8}
                  sx={{
                    position: 'absolute',
                    top: '110%',
                    left: 0,
                    right: 0,
                    borderRadius: '16px',
                    overflow: 'hidden',
                    zIndex: 9999,
                    border: '1px solid',
                    borderColor: 'divider',
                  }}
                >
                  {searchValue.trim() ? (
                    <List dense disablePadding>
                      <ListItemButton
                        onClick={handleSearch as any}
                        sx={{ py: 1.5, px: 2 }}
                      >
                        <Search sx={{ mr: 1.5, color: 'primary.main', fontSize: 18 }} />
                        <ListItemText
                          primary={`Search for "${searchValue}"`}
                          primaryTypographyProps={{ fontWeight: 600, fontSize: '0.875rem' }}
                        />
                      </ListItemButton>
                    </List>
                  ) : (
                    <>
                      <Box sx={{ px: 2, pt: 1.5, pb: 0.5 }}>
                        <Typography variant="caption" sx={{ color: 'text.disabled', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          Quick Navigation
                        </Typography>
                      </Box>
                      <List dense disablePadding sx={{ pb: 1 }}>
                        {SEARCH_SHORTCUTS.map(({ label, path, icon: Icon }) => (
                          <ListItemButton
                            key={path}
                            onClick={() => handleSearchShortcut(path)}
                            sx={{ py: 0.75, px: 2, '&:hover': { background: 'rgba(16,185,129,0.08)' } }}
                          >
                            <Icon sx={{ mr: 1.5, color: 'primary.main', fontSize: 18 }} />
                            <ListItemText
                              primary={label}
                              primaryTypographyProps={{ fontSize: '0.875rem', fontWeight: 500 }}
                            />
                          </ListItemButton>
                        ))}
                      </List>
                    </>
                  )}
                </Paper>
              )}
            </Box>
          </ClickAwayListener>
        </Box>

        {/* Right Section */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, ml: 'auto' }}>
          {/* Mobile search */}
          <Tooltip title="Search">
            <IconButton
              sx={{ display: { xs: 'flex', md: 'none' }, color: 'text.primary' }}
              onClick={() => navigate('/search')}
            >
              <Search />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}>
            <IconButton
              onClick={() => dispatch(toggleTheme())}
              sx={{ color: 'text.primary' }}
            >
              {mode === 'dark' ? (
                <LightMode sx={{ color: '#fbbf24' }} />
              ) : (
                <DarkMode sx={{ color: '#64748b' }} />
              )}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton onClick={() => navigate('/notifications')} sx={{ color: 'text.primary' }}>
              <Badge
                badgeContent={unreadCount}
                color="error"
                max={99}
                sx={{ '& .MuiBadge-badge': { fontSize: '0.65rem', minWidth: 18, height: 18 } }}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile Avatar */}
          <Tooltip title={displayName}>
            <IconButton onClick={handleMenuOpen} sx={{ p: 0.5 }}>
              <Avatar
                src={user?.avatar}
                sx={{
                  width: 36,
                  height: 36,
                  background: 'linear-gradient(135deg, #15803d, #166534)',
                  fontSize: '0.85rem',
                  fontWeight: 700,
                  border: '2px solid',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(16,185,129,0.4)' : 'rgba(22,101,52,0.3)',
                }}
              >
                {initials || 'U'}
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
          PaperProps={{
            sx: {
              mt: 1,
              minWidth: 220,
              borderRadius: '16px',
              boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
              border: '1px solid',
              borderColor: 'divider',
              overflow: 'hidden',
            }
          }}
        >
          {/* User info header */}
          <Box sx={{ px: 2, py: 2, background: 'linear-gradient(135deg, #15803d, #166534)' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
              <Avatar
                src={user?.avatar}
                sx={{ width: 44, height: 44, border: '2px solid rgba(255,255,255,0.5)', fontWeight: 700 }}
              >
                {initials || 'U'}
              </Avatar>
              <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                  variant="subtitle2"
                  sx={{ fontWeight: 700, color: 'white', lineHeight: 1.2, whiteSpace: 'normal', wordBreak: 'break-word' }}
                >
                  {displayName}
                </Typography>
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.8)', display: 'block', mt: 0.25 }}>
                  {user?.email}
                </Typography>
                {user?.role && (
                  <Box
                    sx={{
                      display: 'inline-block',
                      mt: 0.5,
                      px: 1,
                      py: 0.15,
                      borderRadius: '20px',
                      background: 'rgba(255,255,255,0.25)',
                      fontSize: '0.65rem',
                      color: 'white',
                      fontWeight: 600,
                    }}
                  >
                    {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
                  </Box>
                )}
              </Box>
            </Box>
          </Box>

          <Box sx={{ py: 0.5 }}>
            <MenuItem
              onClick={() => { handleMenuClose(); navigate('/profile'); }}
              sx={{ py: 1.25, px: 2, '&:hover': { background: 'rgba(16,185,129,0.08)' } }}
            >
              <ListItemIcon>
                <Person fontSize="small" sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={500}>My Profile</Typography>
            </MenuItem>
            <MenuItem
              onClick={handleMenuClose}
              sx={{ py: 1.25, px: 2, '&:hover': { background: 'rgba(16,185,129,0.08)' } }}
            >
              <ListItemIcon>
                <Settings fontSize="small" sx={{ color: 'primary.main' }} />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={500}>Settings</Typography>
            </MenuItem>
            <Divider sx={{ my: 0.5 }} />
            <MenuItem
              onClick={handleLogout}
              sx={{ py: 1.25, px: 2, '&:hover': { background: 'rgba(239,68,68,0.08)' } }}
            >
              <ListItemIcon>
                <Logout fontSize="small" sx={{ color: 'error.main' }} />
              </ListItemIcon>
              <Typography variant="body2" fontWeight={500} color="error">Sign Out</Typography>
            </MenuItem>
          </Box>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
