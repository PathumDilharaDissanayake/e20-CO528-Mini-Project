import React from 'react';
import { Box, Skeleton, Card, CardContent, CardActions, Divider } from '@mui/material';

interface PostCardSkeletonProps {
  count?: number;
}

const PostCardSkeleton: React.FC<PostCardSkeletonProps> = ({ count = 1 }) => {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <Card
          key={i}
          sx={{
            borderRadius: '16px',
            mb: 2,
            boxShadow: '0 2px 12px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >
          <CardContent>
            {/* Author row */}
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 2 }}>
              <Skeleton variant="circular" width={44} height={44} animation="wave" />
              <Box sx={{ flex: 1 }}>
                <Skeleton variant="text" width="40%" height={20} animation="wave" />
                <Skeleton variant="text" width="25%" height={16} animation="wave" />
              </Box>
            </Box>
            {/* Content lines */}
            <Skeleton variant="text" width="100%" animation="wave" />
            <Skeleton variant="text" width="92%" animation="wave" />
            <Skeleton variant="text" width="75%" animation="wave" />
            {/* Media area (every 3rd card) */}
            {i % 3 === 0 && (
              <Skeleton
                variant="rectangular"
                height={200}
                sx={{ mt: 1.5, borderRadius: '12px' }}
                animation="wave"
              />
            )}
          </CardContent>
          <Divider />
          <CardActions sx={{ px: 2 }}>
            <Skeleton variant="text" width={80} height={32} animation="wave" />
            <Skeleton variant="text" width={80} height={32} animation="wave" />
            <Skeleton variant="text" width={80} height={32} animation="wave" sx={{ ml: 'auto' }} />
          </CardActions>
        </Card>
      ))}
    </>
  );
};

export default PostCardSkeleton;
