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
  Avatar,
  Divider,
  Switch,
  Tooltip,
} from '@mui/material';
import {
  School,
  LocationOn,
  LinkedIn,
  GitHub,
  Language,
  Close,
  Work,
  Add,
  EmojiEvents,
} from '@mui/icons-material';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '@store';
import { useGetUserPostsQuery } from '@services/postApi';
import { useGetUserByIdQuery, useGetMyProfileQuery, useSendConnectionRequestMutation, useGetConnectionRequestsQuery, useAcceptConnectionMutation, useDeclineConnectionMutation, useEndorseSkillMutation, useUpdateMyProfileMutation, useGetConnectionsQuery } from '@services/userApi';
import { useUpdateProfileMutation } from '@services/authApi';
import { useGetEventsQuery, useGetAttendingEventsQuery } from '@services/eventApi';
import { updateUser } from '@features/authSlice';
import { ProfileHeader } from '@components/profile/ProfileHeader';
import PostCard from '@components/feed/PostCard';
import { FeedSkeleton, EmptyState, EventCardSkeleton } from '@components/common';
import { Event as EventIcon } from '@mui/icons-material';
import { ExperienceItem, EducationItem, CertificationItem } from '@types';

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

// Skill colour palette — cycles through emerald + accent hues
const SKILL_PALETTE = [
  { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.3)' },
  { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.3)' },
  { bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.3)' },
  { bg: 'rgba(20,184,166,0.12)', color: '#0d9488', border: 'rgba(20,184,166,0.3)' },
  { bg: 'rgba(168,85,247,0.12)', color: '#9333ea', border: 'rgba(168,85,247,0.3)' },
  { bg: 'rgba(59,130,246,0.12)', color: '#2563eb', border: 'rgba(59,130,246,0.3)' },
];

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
  const [editError, setEditError] = useState('');

  // Experience
  const [addExpOpen, setAddExpOpen] = useState(false);
  const [expForm, setExpForm] = useState({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });

  // Education
  const [addEduOpen, setAddEduOpen] = useState(false);
  const [eduForm, setEduForm] = useState({ school: '', degree: '', field: '', startYear: '', endYear: '', grade: '' });

  // Certifications
  const [addCertOpen, setAddCertOpen] = useState(false);
  const [certForm, setCertForm] = useState({ name: '', issuer: '', issueDate: '', url: '' });

  const [sendConnectionRequest] = useSendConnectionRequestMutation();
  const [acceptConnectionMutation] = useAcceptConnectionMutation();
  const [declineConnectionMutation] = useDeclineConnectionMutation();
  const [updateProfile] = useUpdateProfileMutation();
  const [updateMyProfile] = useUpdateMyProfileMutation();
  const [endorseSkillMutation] = useEndorseSkillMutation();

  const isOwnProfile = !userId || userId === currentUser?._id || userId === currentUser?.id;
  const resolvedProfileId = userId || currentUser?._id || currentUser?.id || '';

  // Fetch incoming connection requests (only meaningful on own profile)
  const { data: connectionsData, refetch: refetchConnections } = useGetConnectionsQuery(undefined, {
    skip: !isOwnProfile,
  });

  const { data: connectionRequestsData, refetch: refetchRequests } = useGetConnectionRequestsQuery(undefined, {
    skip: !isOwnProfile || !currentUser,
    pollingInterval: 30000,
  });

  const { data: otherUserData, isLoading: isLoadingUser, refetch: refetchProfile } = useGetUserByIdQuery(
    userId || '',
    { skip: isOwnProfile || !userId }
  );

  // For own profile, always fetch from user-service so profile fields (bio, skills, etc.)
  // are loaded from the DB and survive page reloads (auth state only holds auth data).
  const { data: myProfileData } = useGetMyProfileQuery(undefined, {
    skip: !isOwnProfile || !currentUser,
  });

  // Get the other user's profile data - check multiple possible response structures
  const otherUserRaw = otherUserData?.data as any;
  const otherUser = otherUserRaw?.profile || otherUserRaw?.user || otherUserRaw || null;

  // For other users, create a robust profile object with fallbacks
  const otherUserProfile = (otherUser && (otherUser.firstName || otherUser.lastName || otherUser.email)) ? {
    _id: otherUser.userId || otherUser._id || otherUser.id || '',
    id: otherUser.id || otherUser._id || otherUser.userId || '',
    firstName: otherUser.firstName || 'User',
    lastName: otherUser.lastName || '',
    role: otherUser.role || 'student',
    avatar: otherUser.avatar || otherUser.profilePicture,
    bio: otherUser.bio,
    headline: otherUser.headline,
    email: otherUser.email,
    skills: otherUser.skills || [],
    ...otherUser
  } : null;

  const profileUser = isOwnProfile
    ? (myProfileData?.data ? { ...currentUser, ...myProfileData.data } : currentUser)
    : (otherUserProfile || { firstName: 'Unknown', lastName: 'User', role: 'student', _id: userId });
  const profileId = profileUser?._id || profileUser?.id || '';

  const { data: postsData, isLoading: isLoadingPosts, refetch: refetchPosts } = useGetUserPostsQuery(
    { userId: userId || currentUser?._id || currentUser?.id || '', page: 1, limit: 20 },
    { skip: !currentUser?._id && !currentUser?.id }
  );

  // Events: for own profile fetch attending events; for other profiles fetch all and filter by creator
  const { data: attendingEventsData, isLoading: isLoadingAttendingEvents } = useGetAttendingEventsQuery(
    {},
    { skip: !isOwnProfile || !currentUser }
  );
  const { data: allEventsData, isLoading: isLoadingAllEvents } = useGetEventsQuery(
    {},
    { skip: isOwnProfile }
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
  const connectionCount = connectionsData?.total || 0;

  // Cast for extended profile fields
  const profile = profileUser as any;

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
    setEditError('');
    try {
      const ensureHttps = (url: string) => {
        if (!url) return '';
        if (url.startsWith('http://') || url.startsWith('https://')) return url;
        return `https://${url}`;
      };
      const payload: any = {
        bio: editData.bio,
        headline: editData.headline,
        department: editData.department,
        location: editData.location,
        website: ensureHttps(editData.website),
        skills: editData.skills.split(',').map((s) => s.trim()).filter(Boolean),
        socialLinks: {
          linkedin: ensureHttps(editData.linkedin),
          github: ensureHttps(editData.github),
          twitter: ensureHttps(editData.twitter),
        },
      };
      // Use updateMyProfile (userApi) as the primary path — it invalidates the User cache
      // and goes through RTK baseQuery which injects the auth header automatically.
      const result = await updateMyProfile(payload).unwrap();
      const updatedProfile = result?.data || result;
      if (updatedProfile) dispatch(updateUser(updatedProfile as any));
      setEditOpen(false);
    } catch (e: any) {
      console.error(e);
      setEditError(e?.data?.message || e?.message || 'Failed to update profile. Please try again.');
    } finally {
      setEditSubmitting(false);
    }
  };

  const handleConnect = async () => {
    if (!profileId) return;
    try {
      await sendConnectionRequest(profileId).unwrap();
      if (!isOwnProfile) refetchProfile();
    } catch (e) {
      console.error(e);
    }
  };

  // Experience handlers
  const handleSaveExperience = async () => {
    const newExp: ExperienceItem = { ...expForm, id: Date.now().toString() };
    const updated = [...(profile?.experience || []), newExp];
    try {
      await updateMyProfile({ experience: updated }).unwrap();
      setAddExpOpen(false);
      setExpForm({ title: '', company: '', location: '', startDate: '', endDate: '', current: false, description: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteExperience = async (expId: string) => {
    const updated = (profile?.experience || []).filter((e: ExperienceItem) => e.id !== expId);
    try { await updateMyProfile({ experience: updated }).unwrap(); } catch (e) { console.error(e); }
  };

  // Education handlers
  const handleSaveEducation = async () => {
    const newEdu: EducationItem = {
      id: Date.now().toString(),
      school: eduForm.school,
      degree: eduForm.degree,
      field: eduForm.field,
      startYear: parseInt(eduForm.startYear) || new Date().getFullYear(),
      endYear: eduForm.endYear ? parseInt(eduForm.endYear) : undefined,
      grade: eduForm.grade || undefined,
    };
    const updated = [...(profile?.education || []), newEdu];
    try {
      await updateMyProfile({ education: updated }).unwrap();
      setAddEduOpen(false);
      setEduForm({ school: '', degree: '', field: '', startYear: '', endYear: '', grade: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteEducation = async (eduId: string) => {
    const updated = (profile?.education || []).filter((e: EducationItem) => e.id !== eduId);
    try { await updateMyProfile({ education: updated }).unwrap(); } catch (e) { console.error(e); }
  };

  // Certification handlers
  const handleSaveCert = async () => {
    const newCert: CertificationItem = { ...certForm, id: Date.now().toString() };
    const updated = [...(profile?.certifications || []), newCert];
    try {
      await updateMyProfile({ certifications: updated }).unwrap();
      setAddCertOpen(false);
      setCertForm({ name: '', issuer: '', issueDate: '', url: '' });
    } catch (e) { console.error(e); }
  };

  const handleDeleteCert = async (certId: string) => {
    const updated = (profile?.certifications || []).filter((c: CertificationItem) => c.id !== certId);
    try { await updateMyProfile({ certifications: updated }).unwrap(); } catch (e) { console.error(e); }
  };

  // Open-to-work handler
  const handleOpenToWorkToggle = async (checked: boolean) => {
    try { await updateMyProfile({ openToWork: checked }).unwrap(); } catch (e) { console.error(e); }
  };

  // Skill endorsement
  const handleEndorseSkill = async (skill: string) => {
    try { await endorseSkillMutation({ userId: resolvedProfileId, skill }).unwrap(); } catch (e) { console.error('Endorse failed', e); }
  };

  // Helper for edu/exp IDs
  const getEduId = (edu: any, i: number) => edu.id || `edu-${i}`;
  const getExpId = (exp: any, i: number) => exp.id || `exp-${i}`;

  return (
    <Box className="max-w-4xl mx-auto">
      <Paper
        className="rounded-2xl overflow-hidden"
        sx={{ boxShadow: '0 4px 24px rgba(0,0,0,0.08)', borderRadius: '16px' }}
      >
        <ProfileHeader
          user={profileUser || currentUser!}
          isOwnProfile={isOwnProfile}
          profileId={profileId}
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
          {/* Styled tab navigation */}
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            variant="scrollable"
            scrollButtons="auto"
            sx={{
              borderBottom: '1px solid',
              borderColor: 'divider',
              '& .MuiTabs-indicator': {
                background: 'linear-gradient(90deg, #10b981, #059669)',
                height: 3,
                borderRadius: '3px 3px 0 0',
              },
              '& .MuiTab-root': {
                textTransform: 'none',
                fontWeight: 600,
                fontSize: '0.875rem',
                letterSpacing: 0,
                minHeight: 48,
                transition: 'color 0.2s, background-color 0.2s',
                '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                '&.Mui-selected': { fontWeight: 700, color: 'primary.main' },
              },
            }}
          >
            <Tab label={`Posts (${postCount})`} />
            <Tab label="About" />
            <Tab label={`Connections (${connectionCount})`} />
            <Tab label="Events" />
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
                    onPostUpdate={() => refetchPosts()}
                  />
                ))
              )}
            </TabPanel>

            {/* About Tab */}
            <TabPanel value={activeTab} index={1}>
              <Box sx={{ maxWidth: 640, mx: 'auto', display: 'flex', flexDirection: 'column', gap: 2.5 }}>

                {/* Bio */}
                {profileUser?.bio && (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      borderColor: 'divider',
                      '&::before': {
                        content: '""',
                        display: 'block',
                        height: 3,
                        background: 'linear-gradient(90deg, #10b981, #059669, #14b8a6)',
                      },
                    }}
                  >
                    <CardContent sx={{ pt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1, color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#10b981,#059669)', flexShrink: 0 }} />
                        About
                      </Typography>
                      <Typography variant="body2" sx={{ lineHeight: 1.9, color: 'text.secondary', whiteSpace: 'pre-wrap' }}>
                        {profileUser.bio}
                      </Typography>
                    </CardContent>
                  </Card>
                )}

                {/* Details */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    borderColor: 'divider',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      height: 3,
                      background: 'linear-gradient(90deg, #6366f1, #818cf8)',
                    },
                  }}
                >
                  <CardContent sx={{ pt: 2 }}>
                    <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#6366f1', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                      <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#6366f1,#818cf8)', flexShrink: 0 }} />
                      Details
                    </Typography>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.25 }}>
                      {profileUser?.department && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(99,102,241,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <School sx={{ fontSize: 15, color: '#6366f1' }} />
                          </Box>
                          <Typography variant="body2">{profileUser.department}</Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.location && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(16,185,129,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <LocationOn sx={{ fontSize: 15, color: '#10b981' }} />
                          </Box>
                          <Typography variant="body2">{(profileUser as any).location}</Typography>
                        </Box>
                      )}
                      {profileUser?.graduationYear && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(99,102,241,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <School sx={{ fontSize: 15, color: '#6366f1' }} />
                          </Box>
                          <Typography variant="body2">Class of {profileUser.graduationYear}</Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.website && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(20,184,166,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <Language sx={{ fontSize: 15, color: '#14b8a6' }} />
                          </Box>
                          <Typography variant="body2" component="a" href={(profileUser as any).website} target="_blank" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            {(profileUser as any).website}
                          </Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.socialLinks?.linkedin && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: 'rgba(0,119,181,0.1)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <LinkedIn sx={{ fontSize: 15, color: '#0077b5' }} />
                          </Box>
                          <Typography variant="body2" component="a" href={(profileUser as any).socialLinks.linkedin} target="_blank" sx={{ color: '#0077b5', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            LinkedIn Profile
                          </Typography>
                        </Box>
                      )}
                      {(profileUser as any)?.socialLinks?.github && (
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                          <Box sx={{
                            width: 28, height: 28, borderRadius: '8px',
                            background: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <GitHub sx={{ fontSize: 15, color: 'text.primary' }} />
                          </Box>
                          <Typography variant="body2" component="a" href={(profileUser as any).socialLinks.github} target="_blank" sx={{ color: 'primary.main', textDecoration: 'none', '&:hover': { textDecoration: 'underline' } }}>
                            GitHub Profile
                          </Typography>
                        </Box>
                      )}
                    </Box>
                  </CardContent>
                </Card>

                {/* Skills with endorsements */}
                {Array.isArray(profileUser?.skills) && profileUser.skills.length > 0 && (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      borderColor: 'divider',
                      '&::before': {
                        content: '""',
                        display: 'block',
                        height: 3,
                        background: 'linear-gradient(90deg, #14b8a6, #0d9488)',
                      },
                    }}
                  >
                    <CardContent sx={{ pt: 2 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1.5, color: '#0d9488', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#14b8a6,#0d9488)', flexShrink: 0 }} />
                        Skills & Endorsements
                      </Typography>
                      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 0.5 }}>
                        {profileUser.skills.map((skill, i) => {
                          const endorsements = (profile?.endorsements || {}) as Record<string, string[]>;
                          const endorserIds: string[] = endorsements[skill] || [];
                          const endorseCount = endorserIds.length;
                          const alreadyEndorsed = endorserIds.includes(currentUser?._id || currentUser?.id || '');
                          const palette = SKILL_PALETTE[i % SKILL_PALETTE.length];
                          return (
                            <Box
                              key={i}
                              sx={{
                                display: 'flex', alignItems: 'center', gap: 0.75,
                                px: 1.25, py: 0.5,
                                borderRadius: '20px',
                                background: palette.bg,
                                border: `1px solid ${palette.border}`,
                                transition: 'all 0.2s ease',
                                '&:hover': { transform: 'translateY(-1px)', boxShadow: `0 3px 10px ${palette.border}` },
                              }}
                            >
                              <Typography variant="caption" sx={{ fontWeight: 700, color: palette.color, fontSize: '0.75rem' }}>
                                {skill}
                              </Typography>
                              {endorseCount > 0 && (
                                <Chip
                                  label={endorseCount}
                                  size="small"
                                  sx={{
                                    height: 16, minWidth: 22, fontSize: '0.6rem', fontWeight: 700,
                                    background: palette.bg, color: palette.color,
                                    border: `1px solid ${palette.border}`,
                                  }}
                                />
                              )}
                              {!isOwnProfile && currentUser && (
                                <Tooltip title={alreadyEndorsed ? 'Remove endorsement' : 'Endorse this skill'}>
                                  <Button
                                    size="small"
                                    variant={alreadyEndorsed ? 'contained' : 'text'}
                                    onClick={() => handleEndorseSkill(skill)}
                                    sx={{
                                      borderRadius: '12px', fontSize: '0.65rem', py: 0, px: 0.75,
                                      minWidth: 0, textTransform: 'none', fontWeight: 700,
                                      color: alreadyEndorsed ? '#fff' : palette.color,
                                      background: alreadyEndorsed ? palette.color : 'transparent',
                                      '&:hover': { background: alreadyEndorsed ? palette.color : `${palette.bg}` },
                                    }}
                                  >
                                    {alreadyEndorsed ? '✓' : '+'}
                                  </Button>
                                </Tooltip>
                              )}
                            </Box>
                          );
                        })}
                      </Box>
                    </CardContent>
                  </Card>
                )}

                {/* Experience */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    borderColor: 'divider',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      height: 3,
                      background: 'linear-gradient(90deg, #166534, #15803d)',
                    },
                  }}
                >
                  <CardContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: 'primary.main', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#166534,#15803d)', flexShrink: 0 }} />
                        <Work sx={{ fontSize: 16 }} /> Experience
                      </Typography>
                      {isOwnProfile && (
                        <Button
                          size="small"
                          startIcon={<Add sx={{ fontSize: '16px !important' }} />}
                          onClick={() => setAddExpOpen(true)}
                          sx={{
                            borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            px: 1.5, py: 0.4, textTransform: 'none',
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.12))',
                            color: 'primary.main',
                            border: '1px solid',
                            borderColor: 'primary.light',
                            '&:hover': { background: 'linear-gradient(135deg, rgba(16,185,129,0.22), rgba(5,150,105,0.22))' },
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                    {(profile?.experience || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {isOwnProfile ? 'Add your work experience to showcase your career journey.' : 'No experience added yet.'}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {(profile?.experience || []).map((exp: any, i: number, arr: any[]) => (
                          <Box
                            key={getExpId(exp, i)}
                            sx={{
                              display: 'flex', gap: 1.5, position: 'relative',
                              pl: 2,
                              pb: i < arr.length - 1 ? 2.5 : 0,
                              // Timeline left border
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 8,
                                bottom: i < arr.length - 1 ? 0 : '100%',
                                width: 2,
                                background: i < arr.length - 1 ? 'linear-gradient(180deg,#10b981,rgba(16,185,129,0.15))' : 'transparent',
                                borderRadius: '2px',
                              },
                              // Timeline dot
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: -4,
                                top: 10,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                border: '2px solid',
                                borderColor: 'background.paper',
                                boxShadow: '0 0 0 1.5px rgba(16,185,129,0.4)',
                              },
                            }}
                          >
                            <Box sx={{ flex: 1, pl: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25, mb: 0.25 }}>
                                <Box sx={{
                                  width: 36, height: 36, borderRadius: '10px',
                                  background: 'linear-gradient(135deg,#166534,#15803d)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  boxShadow: '0 3px 8px rgba(22,101,52,0.3)',
                                }}>
                                  <Work sx={{ color: 'white', fontSize: 16 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight={700}>{exp.title}</Typography>
                                  <Typography variant="body2" color="text.secondary">{exp.company}{exp.location ? ` · ${exp.location}` : ''}</Typography>
                                  <Typography variant="caption" color="text.disabled">
                                    {exp.startDate ? new Date(exp.startDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}{' '}
                                    — {exp.current ? 'Present' : exp.endDate ? new Date(exp.endDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : ''}
                                  </Typography>
                                  {exp.description && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 0.5, lineHeight: 1.6 }}>
                                      {exp.description}
                                    </Typography>
                                  )}
                                </Box>
                              </Box>
                            </Box>
                            {isOwnProfile && (
                              <IconButton size="small" onClick={() => handleDeleteExperience(getExpId(exp, i))} sx={{ color: 'error.main', alignSelf: 'flex-start', flexShrink: 0, mt: 0.25 }}>
                                <Close fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Education */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    borderColor: 'divider',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      height: 3,
                      background: 'linear-gradient(90deg, #1d4ed8, #3b82f6)',
                    },
                  }}
                >
                  <CardContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#2563eb', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#1d4ed8,#3b82f6)', flexShrink: 0 }} />
                        <School sx={{ fontSize: 16 }} /> Education
                      </Typography>
                      {isOwnProfile && (
                        <Button
                          size="small"
                          startIcon={<Add sx={{ fontSize: '16px !important' }} />}
                          onClick={() => setAddEduOpen(true)}
                          sx={{
                            borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            px: 1.5, py: 0.4, textTransform: 'none',
                            background: 'rgba(37,99,235,0.1)',
                            color: '#2563eb',
                            border: '1px solid rgba(37,99,235,0.25)',
                            '&:hover': { background: 'rgba(37,99,235,0.18)' },
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                    {(profile?.education || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {isOwnProfile ? 'Add your educational background.' : 'No education added yet.'}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                        {(profile?.education || []).map((edu: any, i: number, arr: any[]) => (
                          <Box
                            key={getEduId(edu, i)}
                            sx={{
                              display: 'flex', gap: 1.5, position: 'relative',
                              pl: 2,
                              pb: i < arr.length - 1 ? 2.5 : 0,
                              '&::before': {
                                content: '""',
                                position: 'absolute',
                                left: 0,
                                top: 8,
                                bottom: i < arr.length - 1 ? 0 : '100%',
                                width: 2,
                                background: i < arr.length - 1 ? 'linear-gradient(180deg,#3b82f6,rgba(59,130,246,0.15))' : 'transparent',
                                borderRadius: '2px',
                              },
                              '&::after': {
                                content: '""',
                                position: 'absolute',
                                left: -4,
                                top: 10,
                                width: 10,
                                height: 10,
                                borderRadius: '50%',
                                background: 'linear-gradient(135deg,#3b82f6,#1d4ed8)',
                                border: '2px solid',
                                borderColor: 'background.paper',
                                boxShadow: '0 0 0 1.5px rgba(59,130,246,0.4)',
                              },
                            }}
                          >
                            <Box sx={{ flex: 1, pl: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.25 }}>
                                <Box sx={{
                                  width: 36, height: 36, borderRadius: '10px',
                                  background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)',
                                  display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                                  boxShadow: '0 3px 8px rgba(29,78,216,0.3)',
                                }}>
                                  <School sx={{ color: 'white', fontSize: 16 }} />
                                </Box>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight={700}>{edu.school}</Typography>
                                  <Typography variant="body2" color="text.secondary">{edu.degree}{edu.field ? ` · ${edu.field}` : ''}</Typography>
                                  <Typography variant="caption" color="text.disabled">
                                    {edu.startYear} — {edu.endYear || 'Present'}
                                    {edu.grade ? ` · Grade: ${edu.grade}` : ''}
                                  </Typography>
                                </Box>
                              </Box>
                            </Box>
                            {isOwnProfile && (
                              <IconButton size="small" onClick={() => handleDeleteEducation(getEduId(edu, i))} sx={{ color: 'error.main', alignSelf: 'flex-start', flexShrink: 0 }}>
                                <Close fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Certifications */}
                <Card
                  variant="outlined"
                  sx={{
                    borderRadius: '14px',
                    overflow: 'hidden',
                    borderColor: 'divider',
                    '&::before': {
                      content: '""',
                      display: 'block',
                      height: 3,
                      background: 'linear-gradient(90deg, #b45309, #f59e0b)',
                    },
                  }}
                >
                  <CardContent sx={{ pt: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#d97706', display: 'flex', alignItems: 'center', gap: 0.75 }}>
                        <Box sx={{ width: 3, height: 14, borderRadius: '2px', background: 'linear-gradient(180deg,#b45309,#f59e0b)', flexShrink: 0 }} />
                        <EmojiEvents sx={{ fontSize: 16 }} /> Certifications
                      </Typography>
                      {isOwnProfile && (
                        <Button
                          size="small"
                          startIcon={<Add sx={{ fontSize: '16px !important' }} />}
                          onClick={() => setAddCertOpen(true)}
                          sx={{
                            borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                            px: 1.5, py: 0.4, textTransform: 'none',
                            background: 'rgba(245,158,11,0.1)',
                            color: '#d97706',
                            border: '1px solid rgba(245,158,11,0.25)',
                            '&:hover': { background: 'rgba(245,158,11,0.18)' },
                          }}
                        >
                          Add
                        </Button>
                      )}
                    </Box>
                    {(profile?.certifications || []).length === 0 ? (
                      <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                        {isOwnProfile ? 'Add certifications and credentials.' : 'No certifications added yet.'}
                      </Typography>
                    ) : (
                      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                        {(profile?.certifications || []).map((cert: any, i: number) => (
                          <Box
                            key={cert.id || i}
                            sx={{
                              display: 'flex', gap: 1.5, alignItems: 'flex-start',
                              p: 1.25, borderRadius: '12px',
                              background: 'rgba(245,158,11,0.05)',
                              border: '1px solid rgba(245,158,11,0.15)',
                              transition: 'all 0.2s ease',
                              '&:hover': { background: 'rgba(245,158,11,0.1)', borderColor: 'rgba(245,158,11,0.3)' },
                            }}
                          >
                            <Box sx={{
                              width: 36, height: 36, borderRadius: '10px',
                              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              boxShadow: '0 3px 8px rgba(245,158,11,0.35)',
                            }}>
                              <EmojiEvents sx={{ color: 'white', fontSize: 18 }} />
                            </Box>
                            <Box sx={{ flex: 1 }}>
                              <Typography variant="body2" fontWeight={700}>{cert.name}</Typography>
                              <Typography variant="body2" color="text.secondary">{cert.issuer}</Typography>
                              {cert.issueDate && (
                                <Typography variant="caption" color="text.disabled">
                                  Issued {new Date(cert.issueDate).toLocaleDateString(undefined, { month: 'short', year: 'numeric' })}
                                </Typography>
                              )}
                              {cert.url && (
                                <Typography variant="caption" component="a" href={cert.url} target="_blank" sx={{ display: 'block', color: '#d97706', textDecoration: 'none', fontWeight: 600, '&:hover': { textDecoration: 'underline' } }}>
                                  View credential →
                                </Typography>
                              )}
                            </Box>
                            {isOwnProfile && (
                              <IconButton size="small" onClick={() => handleDeleteCert(cert.id || String(i))} sx={{ color: 'error.main', flexShrink: 0 }}>
                                <Close fontSize="small" />
                              </IconButton>
                            )}
                          </Box>
                        ))}
                      </Box>
                    )}
                  </CardContent>
                </Card>

                {/* Open to Work toggle (own profile only) */}
                {isOwnProfile && (
                  <Card
                    variant="outlined"
                    sx={{
                      borderRadius: '14px',
                      overflow: 'hidden',
                      borderColor: profile?.openToWork ? 'success.main' : 'divider',
                      transition: 'border-color 0.3s ease',
                      background: profile?.openToWork
                        ? 'linear-gradient(135deg, rgba(16,185,129,0.06), rgba(5,150,105,0.04))'
                        : 'background.paper',
                      '&::before': {
                        content: '""',
                        display: 'block',
                        height: 3,
                        background: profile?.openToWork
                          ? 'linear-gradient(90deg, #10b981, #059669)'
                          : 'linear-gradient(90deg, #9ca3af, #d1d5db)',
                        transition: 'background 0.3s ease',
                      },
                    }}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={700} sx={{ color: profile?.openToWork ? 'success.main' : 'text.primary' }}>
                          Open to Opportunities
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Let recruiters and faculty know you're open to new roles
                        </Typography>
                      </Box>
                      <Switch
                        checked={!!profile?.openToWork}
                        onChange={(e) => handleOpenToWorkToggle(e.target.checked)}
                        color="success"
                      />
                    </CardContent>
                  </Card>
                )}
              </Box>
            </TabPanel>

            {/* Connections Tab */}
            <TabPanel value={activeTab} index={2}>
              {/* Pending incoming requests — only shown on own profile */}
              {isOwnProfile && (connectionRequestsData?.data || []).length > 0 && (
                <Box sx={{ mb: 3 }}>
                  {/* Pending requests heading */}
                  <Box sx={{
                    display: 'flex', alignItems: 'center', gap: 1.5, mb: 2,
                    p: 1.5, borderRadius: '12px',
                    background: 'linear-gradient(135deg, rgba(245,158,11,0.1), rgba(217,119,6,0.06))',
                    border: '1px solid rgba(245,158,11,0.25)',
                  }}>
                    <Box sx={{
                      width: 32, height: 32, borderRadius: '8px',
                      background: 'linear-gradient(135deg, #d97706, #f59e0b)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 3px 8px rgba(245,158,11,0.3)',
                      flexShrink: 0,
                    }}>
                      <Typography sx={{ color: '#fff', fontSize: '0.85rem', fontWeight: 700 }}>
                        {connectionRequestsData!.data.length}
                      </Typography>
                    </Box>
                    <Box>
                      <Typography variant="subtitle2" fontWeight={700} sx={{ color: '#d97706' }}>
                        Pending Requests
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        People who want to connect with you
                      </Typography>
                    </Box>
                  </Box>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {connectionRequestsData!.data.map((req: any) => {
                      const profile = req.profile || req;
                      const reqUserId = req.userId || req._id || req.id;
                      const displayFirst = profile.firstName || req.firstName || '';
                      const displayLast = profile.lastName || req.lastName || '';
                      const displayRole = profile.role || req.role || '';
                      const displayAvatar = profile.avatar || req.avatar;
                      return (
                        <Card
                          key={req.connectionId || reqUserId}
                          variant="outlined"
                          sx={{
                            borderRadius: '14px',
                            p: 1.75,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1.5,
                            borderColor: 'rgba(245,158,11,0.3)',
                            background: 'rgba(245,158,11,0.04)',
                            transition: 'all 0.2s ease',
                            '&:hover': {
                              borderColor: 'rgba(245,158,11,0.5)',
                              boxShadow: '0 4px 14px rgba(245,158,11,0.12)',
                            },
                          }}
                        >
                          <Avatar
                            src={displayAvatar}
                            sx={{
                              width: 46, height: 46,
                              background: 'linear-gradient(135deg,#f59e0b,#d97706)',
                              fontWeight: 700, flexShrink: 0,
                              boxShadow: '0 3px 10px rgba(245,158,11,0.35)',
                            }}
                          >
                            {displayFirst?.[0]}
                          </Avatar>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="body2" fontWeight={700} noWrap>{displayFirst} {displayLast}</Typography>
                            {displayRole && (
                              <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{displayRole}</Typography>
                            )}
                          </Box>
                          <Box sx={{ display: 'flex', gap: 1, flexShrink: 0 }}>
                            <Button
                              size="small"
                              variant="contained"
                              sx={{
                                borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700,
                                background: 'linear-gradient(135deg,#10b981,#059669)',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                border: 'none',
                                '&:hover': { background: 'linear-gradient(135deg,#059669,#047857)', boxShadow: '0 4px 12px rgba(16,185,129,0.4)' },
                              }}
                              onClick={async () => {
                                try {
                                  await acceptConnectionMutation(reqUserId).unwrap();
                                  refetchRequests();
                                  refetchConnections();
                                } catch (e) { console.error(e); }
                              }}
                            >
                              Accept
                            </Button>
                            <Button
                              size="small"
                              variant="outlined"
                              color="error"
                              sx={{ borderRadius: '20px', fontSize: '0.75rem', fontWeight: 700 }}
                              onClick={async () => {
                                try {
                                  await declineConnectionMutation(reqUserId).unwrap();
                                  refetchRequests();
                                  refetchConnections();
                                } catch (e) { console.error(e); }
                              }}
                            >
                              Decline
                            </Button>
                          </Box>
                        </Card>
                      );
                    })}
                  </Box>
                  <Divider sx={{ mt: 2.5, mb: 2 }} />
                  <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 1.5 }}>
                    Connected ({connectionCount})
                  </Typography>
                </Box>
              )}

              {connectionCount === 0 && (!isOwnProfile || (connectionRequestsData?.data || []).length === 0) ? (
                <EmptyState
                  icon="empty"
                  title="No connections yet"
                  description="Connect with faculty, students, and alumni to grow your network!"
                />
              ) : connectionCount > 0 ? (
                <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mt: isOwnProfile && (connectionRequestsData?.data || []).length > 0 ? 0 : 1 }}>
                  {(profileUser?.connections || []).map((conn: any, i: number) => {
                    const connUser = typeof conn === 'string' ? { _id: conn, firstName: 'User', lastName: conn.slice(0, 6), role: 'student' } : conn;
                    const connId = connUser._id || connUser.id || i;
                    return (
                      <Card
                        key={connId}
                        variant="outlined"
                        sx={{
                          borderRadius: '12px',
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1.5,
                          transition: 'all 0.2s ease',
                          '&:hover': {
                            borderColor: 'primary.light',
                            boxShadow: '0 4px 14px rgba(16,185,129,0.1)',
                            transform: 'translateY(-1px)',
                          },
                        }}
                      >
                        <Avatar
                          src={connUser.avatar}
                          sx={{
                            width: 44, height: 44,
                            background: 'linear-gradient(135deg,#6366f1,#818cf8)',
                            fontWeight: 700,
                            boxShadow: '0 3px 8px rgba(99,102,241,0.3)',
                          }}
                        >
                          {(connUser.firstName || 'U')[0]}{(connUser.lastName || '')[0]}
                        </Avatar>
                        <Box>
                          <Typography variant="body2" fontWeight={700}>{connUser.firstName} {connUser.lastName}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ textTransform: 'capitalize' }}>{connUser.role}</Typography>
                        </Box>
                      </Card>
                    );
                  })}
                </Box>
              ) : null}
            </TabPanel>

            {/* Events Tab */}
            <TabPanel value={activeTab} index={3}>
              {(() => {
                const isLoadingEvents = isOwnProfile ? isLoadingAttendingEvents : isLoadingAllEvents;
                // For own profile: events user is attending. For others: events they created.
                const profileUserId = profileId;
                let profileEvents: any[] = [];
                if (isOwnProfile) {
                  profileEvents = attendingEventsData?.data || [];
                } else {
                  const allEvents = allEventsData?.data || [];
                  profileEvents = allEvents.filter(
                    (e: any) =>
                      e.organizerId === profileUserId ||
                      (e as any).userId === profileUserId ||
                      (e as any).createdBy === profileUserId
                  );
                }
                if (isLoadingEvents) {
                  return (
                    <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                      <EventCardSkeleton /><EventCardSkeleton />
                    </Box>
                  );
                }
                if (profileEvents.length === 0) {
                  return (
                    <EmptyState
                      icon="empty"
                      title="No events yet"
                      description={isOwnProfile ? "You haven't RSVP'd to any events yet." : "This user has no events."}
                    />
                  );
                }
                return (
                  <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                    {profileEvents.map((event: any) => (
                      <Card
                        key={event._id || event.id}
                        variant="outlined"
                        sx={{
                          borderRadius: '14px',
                          overflow: 'hidden',
                          transition: 'transform 0.2s ease, box-shadow 0.2s ease',
                          '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 10px 28px rgba(99,102,241,0.14)' },
                        }}
                      >
                        {(event.banner || event.imageUrl || event.coverImage) && (
                          <Box
                            component="img"
                            src={event.banner || event.imageUrl || event.coverImage}
                            alt={event.title}
                            sx={{ width: '100%', height: 100, objectFit: 'cover' }}
                            onError={(e: any) => { e.target.style.display = 'none'; }}
                          />
                        )}
                        {/* Top colour strip if no image */}
                        {!(event.banner || event.imageUrl || event.coverImage) && (
                          <Box sx={{ height: 4, background: 'linear-gradient(90deg, #312e81, #6366f1)' }} />
                        )}
                        <CardContent sx={{ pb: '12px !important' }}>
                          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                            <Box sx={{
                              width: 34, height: 34, borderRadius: '10px',
                              background: 'linear-gradient(135deg, #312e81, #6366f1)',
                              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                              boxShadow: '0 3px 8px rgba(99,102,241,0.3)',
                            }}>
                              <EventIcon sx={{ color: '#fff', fontSize: 16 }} />
                            </Box>
                            <Box>
                              <Typography variant="body2" fontWeight={700} sx={{ lineHeight: 1.3 }}>{event.title}</Typography>
                              {event.startDate && (
                                <Typography variant="caption" color="text.secondary">
                                  {new Date(event.startDate).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                                </Typography>
                              )}
                            </Box>
                          </Box>
                          {event.location && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                              {event.isOnline || event.isVirtual ? 'Online' : event.location}
                            </Typography>
                          )}
                          <Chip
                            label={event.type?.replace('_', ' ') || 'Event'}
                            size="small"
                            sx={{
                              mt: 1, height: 19, fontSize: '0.65rem', fontWeight: 700,
                              textTransform: 'capitalize',
                              background: 'rgba(99,102,241,0.12)',
                              color: '#6366f1',
                              border: '1px solid rgba(99,102,241,0.3)',
                            }}
                          />
                        </CardContent>
                      </Card>
                    ))}
                  </Box>
                );
              })()}
            </TabPanel>

            {/* Activity Tab */}
            <TabPanel value={activeTab} index={4}>
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
        <DialogActions sx={{ px: 3, py: 2, flexDirection: 'column', alignItems: 'stretch', gap: 1 }}>
          {editError && (
            <Typography variant="caption" color="error" sx={{ px: 1, textAlign: 'center' }}>
              {editError}
            </Typography>
          )}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
            <Button onClick={() => { setEditOpen(false); setEditError(''); }} disabled={editSubmitting}>Cancel</Button>
            <Button variant="contained" onClick={handleEditSave} disabled={editSubmitting}>
              {editSubmitting ? 'Saving…' : 'Save Changes'}
            </Button>
          </Box>
        </DialogActions>
      </Dialog>

      {/* Add Experience Dialog */}
      <Dialog open={addExpOpen} onClose={() => setAddExpOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Experience</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="Job Title" fullWidth size="small" value={expForm.title} onChange={(e) => setExpForm((f) => ({ ...f, title: e.target.value }))} required />
          <TextField label="Company" fullWidth size="small" value={expForm.company} onChange={(e) => setExpForm((f) => ({ ...f, company: e.target.value }))} required />
          <TextField label="Location" fullWidth size="small" value={expForm.location} onChange={(e) => setExpForm((f) => ({ ...f, location: e.target.value }))} />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Start Date" type="date" fullWidth size="small" value={expForm.startDate} onChange={(e) => setExpForm((f) => ({ ...f, startDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
            <TextField label="End Date" type="date" fullWidth size="small" value={expForm.endDate} onChange={(e) => setExpForm((f) => ({ ...f, endDate: e.target.value }))} InputLabelProps={{ shrink: true }} disabled={expForm.current} />
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Switch checked={expForm.current} onChange={(e) => setExpForm((f) => ({ ...f, current: e.target.checked }))} color="primary" />
            <Typography variant="body2">Currently working here</Typography>
          </Box>
          <TextField label="Description" fullWidth multiline rows={2} size="small" value={expForm.description} onChange={(e) => setExpForm((f) => ({ ...f, description: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAddExpOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveExperience}
            disabled={!expForm.title || !expForm.company}
            sx={{ borderRadius: '10px', background: 'linear-gradient(135deg,#15803d,#166534)', boxShadow: '0 3px 10px rgba(22,101,52,0.35)', '&:hover': { background: 'linear-gradient(135deg,#166534,#14532d)' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Education Dialog */}
      <Dialog open={addEduOpen} onClose={() => setAddEduOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Education</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="School / University" fullWidth size="small" value={eduForm.school} onChange={(e) => setEduForm((f) => ({ ...f, school: e.target.value }))} required />
          <TextField label="Degree" fullWidth size="small" value={eduForm.degree} onChange={(e) => setEduForm((f) => ({ ...f, degree: e.target.value }))} placeholder="e.g. Bachelor of Science" />
          <TextField label="Field of Study" fullWidth size="small" value={eduForm.field} onChange={(e) => setEduForm((f) => ({ ...f, field: e.target.value }))} placeholder="e.g. Computer Science" />
          <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
            <TextField label="Start Year" type="number" fullWidth size="small" value={eduForm.startYear} onChange={(e) => setEduForm((f) => ({ ...f, startYear: e.target.value }))} />
            <TextField label="End Year" type="number" fullWidth size="small" value={eduForm.endYear} onChange={(e) => setEduForm((f) => ({ ...f, endYear: e.target.value }))} placeholder="Leave blank if current" />
          </Box>
          <TextField label="Grade / GPA" fullWidth size="small" value={eduForm.grade} onChange={(e) => setEduForm((f) => ({ ...f, grade: e.target.value }))} />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAddEduOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveEducation}
            disabled={!eduForm.school}
            sx={{ borderRadius: '10px', background: 'linear-gradient(135deg,#1d4ed8,#2563eb)', boxShadow: '0 3px 10px rgba(29,78,216,0.35)', '&:hover': { background: 'linear-gradient(135deg,#1e40af,#1d4ed8)' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Certification Dialog */}
      <Dialog open={addCertOpen} onClose={() => setAddCertOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ fontWeight: 700 }}>Add Certification</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
          <TextField label="Certification Name" fullWidth size="small" value={certForm.name} onChange={(e) => setCertForm((f) => ({ ...f, name: e.target.value }))} required />
          <TextField label="Issuing Organization" fullWidth size="small" value={certForm.issuer} onChange={(e) => setCertForm((f) => ({ ...f, issuer: e.target.value }))} required />
          <TextField label="Issue Date" type="date" fullWidth size="small" value={certForm.issueDate} onChange={(e) => setCertForm((f) => ({ ...f, issueDate: e.target.value }))} InputLabelProps={{ shrink: true }} />
          <TextField label="Credential URL" fullWidth size="small" value={certForm.url} onChange={(e) => setCertForm((f) => ({ ...f, url: e.target.value }))} placeholder="https://..." />
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={() => setAddCertOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
          <Button
            variant="contained"
            onClick={handleSaveCert}
            disabled={!certForm.name || !certForm.issuer}
            sx={{ borderRadius: '10px', background: 'linear-gradient(135deg,#d97706,#f59e0b)', boxShadow: '0 3px 10px rgba(245,158,11,0.35)', '&:hover': { background: 'linear-gradient(135deg,#b45309,#d97706)' } }}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ProfilePage;
