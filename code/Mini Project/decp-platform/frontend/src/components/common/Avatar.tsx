import React from 'react';
import { Avatar as MuiAvatar, AvatarProps, Badge, styled } from '@mui/material';
import { getInitials, generateGradient } from '@utils';

interface CustomAvatarProps extends AvatarProps {
  firstName: string;
  lastName: string;
  src?: string;
  size?: 'small' | 'medium' | 'large' | 'xlarge';
  isOnline?: boolean;
  showStatus?: boolean;
}

const sizeMap = {
  small: 32,
  medium: 40,
  large: 64,
  xlarge: 128,
};

const StyledBadge = styled(Badge)(({ theme }) => ({
  '& .MuiBadge-badge': {
    backgroundColor: '#44b700',
    color: '#44b700',
    boxShadow: `0 0 0 2px ${theme.palette.background.paper}`,
    '&::after': {
      position: 'absolute',
      top: 0,
      left: 0,
      width: '100%',
      height: '100%',
      borderRadius: '50%',
      animation: 'ripple 1.2s infinite ease-in-out',
      border: '1px solid currentColor',
      content: '""',
    },
  },
  '@keyframes ripple': {
    '0%': {
      transform: 'scale(0.8)',
      opacity: 1,
    },
    '100%': {
      transform: 'scale(2.4)',
      opacity: 0,
    },
  },
}));

export const Avatar: React.FC<CustomAvatarProps> = ({
  firstName,
  lastName,
  src,
  size = 'medium',
  isOnline = false,
  showStatus = false,
  ...props
}) => {
  const dimensions = sizeMap[size];
  const gradientClass = generateGradient(`${firstName} ${lastName}`);

  const avatar = (
    <MuiAvatar
      src={src}
      alt={`${firstName} ${lastName}`}
      sx={{
        width: dimensions,
        height: dimensions,
        fontSize: dimensions / 2.5,
        fontWeight: 600,
        background: src ? undefined : `linear-gradient(135deg, var(--tw-gradient-stops))`,
      }}
      className={!src ? gradientClass : ''}
      {...props}
    >
      {!src && getInitials(firstName, lastName)}
    </MuiAvatar>
  );

  if (showStatus && isOnline) {
    return (
      <StyledBadge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
      >
        {avatar}
      </StyledBadge>
    );
  }

  if (showStatus && !isOnline) {
    return (
      <Badge
        overlap="circular"
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        variant="dot"
        sx={{
          '& .MuiBadge-badge': {
            backgroundColor: '#9e9e9e',
            boxShadow: (theme) => `0 0 0 2px ${theme.palette.background.paper}`,
          },
        }}
      >
        {avatar}
      </Badge>
    );
  }

  return avatar;
};

export default Avatar;
