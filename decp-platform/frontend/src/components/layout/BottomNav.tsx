import React from 'react';
import { BottomNavigation, BottomNavigationAction, Paper } from '@mui/material';
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

  const currentIndex = navItems.findIndex((item) => item.path === location.pathname);
  const [value, setValue] = React.useState(currentIndex >= 0 ? currentIndex : 0);

  React.useEffect(() => {
    const index = navItems.findIndex((item) => item.path === location.pathname);
    if (index >= 0) setValue(index);
  }, [location.pathname]);

  const handleChange = (_: React.SyntheticEvent, newValue: number) => {
    setValue(newValue);
    navigate(navItems[newValue].path);
  };

  return (
    <Paper
      className="lg:hidden fixed bottom-0 left-0 right-0 z-50"
      elevation={3}
      sx={{
        borderTopLeftRadius: 16,
        borderTopRightRadius: 16,
        background: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.97)' : '#d0d0d4',
        borderTop: '1px solid',
        borderColor: 'divider',
      }}
    >
      <BottomNavigation
        value={value}
        onChange={handleChange}
        sx={{
          background: (t) => t.palette.mode === 'dark' ? 'rgba(15,23,42,0.97)' : '#d8d8dc',
        }}
      >
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <BottomNavigationAction
              key={item.path}
              label={item.label}
              icon={<Icon />}
              sx={{
                color: 'text.secondary',
                '&.Mui-selected': { color: '#10b981' },
                '& .MuiBottomNavigationAction-label': { fontSize: '0.7rem', fontWeight: 600 },
              }}
            />
          );
        })}
      </BottomNavigation>
    </Paper>
  );
};

export default BottomNav;
