import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import { Box, Paper, Tabs, Tab, Typography, CircularProgress } from '@mui/material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetUserPostsQuery } from '@services/postApi';
import { useGetUserByIdQuery } from '@services/userApi';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import { PostCard } from '@components/feed/PostCard';
import { FeedSkeleton, EmptyState } from '@components/common';

interface TabPanelProps {
  children: React.ReactNode;
  value: number;
  index: number;
}

const TabPanel: React.FC<TabPanelProps> = ({ children, value, index }) => (
  <Box hidden={value !== index} className="py-4">
    {value === index && children}
  </Box>
);

export const ProfilePage: React.FC = () => {
  const { userId } = useParams<{ userId: string }>();
  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [activeTab, setActiveTab] = useState(0);

  const isOwnProfile = !userId || userId === currentUser?._id || userId === currentUser?.id;

  // Fetch the other user's data when viewing someone else's profile
  const { data: otherUserData, isLoading: isLoadingUser } = useGetUserByIdQuery(
    userId || '',
    { skip: isOwnProfile || !userId }
  );

  const profileUser = isOwnProfile
    ? currentUser
    : (otherUserData?.data || null);

  const { data: postsData, isLoading: isLoadingPosts } = useGetUserPostsQuery(
    { userId: userId || currentUser?._id || '', page: 1, limit: 20 },
    { skip: !currentUser?._id }
  );

  const isLoading = isLoadingUser || isLoadingPosts;

  if (isLoadingUser && !isOwnProfile) {
    return (
      <Box className="flex justify-center items-center min-h-64">
        <CircularProgress />
      </Box>
    );
  }

  if (!profileUser && !isLoadingUser) {
    return <Typography className="text-center mt-8">User not found</Typography>;
  }

  const posts = postsData?.data || [];

  return (
    <Box className="max-w-4xl mx-auto">
      <Paper className="rounded-2xl overflow-hidden shadow-lg">
        <ProfileHeader user={profileUser || currentUser!} isOwnProfile={isOwnProfile} />
        
        <Box className="border-t border-gray-200 dark:border-gray-800">
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            className="border-b border-gray-200 dark:border-gray-800"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="Posts" />
            <Tab label="About" />
            <Tab label="Connections" />
            <Tab label="Activity" />
          </Tabs>

          <Box className="px-4 sm:px-8 pb-8">
            <TabPanel value={activeTab} index={0}>
              {isLoading ? (
                <FeedSkeleton />
              ) : posts.length === 0 ? (
                <EmptyState
                  icon="empty"
                  title="No posts yet"
                  description="This user hasn't posted anything yet."
                />
              ) : (
                posts.map((post) => <PostCard key={post._id || post.id} post={post} />)
              )}
            </TabPanel>

            <TabPanel value={activeTab} index={1}>
              <Typography variant="h6" className="font-semibold mb-4">
                About
              </Typography>
              <Typography variant="body1" className="text-gray-600 dark:text-gray-400">
                {profileUser?.bio || 'No bio available.'}
              </Typography>
            </TabPanel>

            <TabPanel value={activeTab} index={2}>
              <Typography variant="h6" className="font-semibold mb-4">
                Connections ({profileUser?.connections?.length || 0})
              </Typography>
              <EmptyState
                icon="empty"
                title="No connections yet"
                description="Start connecting with other members of the department!"
              />
            </TabPanel>

            <TabPanel value={activeTab} index={3}>
              <EmptyState
                icon="empty"
                title="No recent activity"
                description="Activity will appear here."
              />
            </TabPanel>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
};

export default ProfilePage;
