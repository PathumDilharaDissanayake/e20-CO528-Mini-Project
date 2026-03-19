import React from 'react';
import { Box, Typography, Button } from '@mui/material';
import { SentimentDissatisfied, SearchOff, Inbox } from '@mui/icons-material';

interface EmptyStateProps {
  icon?: 'no-results' | 'empty' | 'search';
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  action?: React.ReactNode;
}

const icons = {
  'no-results': SentimentDissatisfied,
  empty: Inbox,
  search: SearchOff,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = 'empty',
  title,
  description,
  actionLabel,
  onAction,
  action,
}) => {
  const Icon = icons[icon];

  return (
    <Box className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon
        sx={{
          fontSize: 80,
          color: 'text.secondary',
          opacity: 0.5,
          mb: 3,
        }}
      />
      <Typography variant="h6" className="font-semibold text-gray-600 dark:text-gray-300 mb-2">
        {title}
      </Typography>
      {description && (
        <Typography variant="body2" className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {description}
        </Typography>
      )}
      {action ? (
        <Box className="mt-2">{action}</Box>
      ) : actionLabel && onAction ? (
        <Button
          variant="contained"
          onClick={onAction}
          className="mt-2 bg-gradient-to-r from-blue-500 to-purple-600"
        >
          {actionLabel}
        </Button>
      ) : null}
    </Box>
  );
};

export default EmptyState;
