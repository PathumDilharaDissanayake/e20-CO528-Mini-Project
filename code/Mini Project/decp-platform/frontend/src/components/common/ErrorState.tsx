import React from 'react';
import { Box, Typography, Paper } from '@mui/material';
import { ErrorOutline } from '@mui/icons-material';

interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: React.ReactNode;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An error occurred while loading the data.',
  action,
}) => {
  return (
    <Paper className="p-8 rounded-2xl text-center">
      <Box className="flex flex-col items-center justify-center">
        <ErrorOutline
          sx={{
            fontSize: 64,
            color: 'error.main',
            opacity: 0.7,
            mb: 3,
          }}
        />
        <Typography variant="h6" className="font-semibold text-gray-700 dark:text-gray-300 mb-2">
          {title}
        </Typography>
        <Typography variant="body2" className="text-gray-500 dark:text-gray-400 max-w-md mb-4">
          {message}
        </Typography>
        {action && <Box className="mt-2">{action}</Box>}
      </Box>
    </Paper>
  );
};

export default ErrorState;
