import React from 'react';
import { Box, keyframes } from '@mui/material';

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const pulse = keyframes`
  0%, 100% { transform: scale(1); opacity: 1; }
  50% { transform: scale(0.8); opacity: 0.6; }
`;

interface LoadingSpinnerProps {
  size?: number;
  fullPage?: boolean;
}

const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({ size = 40, fullPage = false }) => {
  const spinner = (
    <Box sx={{ position: 'relative', width: size, height: size }}>
      {/* Outer ring */}
      <Box
        sx={{
          position: 'absolute',
          inset: 0,
          borderRadius: '50%',
          border: '3px solid',
          borderColor: 'primary.light',
          borderTopColor: 'primary.main',
          animation: `${spin} 0.8s linear infinite`,
        }}
      />
      {/* Inner dot */}
      <Box
        sx={{
          position: 'absolute',
          inset: '25%',
          borderRadius: '50%',
          bgcolor: 'primary.main',
          animation: `${pulse} 0.8s ease-in-out infinite`,
        }}
      />
    </Box>
  );

  if (fullPage) {
    return (
      <Box
        sx={{
          position: 'fixed',
          inset: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          bgcolor: 'background.default',
          zIndex: 9999,
          flexDirection: 'column',
          gap: 2,
        }}
      >
        {spinner}
        <Box
          sx={{
            background: 'linear-gradient(90deg, #10b981, #6366f1)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            fontWeight: 700,
            fontSize: '1.1rem',
            animation: `${pulse} 1.5s ease-in-out infinite`,
          }}
        >
          DECP Platform
        </Box>
      </Box>
    );
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
      {spinner}
    </Box>
  );
};

export default LoadingSpinner;
