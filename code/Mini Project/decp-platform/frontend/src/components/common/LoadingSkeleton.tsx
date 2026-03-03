import React from 'react';
import { Skeleton, Box, Card, CardContent, Stack } from '@mui/material';

export const PostCardSkeleton: React.FC = () => (
  <Card className="mb-4">
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center" className="mb-3">
        <Skeleton variant="circular" width={48} height={48} />
        <Box className="flex-1">
          <Skeleton variant="text" width="40%" height={24} />
          <Skeleton variant="text" width="25%" height={16} />
        </Box>
      </Stack>
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="100%" height={20} />
      <Skeleton variant="text" width="80%" height={20} />
      <Box className="mt-3">
        <Skeleton variant="rectangular" width="100%" height={200} sx={{ borderRadius: 2 }} />
      </Box>
      <Stack direction="row" spacing={3} className="mt-3">
        <Skeleton variant="text" width={60} height={32} />
        <Skeleton variant="text" width={60} height={32} />
        <Skeleton variant="text" width={60} height={32} />
      </Stack>
    </CardContent>
  </Card>
);

export const JobCardSkeleton: React.FC = () => (
  <Card className="mb-3">
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="flex-start">
        <Skeleton variant="rectangular" width={60} height={60} sx={{ borderRadius: 1 }} />
        <Box className="flex-1">
          <Skeleton variant="text" width="60%" height={28} />
          <Skeleton variant="text" width="40%" height={20} />
          <Skeleton variant="text" width="30%" height={16} />
        </Box>
      </Stack>
      <Box className="mt-2">
        <Skeleton variant="text" width="100%" height={16} />
        <Skeleton variant="text" width="100%" height={16} />
      </Box>
    </CardContent>
  </Card>
);

export const EventCardSkeleton: React.FC = () => (
  <Card className="mb-3">
    <Skeleton variant="rectangular" width="100%" height={140} />
    <CardContent>
      <Skeleton variant="text" width="70%" height={24} />
      <Skeleton variant="text" width="50%" height={16} />
      <Skeleton variant="text" width="40%" height={16} />
    </CardContent>
  </Card>
);

export const UserCardSkeleton: React.FC = () => (
  <Card className="mb-3">
    <CardContent>
      <Stack direction="row" spacing={2} alignItems="center">
        <Skeleton variant="circular" width={48} height={48} />
        <Box className="flex-1">
          <Skeleton variant="text" width="50%" height={20} />
          <Skeleton variant="text" width="35%" height={16} />
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

export const ChatSkeleton: React.FC = () => (
  <Box className="p-4 space-y-4">
    {[...Array(6)].map((_, i) => (
      <Stack
        key={i}
        direction="row"
        spacing={2}
        justifyContent={i % 2 === 0 ? 'flex-start' : 'flex-end'}
      >
        {i % 2 === 0 && <Skeleton variant="circular" width={32} height={32} />}
        <Skeleton
          variant="rectangular"
          width={`${Math.random() * 30 + 20}%`}
          height={40}
          sx={{ borderRadius: 2 }}
        />
      </Stack>
    ))}
  </Box>
);

interface FeedSkeletonProps {
  count?: number;
}

export const FeedSkeleton: React.FC<FeedSkeletonProps> = ({ count = 3 }) => (
  <Box className="space-y-4">
    {Array.from({ length: count }).map((_, index) => (
      <PostCardSkeleton key={`feed-skeleton-${index}`} />
    ))}
  </Box>
);

export const ProfileSkeleton: React.FC = () => (
  <Box>
    <Skeleton variant="rectangular" width="100%" height={200} />
    <Box className="px-4 -mt-16">
      <Skeleton
        variant="circular"
        width={128}
        height={128}
        sx={{ border: '4px solid white' }}
      />
    </Box>
    <Box className="p-4">
      <Skeleton variant="text" width="40%" height={32} />
      <Skeleton variant="text" width="30%" height={20} />
      <Skeleton variant="text" width="50%" height={16} />
    </Box>
  </Box>
);

export default {
  PostCardSkeleton,
  JobCardSkeleton,
  EventCardSkeleton,
  UserCardSkeleton,
  ChatSkeleton,
  FeedSkeleton,
  ProfileSkeleton,
};
