import React from 'react';
import { Button, ButtonProps, styled } from '@mui/material';

interface GradientButtonProps extends ButtonProps {
  gradient?: 'primary' | 'secondary' | 'success' | 'error' | 'warning';
}

const StyledButton = styled(Button, {
  shouldForwardProp: (prop) => prop !== 'gradient',
})<GradientButtonProps>(({ gradient = 'primary' }) => {
  const gradients: Record<string, string> = {
    primary: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    secondary: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    success: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    error: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    warning: 'linear-gradient(135deg, #f6d365 0%, #fda085 100%)',
  };

  return {
    background: gradients[gradient],
    borderRadius: '12px',
    padding: '10px 24px',
    fontWeight: 600,
    textTransform: 'none',
    boxShadow: '0 4px 15px rgba(0, 0, 0, 0.2)',
    transition: 'all 0.3s ease',
    '&:hover': {
      transform: 'translateY(-2px)',
      boxShadow: '0 6px 20px rgba(0, 0, 0, 0.3)',
    },
    '&:active': {
      transform: 'translateY(0)',
    },
  };
});

export const GradientButton: React.FC<GradientButtonProps> = ({ children, ...props }) => {
  return <StyledButton {...props}>{children}</StyledButton>;
};

export default GradientButton;
