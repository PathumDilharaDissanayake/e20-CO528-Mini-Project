import React from 'react';
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
} from '@mui/material';
import {
  Menu as MenuIcon,
  Notifications,
  DarkMode,
  LightMode,
  Logout,
  Person,
  Settings,
  Bolt,
} from '@mui/icons-material';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '@store';
import { toggleTheme } from '@features/themeSlice';
import { logout } from '@features/authSlice';
import { toggleSidebar } from '@features/uiSlice';
import { useGetUnreadCountQuery } from '@services/notificationApi';
import { useLogoutMutation } from '@services/authApi';
import { SearchBar } from '@components/common';

export const Header: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const { user, refreshToken } = useSelector((state: RootState) => state.auth);
  const { mode } = useSelector((state: RootState) => state.theme);
  const { data: unreadData } = useGetUnreadCountQuery();
  const [logoutMutation] = useLogoutMutation();

  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

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

  return (
    <AppBar
      position="fixed"
      className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-sm border-b border-white/10"
      sx={{
        backgroundColor: 'rgba(255, 255, 255, 0.8)',
        backdropFilter: 'blur(20px)',
        color: 'text.primary',
        zIndex: (theme) => theme.zIndex.drawer + 1,
        borderBottom: '1px solid rgba(255, 255, 255, 0.1)',
      }}
    >
      <Toolbar className="px-4 min-h-[64px]">
        {/* Left Section */}
        <Box className="flex items-center gap-2">
          <IconButton
            edge="start"
            onClick={() => dispatch(toggleSidebar())}
            className="lg:hidden text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <MenuIcon />
          </IconButton>

          <Box
            className="flex items-center gap-2 cursor-pointer group"
            onClick={() => navigate('/')}
          >
            <Box className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500 via-emerald-500 to-teal-600 flex items-center justify-center shadow-lg shadow-green-500/30 group-hover:scale-105 transition-transform duration-300">
              <Typography className="text-white font-bold text-xl">D</Typography>
            </Box>
            <Typography
              variant="h6"
              className="hidden sm:block font-bold bg-gradient-to-r from-green-600 via-emerald-600 to-teal-600 bg-clip-text text-transparent"
            >
              DECP
            </Typography>
          </Box>
        </Box>

        {/* Center - Search */}
        <Box className="flex-1 max-w-xl mx-4 hidden md:block">
          <SearchBar
            value=""
            onChange={() => { }}
            placeholder="Search posts, jobs, people..."
          />
        </Box>

        {/* Right Section */}
        <Box className="flex items-center gap-1 sm:gap-2">
          {/* Quick Stats */}
          <Tooltip title="Quick Stats">
            <IconButton
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Bolt className="text-yellow-500" />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={mode === 'dark' ? 'Light Mode' : 'Dark Mode'}>
            <IconButton
              onClick={() => dispatch(toggleTheme())}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              {mode === 'dark' ? <LightMode className="text-yellow-400" /> : <DarkMode className="text-gray-600" />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={() => navigate('/notifications')}
              className="text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <Badge
                badgeContent={unreadData?.data?.count || 0}
                color="error"
                max={99}
                sx={{
                  '& .MuiBadge-badge': {
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                  }
                }}
              >
                <Notifications />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Profile">
            <IconButton onClick={handleMenuOpen} className="hover:scale-105 transition-transform">
              <Avatar
                src={user?.avatar}
                alt={`${user?.firstName} ${user?.lastName}`}
                className="w-9 h-9 bg-gradient-to-br from-green-500 to-emerald-600 shadow-lg"
              >
                {user?.firstName?.[0]}
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
            className: 'mt-1.5 min-w-[200px] rounded-xl',
            sx: {
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(20px)',
              boxShadow: '0 20px 40px rgba(0, 0, 0, 0.15)',
              border: '1px solid rgba(255, 255, 255, 0.2)',
            }
          }}
        >
          <Box className="px-4 py-3">
            <Typography variant="subtitle2" className="font-semibold">
              {user?.firstName} {user?.lastName}
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {user?.email}
            </Typography>
            {user?.role && (
              <Typography variant="caption" className="block text-green-600 font-medium mt-1">
                {user.role.charAt(0).toUpperCase() + user.role.slice(1)}
              </Typography>
            )}
          </Box>
          <Divider />
          <MenuItem onClick={() => { handleMenuClose(); navigate('/profile'); }} className="hover:bg-green-50">
            <ListItemIcon>
              <Person fontSize="small" className="text-green-600" />
            </ListItemIcon>
            Profile
          </MenuItem>
          <MenuItem onClick={handleMenuClose} className="hover:bg-green-50">
            <ListItemIcon>
              <Settings fontSize="small" className="text-green-600" />
            </ListItemIcon>
            Settings
          </MenuItem>
          <Divider />
          <MenuItem onClick={handleLogout} className="text-red-600 hover:bg-red-50">
            <ListItemIcon className="text-red-600">
              <Logout fontSize="small" />
            </ListItemIcon>
            Logout
          </MenuItem>
        </Menu>
      </Toolbar>
    </AppBar>
  );
};

export default Header;
