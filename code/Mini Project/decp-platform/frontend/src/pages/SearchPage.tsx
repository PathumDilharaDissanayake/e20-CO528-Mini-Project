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
import { useGetPostsQuery } from '@services/postApi';
import { useGetUsersQuery } from '@services/userApi';
import { useGetJobsQuery } from '@services/jobApi';
import { PostCard } from '@components/feed/PostCard';
import { formatRelativeTime } from '@utils';

const TABS = [
  { label: 'All', value: 'all' },
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

  // Debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 400);
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

  const { data: postsData, isLoading: postsLoading } = useGetPostsQuery({ page: 1, limit: 20 });
  const { data: usersData, isLoading: usersLoading } = useGetUsersQuery({ limit: 20 });
  const { data: jobsData, isLoading: jobsLoading } = useGetJobsQuery({ page: 1, limit: 20 });

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

  const getRoleColor = (role?: string) => {
    if (role === 'faculty') return '#166534';
    if (role === 'alumni') return '#f59e0b';
    if (role === 'admin') return '#ef4444';
    return '#6366f1';
  };

  return (
    <Box sx={{ maxWidth: 860, mx: 'auto' }}>
      {/* Search Input */}
      <Paper
        sx={{
          p: 2.5,
          mb: 3,
          borderRadius: '16px',
          border: '1px solid',
          borderColor: 'divider',
          boxShadow: '0 2px 8px rgba(16,185,129,0.06)',
        }}
      >
        <Typography variant="h5" fontWeight={800} sx={{ mb: 2 }}>
          Search DECP
        </Typography>
        <TextField
          fullWidth
          autoFocus
          placeholder="Search posts, people, jobs, events..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <Search sx={{ color: 'primary.main' }} />
              </InputAdornment>
            ),
            endAdornment: query && (
              <InputAdornment position="end">
                <IconButton size="small" onClick={() => setQuery('')}>
                  <Clear fontSize="small" />
                </IconButton>
              </InputAdornment>
            ),
          }}
          sx={{
            '& .MuiOutlinedInput-root': {
              borderRadius: '24px',
              fontSize: '1rem',
              '& fieldset': { borderColor: 'divider' },
              '&:hover fieldset': { borderColor: 'primary.light' },
              '&.Mui-focused fieldset': { borderColor: 'primary.main', borderWidth: '2px' },
            },
          }}
        />
      </Paper>

      {/* Tabs */}
      <Paper sx={{ mb: 3, borderRadius: '12px', border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{ borderBottom: '1px solid', borderColor: 'divider' }}
        >
          {TABS.map((tab) => (
            <Tab
              key={tab.value}
              label={tab.label}
              value={tab.value}
              sx={{ fontWeight: 600, minWidth: 80 }}
            />
          ))}
        </Tabs>
      </Paper>

      {/* Loading */}
      {isLoading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 6 }}>
          <CircularProgress color="primary" />
        </Box>
      )}

      {/* No query — show suggestions */}
      {!isLoading && !hasQuery && (
        <Box>
          <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2 }}>
            Suggested People
          </Typography>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', md: '1fr 1fr 1fr' }, gap: 2, mb: 4 }}>
            {(usersData?.data || []).slice(0, 6).map((u: any) => (
              <Card
                key={u._id || u.id}
                sx={{ borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover': { boxShadow: '0 4px 16px rgba(22,101,52,0.12)' } }}
                onClick={() => navigate(`/users/${u._id || u.id}`)}
              >
                <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
                  <Avatar
                    src={u.avatar}
                    sx={{ width: 56, height: 56, mb: 1.5, background: `linear-gradient(135deg, ${getRoleColor(u.role)}, ${getRoleColor(u.role)}88)`, fontWeight: 700, fontSize: '1.2rem' }}
                  >
                    {u.firstName?.[0]?.toUpperCase()}
                  </Avatar>
                  <Typography variant="subtitle2" fontWeight={700} textAlign="center">{u.firstName} {u.lastName}</Typography>
                  <Chip label={u.role || 'student'} size="small" sx={{ mt: 0.75, fontWeight: 600, fontSize: '0.65rem', color: getRoleColor(u.role), borderColor: getRoleColor(u.role) }} variant="outlined" />
                  {u.department && (
                    <Typography variant="caption" color="text.secondary" textAlign="center" sx={{ mt: 0.5 }}>{u.department}</Typography>
                  )}
                </CardContent>
              </Card>
            ))}
          </Box>
        </Box>
      )}

      {/* Results */}
      {!isLoading && hasQuery && (
        <Box>
          {/* People results */}
          {(activeTab === 'all' || activeTab === 'people') && filteredUsers.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Person sx={{ color: 'primary.main', fontSize: 20 }} />
                People ({filteredUsers.length})
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                {filteredUsers.slice(0, 6).map((u: any) => (
                  <Card
                    key={u._id || u.id}
                    sx={{ borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: 'primary.main', boxShadow: '0 2px 12px rgba(22,101,52,0.1)' } }}
                    onClick={() => navigate(`/users/${u._id || u.id}`)}
                  >
                    <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Avatar src={u.avatar} sx={{ width: 44, height: 44, background: `linear-gradient(135deg, ${getRoleColor(u.role)}, ${getRoleColor(u.role)}88)`, fontWeight: 700 }}>
                        {u.firstName?.[0]?.toUpperCase()}
                      </Avatar>
                      <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={700} noWrap>{u.firstName} {u.lastName}</Typography>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                          <Chip label={u.role || 'student'} size="small" sx={{ height: 16, fontSize: '0.6rem', fontWeight: 600, color: getRoleColor(u.role), borderColor: getRoleColor(u.role) }} variant="outlined" />
                          {u.department && <Typography variant="caption" color="text.secondary" noWrap>{u.department}</Typography>}
                        </Box>
                      </Box>
                      <Button size="small" variant="outlined" sx={{ borderRadius: '20px', fontSize: '0.72rem', flexShrink: 0 }}>
                        Connect
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Jobs results */}
          {(activeTab === 'all' || activeTab === 'jobs') && filteredJobs.length > 0 && (
            <Box sx={{ mb: 4 }}>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Work sx={{ color: '#6366f1', fontSize: 20 }} />
                Jobs ({filteredJobs.length})
              </Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                {filteredJobs.slice(0, 4).map((job: any) => (
                  <Card key={job._id || job.id} sx={{ borderRadius: '12px', cursor: 'pointer', border: '1px solid', borderColor: 'divider', '&:hover': { borderColor: '#6366f1', boxShadow: '0 2px 12px rgba(99,102,241,0.1)' } }} onClick={() => navigate('/jobs')}>
                    <CardContent sx={{ py: 1.5, '&:last-child': { pb: 1.5 } }}>
                      <Typography variant="subtitle2" fontWeight={700}>{job.title}</Typography>
                      <Typography variant="caption" color="text.secondary">{job.company} · {job.location || 'Remote'} · {job.type || 'Full-time'}</Typography>
                      <Box sx={{ mt: 1 }}>
                        <Chip label={job.type || 'Full-time'} size="small" sx={{ mr: 1, fontSize: '0.65rem', fontWeight: 600 }} />
                        <Typography variant="caption" color="text.disabled">{formatRelativeTime(job.createdAt)}</Typography>
                      </Box>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            </Box>
          )}

          {/* Posts results */}
          {(activeTab === 'all' || activeTab === 'posts') && filteredPosts.length > 0 && (
            <Box>
              <Typography variant="subtitle1" fontWeight={700} sx={{ mb: 2, display: 'flex', alignItems: 'center', gap: 1 }}>
                <Article sx={{ color: '#f59e0b', fontSize: 20 }} />
                Posts ({filteredPosts.length})
              </Typography>
              {filteredPosts.slice(0, 5).map((post) => (
                <PostCard key={post._id || post.id} post={post} />
              ))}
            </Box>
          )}

          {/* No results */}
          {filteredPosts.length === 0 && filteredUsers.length === 0 && filteredJobs.length === 0 && (
            <Box sx={{ textAlign: 'center', py: 8 }}>
              <Search sx={{ fontSize: 56, color: 'text.disabled', mb: 2 }} />
              <Typography variant="h6" color="text.secondary" gutterBottom>No results for "{debouncedQuery}"</Typography>
              <Typography variant="body2" color="text.disabled">Try different keywords or check your spelling</Typography>
            </Box>
          )}
        </Box>
      )}
    </Box>
  );
};

export default SearchPage;
