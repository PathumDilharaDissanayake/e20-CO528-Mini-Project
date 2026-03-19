import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  TextField,
  InputAdornment,
  Tabs,
  Tab,
  Avatar,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Paper,
  Button,
  IconButton,
} from '@mui/material';
import { Search, Clear, Person, Work, Event, Science, Article } from '@mui/icons-material';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetPostsQuery } from '@services/postApi';
import { useGetUsersQuery, useSendConnectionRequestMutation, useAcceptConnectionMutation, useDeclineConnectionMutation, useGetConnectionsQuery } from '@services/userApi';
import { useGetJobsQuery } from '@services/jobApi';
import PostCard from '@components/feed/PostCard';
import { formatRelativeTime } from '@utils';

const TABS = [
  { label: 'All', value: 'all', icon: null },
  { label: 'Posts', value: 'posts', icon: Article },
  { label: 'People', value: 'people', icon: Person },
  { label: 'Jobs', value: 'jobs', icon: Work },
];

export const SearchPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const initialQuery = searchParams.get('q') || '';

  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState('all');
  const [debouncedQuery, setDebouncedQuery] = useState(initialQuery);
  const [connectionStates, setConnectionStates] = useState<Map<string, 'none' | 'pending' | 'accepted' | 'received_pending'>>(new Map());

  const currentUser = useSelector((state: RootState) => state.auth.user);
  const [sendConnectionRequest] = useSendConnectionRequestMutation();
  const [acceptConnection] = useAcceptConnectionMutation();
  const [declineConnection] = useDeclineConnectionMutation();

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 150);
    return () => clearTimeout(t);
  }, [query]);

  // Sync query param
  useEffect(() => {
    if (debouncedQuery) {
      setSearchParams({ q: debouncedQuery });
    } else {
      setSearchParams({});
    }
  }, [debouncedQuery, setSearchParams]);

  const searchParam = debouncedQuery.trim() || undefined;
  const { data: postsData, isLoading: postsLoading } = useGetPostsQuery({ page: 1, limit: 20, search: searchParam });
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ limit: 20, search: searchParam });
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ page: 1, limit: 20, search: searchParam });

  const lq = debouncedQuery.toLowerCase();

  const filteredPosts = (postsData?.data || []).filter((p) =>
    !lq || (p.content || '').toLowerCase().includes(lq)
  );

  const filteredUsers = (usersData?.data || []).filter((u: any) =>
    !lq || `${u.firstName || ''} ${u.lastName || ''} ${u.email || ''}`.toLowerCase().includes(lq)
  );

  const filteredJobs = ((jobsData as any)?.data || []).filter((j: any) =>
    !lq || `${j.title || ''} ${j.company || ''} ${j.description || ''}`.toLowerCase().includes(lq)
  );

  const isLoading = postsLoading || usersLoading || jobsLoading;
  const hasQuery = debouncedQuery.trim().length > 0;

  const getConnectButtonProps = (userId: string) => {
    if (userId === (currentUser?._id || (currentUser as any)?.id)) return null;
    const state = connectionStates.get(userId) || 'none';
    if (state === 'accepted') return { label: 'Connected', color: 'success' as const, variant: 'outlined' as const, disabled: true };
    if (state === 'pending') return { label: 'Pending', color: 'warning' as const, variant: 'outlined' as const, disabled: true };
    if (state === 'received_pending') return { label: 'Accept', color: 'success' as const, variant: 'contained' as const, disabled: false };
    return { label: 'Connect', color: 'primary' as const, variant: 'contained' as const, disabled: false };
  };

  const { refetch: refetchConnections } = useGetConnectionsQuery();

  const handleConnect = async (userId: string) => {
    const state = connectionStates.get(userId) || 'none';
    try {
      if (state === 'none') {
        await sendConnectionRequest(userId).unwrap();
        setConnectionStates(prev => new Map(prev).set(userId, 'pending'));
      } else if (state === 'received_pending') {
        await acceptConnection(userId).unwrap();
        setConnectionStates(prev => new Map(prev).set(userId, 'accepted'));
        refetchConnections();
      }
    } catch (e) { console.error(e); }
  };

  const getRoleColor = (role?: string) => {
    if (role === 'faculty') return '#166534';
    if (role === 'alumni') return '#f59e0b';
    if (role === 'admin') return '#ef4444';
    return '#6366f1';
  };

  const getRoleGradient = (role?: string) => {
    if (role === 'faculty') return 'linear-gradient(135deg, #166534, #15803d)';
    if (role === 'alumni') return 'linear-gradient(135deg, #d97706, #f59e0b)';
    if (role === 'admin') return 'linear-gradient(135deg, #dc2626, #ef4444)';
    return 'linear-gradient(135deg, #4f46e5, #818cf8)';
  };

  const getJobTypeColor = (type?: string) => {
    if (type === 'Full-time') return { bg: 'rgba(16,185,129,0.12)', color: '#059669', border: 'rgba(16,185,129,0.3)' };
    if (type === 'Part-time') return { bg: 'rgba(99,102,241,0.12)', color: '#6366f1', border: 'rgba(99,102,241,0.3)' };
    if (type === 'Internship') return { bg: 'rgba(245,158,11,0.12)', color: '#d97706', border: 'rgba(245,158,11,0.3)' };
    if (type === 'Contract') return { bg: 'rgba(239,68,68,0.12)', color: '#dc2626', border: 'rgba(239,68,68,0.3)' };
    return { bg: 'rgba(107,114,128,0.12)', color: '#6b7280', border: 'rgba(107,114,128,0.3)' };
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Hero Search Header */}
      <Box
        sx={{
          position: 'relative',
          borderRadius: '20px',
          overflow: 'hidden',
          mb: 3,
          background: 'linear-gradient(135deg, #022c22 0%, #064e3b 50%, #0f172a 100%)',
          p: { xs: 3, sm: 4 },
          '&::before': {
            content: '""',
            position: 'absolute',
            inset: 0,
            backgroundImage: 'radial-gradient(circle, rgba(16,185,129,0.18) 1px, transparent 1px)',
            backgroundSize: '22px 22px',
            pointerEvents: 'none',
          },
        }}
      >
        {/* Decorative glow orbs */}
        <Box sx={{
          position: 'absolute', top: -40, right: -40, width: 180, height: 180,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(16,185,129,0.22) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />
        <Box sx={{
          position: 'absolute', bottom: -30, left: 60, width: 120, height: 120,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(20,184,166,0.18) 0%, transparent 70%)',
          pointerEvents: 'none',
        }} />

        <Box sx={{ position: 'relative', zIndex: 1 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
            <Box sx={{
              width: 36, height: 36, borderRadius: '10px',
              background: 'linear-gradient(135deg, #10b981, #059669)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
            }}>
              <Search sx={{ color: '#fff', fontSize: 20 }} />
            </Box>
            <Typography variant="h5" fontWeight={800} sx={{ color: '#fff', letterSpacing: '-0.02em' }}>
              Search DECP
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(167,243,208,0.75)', mb: 2.5, ml: 0.5 }}>
            Discover people, opportunities, and insights across your network
          </Typography>

          {/* Search Input */}
          <TextField
            fullWidth
            autoFocus
            placeholder="Search posts, people, jobs, events..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <Search sx={{ color: '#10b981', fontSize: 22 }} />
                </InputAdornment>
              ),
              endAdornment: query && (
                <InputAdornment position="end">
                  <IconButton size="small" onClick={() => setQuery('')} sx={{ color: 'rgba(255,255,255,0.6)', '&:hover': { color: '#fff' } }}>
                    <Clear fontSize="small" />
                  </IconButton>
                </InputAdornment>
              ),
            }}
            sx={{
              '& .MuiOutlinedInput-root': {
                borderRadius: '14px',
                fontSize: '1.05rem',
                fontWeight: 500,
                backgroundColor: 'rgba(255,255,255,0.07)',
                backdropFilter: 'blur(8px)',
                color: '#fff',
                transition: 'all 0.25s ease',
                '& fieldset': { borderColor: 'rgba(255,255,255,0.18)', borderWidth: '1.5px' },
                '&:hover fieldset': { borderColor: 'rgba(16,185,129,0.5)' },
                '&.Mui-focused': {
                  backgroundColor: 'rgba(255,255,255,0.1)',
                  boxShadow: '0 0 0 3px rgba(16,185,129,0.25)',
                },
                '&.Mui-focused fieldset': { borderColor: '#10b981', borderWidth: '2px' },
              },
              '& .MuiInputBase-input::placeholder': { color: 'rgba(167,243,208,0.5)', opacity: 1 },
            }}
          />
        </Box>
      </Box>

      {/* Tabs */}
      <Paper sx={{
        mb: 3,
        borderRadius: '14px',
        border: '1px solid',
        borderColor: 'divider',
        overflow: 'hidden',
        boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
      }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            '& .MuiTabs-indicator': {
              background: 'linear-gradient(90deg, #10b981, #059669)',
              height: 3,
              borderRadius: '3px 3px 0 0',
            },
          }}
        >
          {TABS.map((tab) => {
            const IconComp = tab.icon;
            return (
              <Tab
                key={tab.value}
                value={tab.value}
                label={
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
                    {IconComp && (
                      <IconComp sx={{
                        fontSize: 16,
                        color: activeTab === tab.value ? 'primary.main' : 'text.disabled',
                        transition: 'color 0.2s',
                      }} />
                    )}
                    <span>{tab.label}</span>
                  </Box>
                }
                sx={{
                  fontWeight: 700,
                  minWidth: 80,
                  fontSize: '0.875rem',
                  textTransform: 'none',
                  letterSpacing: 0,
                  '&.Mui-selected': { color: 'primary.main' },
                  '&:hover': { color: 'primary.main', bgcolor: 'action.hover' },
                  transition: 'background-color 0.2s',
                }}
              />
            );
          })}
        </Tabs>
      </Paper>

      {/* Loading — full spinner on initial load (no data yet) */}
      {isLoading && !hasQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* Loading — small inline spinner while typing with a query */}
      {isLoading && hasQuery && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 3 }}>
          <CircularProgress size={24} color="primary" />
        </Box>
      )}

      {/* No query — show tab-filtered suggestions */}
      {!isLoading && !hasQuery && (
        <Box>
          {/* People / All tab → suggested people grid */}
          {(activeTab === 'all' || activeTab === 'people') && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                  width: 4, height: 20, borderRadius: '2px',
                  background: 'linear-gradient(180deg, #10b981, #059669)',
                }} />
                <Typography variant="subtitle1" fontWeight={700}>
                  Suggested People
                </Typography>
                <Chip
                  label="Discover"
                  size="small"
                  sx={{
                    ml: 0.5, height: 20, fontSize: '0.65rem', fontWeight: 700,
                    background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.15))',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                />
              </Box>
              <Box sx={{
                display: 'grid',
                gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' },
                gap: 2,
                mb: 4,
              }}>
                {(usersData?.data || []).slice(0, 6).map((u: any) => (
                  <Card
                    key={u._id || u.id}
                    sx={{
                      borderRadius: '16px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      overflow: 'hidden',
                      transition: 'all 0.25s ease',
                      '&:hover': {
                        borderColor: 'primary.light',
                        boxShadow: '0 8px 28px rgba(16,185,129,0.15)',
                        transform: 'translateY(-3px)',
                      },
                    }}
                    onClick={() => navigate(`/users/${u._id || u.id}`)}
                  >
                    <Box sx={{ height: 4, background: getRoleGradient(u.role) }} />
                    <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 2.5, px: 2 }}>
                      <Avatar
                        src={u.avatar}
                        sx={{
                          width: 60, height: 60, mb: 1.5,
                          background: getRoleGradient(u.role),
                          fontWeight: 700, fontSize: '1.3rem',
                          boxShadow: `0 4px 14px ${getRoleColor(u.role)}55`,
                          border: '2.5px solid',
                          borderColor: 'background.paper',
                        }}
                      >
                        {u.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Typography variant="subtitle2" fontWeight={700} textAlign="center" noWrap sx={{ maxWidth: '100%' }}>
                        {u.firstName} {u.lastName}
                      </Typography>
                      <Chip
                        label={u.role || 'student'}
                        size="small"
                        sx={{
                          mt: 0.75, fontWeight: 700, fontSize: '0.65rem',
                          color: getRoleColor(u.role),
                          background: `${getRoleColor(u.role)}18`,
                          border: '1px solid',
                          borderColor: `${getRoleColor(u.role)}44`,
                          textTransform: 'capitalize',
                        }}
                      />
                      {u.department && (
                        <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 0.75, lineHeight: 1.3, px: 0.5 }}>
                          {u.department}
                        </Typography>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Jobs tab → recent jobs */}
          {activeTab === 'jobs' && (
            <Box sx={{ mb: 4 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #4338ca, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(99,102,241,0.28)' }}>
                  <Work sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Latest Jobs</Typography>
              </Box>
              {filteredJobs.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  No jobs available right now. Try searching by keyword.
                </Typography>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                  {filteredJobs.slice(0, 6).map((job: any) => {
                    const typeStyle = getJobTypeColor(job.type);
                    return (
                      <Card key={job._id || job.id} sx={{ borderRadius: '14px', cursor: 'pointer', border: '1px solid', borderColor: 'divider', transition: 'all 0.22s ease', overflow: 'hidden', '&:hover': { borderColor: 'rgba(99,102,241,0.5)', boxShadow: '0 6px 20px rgba(99,102,241,0.12)', transform: 'translateY(-2px)' } }} onClick={() => navigate('/jobs')}>
                        <CardContent sx={{ py: 1.75, px: 2, '&:last-child': { pb: 1.75 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                          <Box sx={{ width: 44, height: 44, borderRadius: '12px', background: 'linear-gradient(135deg, #4338ca, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, boxShadow: '0 3px 10px rgba(99,102,241,0.3)' }}>
                            <Work sx={{ color: '#fff', fontSize: 20 }} />
                          </Box>
                          <Box sx={{ flex: 1, minWidth: 0 }}>
                            <Typography variant="subtitle2" fontWeight={700} noWrap>{job.title}</Typography>
                            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>{job.company} · {job.location || 'Remote'}</Typography>
                            <Chip label={job.type || 'Full-time'} size="small" sx={{ height: 19, fontSize: '0.65rem', fontWeight: 700, background: typeStyle.bg, color: typeStyle.color, border: `1px solid ${typeStyle.border}` }} />
                          </Box>
                        </CardContent>
                      </Card>
                    );
                  })}
                </Box>
              )}
            </Box>
          )}

          {/* Posts tab → recent posts */}
          {activeTab === 'posts' && (
            <Box>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{ width: 32, height: 32, borderRadius: '10px', background: 'linear-gradient(135deg, #b45309, #f59e0b)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 10px rgba(245,158,11,0.28)' }}>
                  <Article sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>Recent Posts</Typography>
              </Box>
              {filteredPosts.length === 0 ? (
                <Typography variant="body2" color="text.disabled" sx={{ py: 4, textAlign: 'center' }}>
                  No posts to show. Try searching by keyword.
                </Typography>
              ) : (
                filteredPosts.slice(0, 5).map((post) => (
                  <PostCard key={post._id || post.id} post={post} />
                ))
              )}
            </Box>
          )}
        </Box>
      )}

      {/* Results */}
      {!isLoading && hasQuery && (
        <Box>
          {/* People results */}
          {(activeTab === 'all' || activeTab === 'people') && filteredUsers.length > 0 && (
            <Box sx={{ mb: 4 }}>
              {/* Section heading */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #166534, #15803d)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(22,101,52,0.25)',
                }}>
                  <Person sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  People
                </Typography>
                <Chip
                  label={filteredUsers.length}
                  size="small"
                  sx={{
                    height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem',
                    background: 'linear-gradient(135deg, rgba(22,101,52,0.15), rgba(21,128,61,0.15))',
                    color: 'primary.main',
                    border: '1px solid',
                    borderColor: 'primary.light',
                  }}
                />
              </Box>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {filteredUsers.slice(0, 6).map((u: any) => (
                  <Card
                    key={u._id || u.id}
                    sx={{
                      borderRadius: '14px',
                      cursor: 'pointer',
                      border: '1px solid',
                      borderColor: 'divider',
                      transition: 'all 0.22s ease',
                      '&:hover': {
                        borderColor: 'primary.main',
                        boxShadow: '0 6px 20px rgba(16,185,129,0.14)',
                        transform: 'translateY(-2px)',
                      },
                    }}
                    onClick={() => navigate(`/users/${u._id || u.id}`)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.75, '&:last-child': { pb: 1.75 } }}>
                      <Avatar
                        src={u.avatar}
                        sx={{
                          width: 46, height: 46,
                          background: getRoleGradient(u.role),
                          fontWeight: 700, fontSize: '1rem',
                          boxShadow: `0 3px 10px ${getRoleColor(u.role)}44`,
                          flexShrink: 0,
                        }}
                      >
                        {u.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.firstName} {u.lastName}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, mt: 0.25, flexWrap: 'wrap' }}>
                          <Chip
                            label={u.role || 'student'}
                            size="small"
                            sx={{
                              height: 17, fontSize: '0.6rem', fontWeight: 700,
                              color: getRoleColor(u.role),
                              background: `${getRoleColor(u.role)}18`,
                              border: '1px solid',
                              borderColor: `${getRoleColor(u.role)}44`,
                              textTransform: 'capitalize',
                            }}
                          />
                          {u.department && (
                            <Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: '0.7rem' }}>
                              {u.department}
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      {(() => {
                        const uid = u._id || u.id;
                        const btnProps = uid ? getConnectButtonProps(uid) : null;
                        if (!btnProps) return null;
                        return (
                          <Button
                            size="small"
                            variant={btnProps.variant}
                            color={btnProps.color}
                            sx={{
                              borderRadius: '20px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              flexShrink: 0,
                              px: 1.5,
                              ...(btnProps.label === 'Connect' && !btnProps.disabled ? {
                                background: 'linear-gradient(135deg, #10b981, #059669)',
                                color: '#fff',
                                boxShadow: '0 2px 8px rgba(16,185,129,0.3)',
                                border: 'none',
                                '&:hover': {
                                  background: 'linear-gradient(135deg, #059669, #047857)',
                                  boxShadow: '0 4px 12px rgba(16,185,129,0.4)',
                                },
                              } : {}),
                            }}
                            onClick={(e) => { e.stopPropagation(); if (uid && !btnProps.disabled) handleConnect(uid); }}
                            disabled={btnProps.disabled}
                          >
                            {btnProps.label}
                          </Button>
                        );
                      })()}
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Jobs results */}
          {(activeTab === 'all' || activeTab === 'jobs') && filteredJobs.length > 0 && (
            <Box sx={{ mb: 4 }}>
              {/* Section heading */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(99,102,241,0.28)',
                }}>
                  <Work sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Jobs
                </Typography>
                <Chip
                  label={filteredJobs.length}
                  size="small"
                  sx={{
                    height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem',
                    background: 'rgba(99,102,241,0.12)',
                    color: '#6366f1',
                    border: '1px solid rgba(99,102,241,0.3)',
                  }}
                />
              </Box>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredJobs.slice(0, 4).map((job: any) => {
                  const typeStyle = getJobTypeColor(job.type);
                  return (
                    <Card
                      key={job._id || job.id}
                      sx={{
                        borderRadius: '14px',
                        cursor: 'pointer',
                        border: '1px solid',
                        borderColor: 'divider',
                        transition: 'all 0.22s ease',
                        overflow: 'hidden',
                        '&:hover': {
                          borderColor: 'rgba(99,102,241,0.5)',
                          boxShadow: '0 6px 20px rgba(99,102,241,0.12)',
                          transform: 'translateY(-2px)',
                        },
                      }}
                      onClick={() => navigate('/jobs')}
                    >
                      <CardContent sx={{ py: 1.75, px: 2, '&:last-child': { pb: 1.75 }, display: 'flex', gap: 1.5, alignItems: 'flex-start' }}>
                        {/* Company icon area */}
                        <Box sx={{
                          width: 44, height: 44, borderRadius: '12px',
                          background: 'linear-gradient(135deg, #4338ca, #6366f1)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0,
                          boxShadow: '0 3px 10px rgba(99,102,241,0.3)',
                        }}>
                          <Work sx={{ color: '#fff', fontSize: 20 }} />
                        </Box>
                        <Box sx={{ flex: 1, minWidth: 0 }}>
                          <Typography variant="subtitle2" fontWeight={700} noWrap>{job.title}</Typography>
                          <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.75 }}>
                            {job.company} · {job.location || 'Remote'}
                          </Typography>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, flexWrap: 'wrap' }}>
                            <Chip
                              label={job.type || 'Full-time'}
                              size="small"
                              sx={{
                                height: 19, fontSize: '0.65rem', fontWeight: 700,
                                background: typeStyle.bg,
                                color: typeStyle.color,
                                border: `1px solid ${typeStyle.border}`,
                              }}
                            />
                            <Typography variant="caption" color="text.disabled" sx={{ fontSize: '0.68rem' }}>
                              {formatRelativeTime(job.createdAt)}
                            </Typography>
                          </Box>
                        </Box>
                      </CardContent>
                    </Card>
                  );
                })}
              </Box>
            </Box>
          )}

          {/* Posts results */}
          {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
            <Box>
              {/* Section heading */}
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Box sx={{
                  width: 32, height: 32, borderRadius: '10px',
                  background: 'linear-gradient(135deg, #b45309, #f59e0b)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: '0 4px 10px rgba(245,158,11,0.28)',
                }}>
                  <Article sx={{ color: '#fff', fontSize: 17 }} />
                </Box>
                <Typography variant="subtitle1" fontWeight={700}>
                  Posts
                </Typography>
                <Chip
                  label={filteredPosts.length}
                  size="small"
                  sx={{
                    height: 20, minWidth: 28, fontWeight: 700, fontSize: '0.7rem',
                    background: 'rgba(245,158,11,0.12)',
                    color: '#d97706',
                    border: '1px solid rgba(245,158,11,0.3)',
                  }}
                />
              </Box>
              {filteredPosts.slice(0, 5).map((post) => (
                <PostCard key={post._id || post.id} post={post} />
              ))}
            </Box>
          )}

          {/* No results */}
          {filteredPosts.length === 0 && filteredUsers.length === 0 && filteredJobs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Box sx={{
                width: 72, height: 72, borderRadius: '50%',
                background: 'linear-gradient(135deg, rgba(16,185,129,0.12), rgba(5,150,105,0.08))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                mx: 'auto', mb: 2,
                border: '2px solid rgba(16,185,129,0.2)',
              }}>
                <Search sx={{ fontSize: 36, color: 'primary.light' }} />
              </Box>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                No results for "{debouncedQuery}"
              </Typography>
              <Typography variant="body2" color="text.disabled">
                Try different keywords or check your spelling
              </Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
