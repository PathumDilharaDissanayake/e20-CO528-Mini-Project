import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Tabs,
  Tab,
  Paper,
  Chip,
} from '@mui/material';
import {
  Add,
  Work,
  TrendingUp,
  LocationOn,
  People,
  BusinessCenter,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import { useGetJobsQuery, useGetMyJobsQuery, useGetAppliedJobsQuery, useCreateJobMutation, useApplyForJobMutation } from '@services/jobApi';
import { JobCard } from '@components/jobs/JobCard';
import { JobFilters } from '@components/jobs/JobFilters';
import { JobCardSkeleton, EmptyState } from '@components/common';
import { Job } from '@types';
import { JOB_TYPES } from '@utils';

const HeroBanner: React.FC<{ jobCount: number; canPost: boolean; onPost: () => void }> = ({ jobCount, canPost, onPost }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: '20px',
      overflow: 'hidden',
      mb: 3,
      position: 'relative',
      background: 'linear-gradient(135deg, #1e3a5f 0%, #1a4731 40%, #0f2d1e 100%)',
    }}
  >
    {/* Dot pattern */}
    <Box
      className="absolute inset-0 opacity-15"
      sx={{
        backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`,
        backgroundSize: '30px 30px',
      }}
    />
    {/* Gradient orbs */}
    <Box className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10"
      sx={{ background: 'radial-gradient(circle, #166534 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
    <Box className="absolute bottom-0 left-1/3 w-40 h-40 rounded-full opacity-10"
      sx={{ background: 'radial-gradient(circle, #6366f1 0%, transparent 70%)', transform: 'translateY(40%)' }} />

    <Box className="relative p-6 sm:p-8">
      <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Box>
          <Box className="flex items-center gap-2 mb-2">
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(22,101,52,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Work sx={{ color: '#166534', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
              Jobs & Internships
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Discover opportunities posted by alumni, faculty, and partners
          </Typography>
          <Box className="flex flex-wrap gap-2">
            <Chip
              icon={<BusinessCenter sx={{ fontSize: '14px !important' }} />}
              label={`${jobCount} Open Positions`}
              size="small"
              sx={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }}
              variant="outlined"
            />
            <Chip
              icon={<LocationOn sx={{ fontSize: '14px !important' }} />}
              label="Remote & On-site"
              size="small"
              sx={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 600 }}
              variant="outlined"
            />
            <Chip
              icon={<TrendingUp sx={{ fontSize: '14px !important' }} />}
              label="Internships Available"
              size="small"
              sx={{ background: 'rgba(99,102,241,0.2)', color: '#a5b4fc', borderColor: 'rgba(99,102,241,0.3)', fontWeight: 600 }}
              variant="outlined"
            />
          </Box>
        </Box>
        {canPost && (
          <Button
            variant="contained"
            startIcon={<Add />}
            onClick={onPost}
            sx={{
              background: 'linear-gradient(135deg, #15803d, #166534)',
              borderRadius: '12px',
              px: 3,
              py: 1.5,
              fontWeight: 700,
              whiteSpace: 'nowrap',
              boxShadow: '0 4px 15px rgba(16,185,129,0.35)',
            }}
          >
            Post a Job
          </Button>
        )}
      </Box>
    </Box>
  </Paper>
);

export const JobsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [filters, setFilters] = useState({ search: '', type: '', location: '' });
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewJob, setViewJob] = useState<Job | null>(null);
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [coverLetter, setCoverLetter] = useState('');
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [applySuccess, setApplySuccess] = useState(false);

  const { data: allJobsData, isLoading: isLoadingAll } = useGetJobsQuery(filters, { skip: activeTab !== 0 });
  const { data: appliedJobsData, isLoading: isLoadingApplied } = useGetAppliedJobsQuery({}, { skip: activeTab !== 1 });
  const { data: myJobsData, isLoading: isLoadingMine } = useGetMyJobsQuery({}, { skip: activeTab !== 2 });
  const [createJob, { isLoading: isCreating }] = useCreateJobMutation();
  const [applyForJob, { isLoading: isApplying }] = useApplyForJobMutation();

  const canPostJob = user?.role === 'alumni' || user?.role === 'admin' || user?.role === 'faculty';

  const isLoading = activeTab === 0 ? isLoadingAll : activeTab === 1 ? isLoadingApplied : isLoadingMine;
  const jobs =
    activeTab === 0 ? (allJobsData?.data || []) :
    activeTab === 1 ? (appliedJobsData?.data || []) :
    (myJobsData?.data || []);

  const totalJobs = allJobsData?.total || allJobsData?.data?.length || 0;

  const handleCreateJob = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const requirements = (formData.get('requirements') as string).split('\n').filter(Boolean);
    try {
      await createJob({
        title: formData.get('title') as string,
        company: formData.get('company') as string,
        location: formData.get('location') as string,
        type: formData.get('type') as any,
        description: formData.get('description') as string,
        requirements,
      }).unwrap();
      setCreateDialogOpen(false);
    } catch (error) {
      console.error('Failed to create job:', error);
    }
  };

  const handleApply = async () => {
    if (!applyJob) return;
    const formData = new FormData();
    formData.append('jobId', applyJob._id || applyJob.id || '');
    formData.append('coverLetter', coverLetter);
    if (resumeFile) {
      formData.append('resume', resumeFile);
    }
    try {
      await applyForJob(formData).unwrap();
      setApplySuccess(true);
    } catch (err) {
      console.error('Failed to apply:', err);
    }
  };

  return (
    <Box className="page-enter">
      <HeroBanner jobCount={totalJobs} canPost={canPostJob} onPost={() => setCreateDialogOpen(true)} />

      {/* Tabs */}
      <Paper
        elevation={0}
        sx={{
          borderRadius: '14px',
          mb: 2.5,
          border: '1px solid',
          borderColor: 'divider',
          overflow: 'hidden',
        }}
      >
        <Tabs
          value={activeTab}
          onChange={(_, v) => setActiveTab(v)}
          sx={{ px: 2, minHeight: 48 }}
        >
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Work sx={{ fontSize: 16 }} />
            All Jobs
            {totalJobs > 0 && <Chip label={totalJobs} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ml: 0.5 }} color="primary" />}
          </Box>} />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <People sx={{ fontSize: 16 }} />
            My Applications
          </Box>} />
          {canPostJob && (
            <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <BusinessCenter sx={{ fontSize: 16 }} />
              Posted
            </Box>} />
          )}
        </Tabs>
      </Paper>

      <JobFilters filters={filters} onFilterChange={setFilters} />

      {isLoading ? (
        <>
          <JobCardSkeleton />
          <JobCardSkeleton />
          <JobCardSkeleton />
        </>
      ) : jobs.length === 0 ? (
        <EmptyState
          icon="search"
          title={activeTab === 1 ? "No applications yet" : "No jobs found"}
          description={
            activeTab === 1
              ? "Start applying to jobs that match your skills and interests."
              : "Try adjusting your filters or check back soon for new opportunities."
          }
          action={
            canPostJob && activeTab !== 1 ? (
              <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}>
                Post First Job
              </Button>
            ) : undefined
          }
        />
      ) : (
        <Box className="stagger-children">
          {jobs.map((job: Job) => (
            <Box key={job._id || job.id} className="hover-lift">
              <JobCard
                job={job}
                onView={(j) => setViewJob(j)}
                onApply={(j) => { setApplyJob(j); setCoverLetter(''); setApplySuccess(false); }}
              />
            </Box>
          ))}
        </Box>
      )}

      {/* Create Job Dialog */}
      <Dialog
        open={createDialogOpen}
        onClose={() => setCreateDialogOpen(false)}
        maxWidth="sm"
        fullWidth
        PaperProps={{ sx: { borderRadius: '20px' } }}
      >
        <form onSubmit={handleCreateJob}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
            <Box className="flex items-center gap-2">
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#15803d,#166534)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Work sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              Post a New Job
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            <TextField fullWidth name="title" label="Job Title" required />
            <TextField fullWidth name="company" label="Company / Organisation" required />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField fullWidth name="location" label="Location" required />
              <TextField select fullWidth name="type" label="Job Type" required defaultValue="full-time">
                {JOB_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
              </TextField>
            </Box>
            <TextField fullWidth name="description" label="Description" multiline rows={4} required />
            <TextField fullWidth name="requirements" label="Requirements (one per line)" multiline rows={3} />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setCreateDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>
              Cancel
            </Button>
            <Button type="submit" variant="contained" disabled={isCreating}>
              {isCreating ? 'Posting…' : 'Post Job'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>

      {/* View Job Dialog */}
      <Dialog open={!!viewJob} onClose={() => setViewJob(null)} maxWidth="md" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Box>
              <Typography variant="h6" fontWeight={700}>{viewJob?.title}</Typography>
              <Typography variant="body2" color="text.secondary">{viewJob?.company} • {viewJob?.location}</Typography>
            </Box>
            <Chip label={viewJob?.type} color="primary" size="small" />
          </Box>
        </DialogTitle>
        <DialogContent>
          <Typography variant="body1" sx={{ mt: 1, mb: 2, lineHeight: 1.8 }}>{viewJob?.description}</Typography>
          {viewJob?.requirements && viewJob.requirements.length > 0 && (
            <Box>
              <Typography variant="subtitle2" fontWeight={700} sx={{ mb: 1 }}>Requirements</Typography>
              <Box component="ul" sx={{ pl: 2, mt: 0 }}>
                {viewJob.requirements.map((req, i) => (
                  <Typography key={i} component="li" variant="body2" sx={{ mb: 0.5 }}>{req}</Typography>
                ))}
              </Box>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setViewJob(null)} variant="outlined" sx={{ borderRadius: '10px' }}>Close</Button>
          <Button variant="contained" onClick={() => { setApplyJob(viewJob); setCoverLetter(''); setApplySuccess(false); setViewJob(null); }} sx={{ borderRadius: '10px' }}>
            Apply Now
          </Button>
        </DialogActions>
      </Dialog>

      {/* Apply Job Dialog */}
      <Dialog open={!!applyJob} onClose={() => { setApplyJob(null); setApplySuccess(false); }} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
          {applySuccess ? 'Application Submitted!' : `Apply for ${applyJob?.title}`}
        </DialogTitle>
        <DialogContent sx={{ pt: '8px !important' }}>
          {applySuccess ? (
            <Box sx={{ textAlign: 'center', py: 3 }}>
              <Typography variant="h1" sx={{ fontSize: '3rem', mb: 1 }}>🎉</Typography>
              <Typography variant="body1" color="text.secondary">
                Your application for <strong>{applyJob?.title}</strong> at <strong>{applyJob?.company}</strong> has been submitted successfully!
              </Typography>
            </Box>
          ) : (
            <Box>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Applying to <strong>{applyJob?.title}</strong> at <strong>{applyJob?.company}</strong>
              </Typography>
              <TextField
                fullWidth
                multiline
                rows={5}
                label="Cover Letter (optional)"
                placeholder="Tell them why you're a great fit..."
                value={coverLetter}
                onChange={(e) => setCoverLetter(e.target.value)}
              />
              <Button
                component="label"
                variant="outlined"
                startIcon={<Add />}
                sx={{ mt: 2 }}
              >
                Upload Resume
                <input
                  type="file"
                  hidden
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setResumeFile(file);
                    }
                  }}
                />
              </Button>
            </Box>
          )}
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => { setApplyJob(null); setApplySuccess(false); }} variant="outlined" sx={{ borderRadius: '10px' }}>
            {applySuccess ? 'Done' : 'Cancel'}
          </Button>
          {!applySuccess && (
            <Button variant="contained" onClick={handleApply} disabled={isApplying} sx={{ borderRadius: '10px' }}>
              {isApplying ? 'Submitting…' : 'Submit Application'}
            </Button>
          )}
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default JobsPage;
