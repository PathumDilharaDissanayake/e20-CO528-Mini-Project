import React, { useState } from 'react';
import { useParams } from 'react-router-dom';
import {
  Box,
  Paper,
  Tabs,
  Tab,
  Typography,
  CircularProgress,
  Card,
  CardContent,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Chip,
  IconButton,
} from '@mui/material';
import {
  School,
  LocationOn,
  LinkedIn,
  GitHub,
  Language,
  Close,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { useGetUserPostsQuery } from '@services/postApi';
import { useGetUserByIdQuery, useGetMyProfileQuery, useFollowUserMutation } from '@services/userApi';
import { useUpdateProfileMutation } from '@services/authApi';
import { updateUser } from '@features/authSlice';
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
  const dispatch = useDispatch<AppDispatch>();
  const [activeTab, setActiveTab] = useState(0);
  const [editOpen, setEditOpen] = useState(false);
  const [editData, setEditData] = useState({
    bio: '',
    headline: '',
    department: '',
    location: '',
    website: '',
    skills: '',
    linkedin: '',
    github: '',
    twitter: '',
  });
  const [editSubmitting, setEditSubmitting] = useState(false);
  const [followUser] = useFollowUserMutation();
  const [updateProfile] = useUpdateProfileMutation();

  const isOwnProfile = !userId || userId === currentUser?._id || userId === currentUser?.id;

  const { data: otherUserData, isLoading: isLoadingUser } = useGetUserByIdQuery(
    userId || '',
    { skip: isOwnProfile || !userId }
  );

  // For own profile, always fetch from user-service so profile fields (bio, skills, etc.)
  // are loaded from the DB and survive page reloads (auth state only holds auth data).
  const { data: myProfileData } = useGetMyProfileQuery(undefined, {
    skip: !isOwnProfile || !currentUser,
  });

  const profileUser = isOwnProfile
    ? (myProfileData?.data ? { ...currentUser, ...myProfileData.data } : currentUser)
    : (otherUserData?.data || null);
  const profileId = profileUser?._id || profileUser?.id || '';

  const { data: postsData, isLoading: isLoadingPosts, refetch: refetchPosts } = useGetUserPostsQuery(
    { userId: userId || currentUser?._id || currentUser?.id || '', page: 1, limit: 20 },
    { skip: !currentUser?._id && !currentUser?.id }
  );

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
  const postCount = postsData?.total ?? posts.length;
  const connectionCount = Array.isArray(profileUser?.connections) ? profileUser.connections.length : 0;

  const handleOpenEdit = () => {
    setEditData({
      bio: profileUser?.bio || '',
      headline: profileUser?.headline || '',
      department: profileUser?.department || '',
      location: (profileUser as any)?.location || '',
      website: (profileUser as any)?.website || '',
      skills: Array.isArray(profileUser?.skills) ? profileUser.skills.join(', ') : '',
      linkedin: (profileUser as any)?.socialLinks?.linkedin || '',
      github: (profileUser as any)?.socialLinks?.github || '',
      twitter: (profileUser as any)?.socialLinks?.twitter || '',
    });
    setEditOpen(true);
  };

  const handleEditSave = async () => {
    setEditSubmitting(true);
    try {
      const payload: any = {
        bio: editData.bio,
        headline: editData.headline,
        department: editData.department,
        location: editData.location,
        website: editData.website,
        skills: editData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        socialLinks: {
          linkedin: editData.linkedin,
          github: editData.github,
          twitter: editData.twitter,
        },
      };
      const result = await updateProfile(payload).unwrap();
      if (result?.data) dispatch(updateUser(result.data as any));
      setEditOpen(false);
    } catch (e) {
      console.error(e);
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleConnect = async () => {
    if (!profileId) return;
    try {
      await followUser(profileId).unwrap();
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <Box className="max-w-4xl mx-auto">
      <Paper
        className="rounded-2xl overflow-hidden"
        sx={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: '16px' }}
      >
        <ProfileHeader
          user={profileUser || currentUser!}
          isOwnProfile={isOwnProfile}
          onEditClick={handleOpenEdit}
          onConnectClick={handleConnect}
        />

        {/* Quick stats bar */}
        <Box
          sx={{
            display: 'flex',
            borderTop: '1px solid',
            borderColor: 'divider',
          }}
        >
          {[
            { label: 'Posts', value: postCount },
            { label: 'Connections', value: connectionCount },
          ].map((stat, i) => (
            <Box
              key={stat.label}
              sx={{
                flex: 1,
                textAlign: 'center',
                py: 1.5,
                borderRight: i === 0 ? '1px solid' : 'none',
                borderColor: 'divider',
              }}
            >
              <Typography variant="subtitle2" fontWeight={700} color="primary.main">
                {stat.value}
              </Typography>
              <Typography variant="caption" color="text.secondary">
                {stat.label}
              </Typography>
            </Box>
          ))}
        </Box>

        <Box>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
          >
            <Tab label={`Posts (${postCount})`} />
            <Tab label="About" />
            <Tab label={`Connections (${connectionCount})`} />
            <Tab label="Activity" />
          </Tabs>

          <Box className="px-4 sm:px-6 pb-8">
            {/* Posts Tab */}
            <TabPanel value={activeTab} index={0}>
              {isLoadingPosts ? (
                <FeedSkeleton count={2} />
              ) : posts.length === 0 ? (
                <EmptyState
                  icon="empty"
                  title="No posts yet"
                  description={
                    isOwnProfile
                      ? "You haven't posted anything yet. Share something with your community!"
                      : "This user hasn't posted anything yet."
                  }
                />
              ) : (
                posts.map((post) => (
                  <PostCard
                    key={post._id || post.id}
                    post={post}
                    onPostUpdated={() => refetchPosts()}
                  />
                ))
              )}
            </TabPanel>

            {/* About Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ maxWidth: 600, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>
                {profileUser?.bio && (
                  <Card variant="outlined" sx={{ borderRadius: '12px' }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main' }}>
                        Bio
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.8, color: 'text.secondary' }}>
                        {profileUser.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                <Card variant="outlined" sx={{ borderRadius: '12px' }}>
                  <CardContent>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'primary.main' }}>
                      Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
                      {profileUser?.department && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School sx={{ fontSize: 18, color: 'text.disabled' }} />
                          <Typography variant="body2">{profileUser.department}</Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LocationOn sx={{ fontSize: 18, color: 'text.disabled' }} />
                          <Typography variant="body2">{(profileUser as any).location}</Typography>
                        </Box>
                      )}
                      {profileUser?.graduationYear && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <School sx={{ fontSize: 18, color: 'text.disabled' }} />
                          <Typography variant="body2">Class of {profileUser.graduationYear}</Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Language sx={{ fontSize: 18, color: 'text.disabled' }} />
                          <Typography
                            variant="body2"
                            component="a"
                            href={(profileUser as any).website}
                            target="_blank"
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            {(profileUser as any).website}
                          </Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.socialLinks?.linkedin && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <LinkedIn sx={{ fontSize: 18, color: '#0077b5' }} />
                          <Typography
                            variant="body2"
                            component="a"
                            href={(profileUser as any).socialLinks.linkedin}
                            target="_blank"
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            LinkedIn Profile
                          </Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.socialLinks?.github && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <GitHub sx={{ fontSize: 18, color: 'text.primary' }} />
                          <Typography
                            variant="body2"
                            component="a"
                            href={(profileUser as any).socialLinks.github}
                            target="_blank"
                            sx={{ color: 'primary.main', textDecoration: 'none' }}
                          >
                            GitHub Profile
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {Array.isArray(profileUser?.skills) && profileUser.skills.length > 0 && (
                  <Card variant="outlined" sx={{ borderRadius: '12px' }}>
                    <CardContent>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: 'primary.main' }}>
                        Skills
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                        {profileUser.skills.map((skill, i) => (
                          <Chip
                            key={i}
                            label={skill}
                            size="small"
                            sx={{
                              fontWeight: 600,
                              fontSize: '0.75rem',
                              background: (t) =>
                                t.palette.mode === 'dark'
                                  ? 'rgba(22,101,52,0.15)'
                                  : 'rgba(22,101,52,0.1)',
                              color: 'primary.main',
                              border: '1px solid',
                              borderColor: 'primary.light',
                            }}
                          />
                        ))}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {!profileUser?.bio && !profileUser?.department && (
                  <EmptyState
                    icon="empty"
                    title="No info added yet"
                    description={
                      isOwnProfile
                        ? 'Click "Edit Profile" to add your details.'
                        : 'This user has not added any information yet.'
                    }
                  />
                )}
              </Box>
            </TabPanel>

            {/* Connections Tab */}
            <TabPanel value={activeTab} index={2}>
              <EmptyState
                icon="empty"
                title={connectionCount === 0 ? 'No connections yet' : `${connectionCount} connections`}
                description="Start connecting with other members of the department!"
              />
            </TabPanel>

            {/* Activity Tab */}
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

      {/* Edit Profile Dialog */}
      <Dialog open={editOpen} onClose={() => setEditOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle
          sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', pb: 0 }}
        >
          <Typography variant="h6" fontWeight={700}>Edit Profile</Typography>
          <IconButton size="small" onClick={() => setEditOpen(false)}>
            <Close fontSize="small" />
          </IconButton>
        </DialogTitle>
        <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
          <TextField
            label="Headline"
            placeholder="e.g. Final Year CS Student | ML Enthusiast"
            fullWidth
            size="small"
            value={editData.headline}
            onChange={(e) => setEditData((d) => ({ ...d, headline: e.target.value }))}
          />
          <TextField
            label="Bio"
            placeholder="Tell people about yourself…"
            fullWidth
            multiline
            rows={3}
            value={editData.bio}
            onChange={(e) => setEditData((d) => ({ ...d, bio: e.target.value }))}
          />
          <TextField
            label="Department"
            placeholder="e.g. Computer Science"
            fullWidth
            size="small"
            value={editData.department}
            onChange={(e) => setEditData((d) => ({ ...d, department: e.target.value }))}
          />
          <TextField
            label="Location"
            placeholder="e.g. Colombo, Sri Lanka"
            fullWidth
            size="small"
            value={editData.location}
            onChange={(e) => setEditData((d) => ({ ...d, location: e.target.value }))}
          />
          <TextField
            label="Skills (comma-separated)"
            placeholder="e.g. Python, React, Machine Learning"
            fullWidth
            size="small"
            value={editData.skills}
            onChange={(e) => setEditData((d) => ({ ...d, skills: e.target.value }))}
          />
          <TextField
            label="Website"
            placeholder="https://yoursite.com"
            fullWidth
            size="small"
            value={editData.website}
            onChange={(e) => setEditData((d) => ({ ...d, website: e.target.value }))}
          />
          <TextField
            label="LinkedIn URL"
            placeholder="https://linkedin.com/in/…"
            fullWidth
            size="small"
            value={editData.linkedin}
            onChange={(e) => setEditData((d) => ({ ...d, linkedin: e.target.value }))}
            InputProps={{ startAdornment: <LinkedIn sx={{ color: '#0077b5', mr: 1, fontSize: 18 }} /> }}
          />
          <TextField
            label="GitHub URL"
            placeholder="https://github.com/…"
            fullWidth
            size="small"
            value={editData.github}
            onChange={(e) => setEditData((d) => ({ ...d, github: e.target.value }))}
            InputProps={{ startAdornment: <GitHub sx={{ color: 'text.secondary', mr: 1, fontSize: 18 }} /> }}
          />
        </DialogContent>
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={() => setEditOpen(false)} disabled={editSubmitting}>Cancel</Button>
          <Button variant="contained" onClick={handleEditSave} disabled={editSubmitting}>
            {editSubmitting ? 'Saving…' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
