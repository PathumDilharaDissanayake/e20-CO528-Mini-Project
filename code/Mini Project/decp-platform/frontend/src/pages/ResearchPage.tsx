import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Tabs,
  Tab,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  MenuItem,
  Chip,
  Paper,
} from '@mui/material';
import { Add, Science, Biotech, Hub, Groups } from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import {
  useGetResearchProjectsQuery,
  useGetMyResearchQuery,
  useGetCollaboratingResearchQuery,
  useCreateResearchMutation,
  useCollaborateResearchMutation,
  useLeaveResearchMutation,
} from '@services/researchApi';
import { ResearchCard } from '@components/research/ResearchCard';
import { EventCardSkeleton, EmptyState } from '@components/common';
import { ResearchProject } from '@types';
import { RESEARCH_FIELDS, RESEARCH_STATUS } from '@utils';

const HeroBanner: React.FC<{ count: number; canCreate: boolean; onCreate: () => void }> = ({ count, canCreate, onCreate }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: '20px',
      overflow: 'hidden',
      mb: 3,
      position: 'relative',
      background: 'linear-gradient(135deg, #0c2340 0%, #1e3a5f 40%, #0f2d2d 100%)',
    }}
  >
    <Box className="absolute inset-0 opacity-15" sx={{ backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`, backgroundSize: '30px 30px' }} />
    <Box className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" sx={{ background: 'radial-gradient(circle, #3b82f6 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
    <Box className="absolute bottom-0 left-1/4 w-48 h-48 rounded-full opacity-10" sx={{ background: 'radial-gradient(circle, #166534 0%, transparent 70%)', transform: 'translateY(40%)' }} />

    <Box className="relative p-6 sm:p-8">
      <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Box>
          <Box className="flex items-center gap-2 mb-2">
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(59,130,246,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Science sx={{ color: '#93c5fd', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
              Research Hub
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Explore ongoing research projects, find collaborators, and advance academic knowledge
          </Typography>
          <Box className="flex flex-wrap gap-2">
            <Chip icon={<Biotech sx={{ fontSize: '14px !important' }} />} label={`${count} Active Projects`} size="small"
              sx={{ background: 'rgba(59,130,246,0.2)', color: '#93c5fd', borderColor: 'rgba(59,130,246,0.35)', fontWeight: 600 }} variant="outlined" />
            <Chip icon={<Hub sx={{ fontSize: '14px !important' }} />} label="Multi-disciplinary" size="small"
              sx={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 600 }} variant="outlined" />
            <Chip icon={<Groups sx={{ fontSize: '14px !important' }} />} label="Open Collaboration" size="small"
              sx={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }} variant="outlined" />
          </Box>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={onCreate}
            sx={{ background: 'linear-gradient(135deg, #1d4ed8, #3b82f6)', borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(59,130,246,0.35)' }}>
            New Project
          </Button>
        )}
      </Box>
    </Box>
  </Paper>
);

export const ResearchPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');

  const { data: allProjectsData, isLoading: isLoadingAll } = useGetResearchProjectsQuery({}, { skip: activeTab !== 0 });
  const { data: myProjectsData, isLoading: isLoadingMine } = useGetMyResearchQuery({}, { skip: activeTab !== 1 });
  const { data: collabProjectsData, isLoading: isLoadingCollab } = useGetCollaboratingResearchQuery({}, { skip: activeTab !== 2 });
  const [createResearch, { isLoading: isCreating }] = useCreateResearchMutation();
  const [collaborate] = useCollaborateResearchMutation();
  const [leave] = useLeaveResearchMutation();

  const canCreateResearch = user?.role === 'faculty' || user?.role === 'admin';
  const isLoading = activeTab === 0 ? isLoadingAll : activeTab === 1 ? isLoadingMine : isLoadingCollab;
  const projects = activeTab === 0 ? (allProjectsData?.data || []) : activeTab === 1 ? (myProjectsData?.data || []) : (collabProjectsData?.data || []);
  const totalProjects = allProjectsData?.total || allProjectsData?.data?.length || 0;

  const handleCreateResearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createResearch({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        field: formData.get('field') as string,
        status: formData.get('status') as any,
        startDate: formData.get('startDate') as string,
        endDate: (formData.get('endDate') as string) || undefined,
        funding: formData.get('funding') as string,
        tags,
      }).unwrap();
      setCreateDialogOpen(false);
      setTags([]);
    } catch (err) { console.error('Failed to create research:', err); }
  };

  const handleAddTag = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      e.preventDefault();
      if (!tags.includes(tagInput.trim())) setTags([...tags, tagInput.trim()]);
      setTagInput('');
    }
  };

  return (
    <Box>
      <HeroBanner count={totalProjects} canCreate={canCreateResearch} onCreate={() => setCreateDialogOpen(true)} />

      <Paper elevation={0} sx={{ borderRadius: '14px', mb: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, minHeight: 48 }}>
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <Science sx={{ fontSize: 16 }} /> All Projects
            {totalProjects > 0 && <Chip label={totalProjects} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ml: 0.5 }} color="info" />}
          </Box>} />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Biotech sx={{ fontSize: 16 }} /> My Research</Box>} />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Hub sx={{ fontSize: 16 }} /> Collaborating</Box>} />
        </Tabs>
      </Paper>

      {isLoading ? (
        <><EventCardSkeleton /><EventCardSkeleton /><EventCardSkeleton /></>
      ) : projects.length === 0 ? (
        <EmptyState
          icon="empty"
          title={activeTab === 0 ? "No research projects" : activeTab === 1 ? "No projects led by you" : "Not collaborating on any projects"}
          description="Explore ongoing research or start a new project to advance academic knowledge!"
          action={canCreateResearch && activeTab !== 2 ? (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)}
              sx={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
              Start New Project
            </Button>
          ) : undefined}
        />
      ) : (
        projects.map((project: ResearchProject) => (
          <ResearchCard
            key={project._id || project.id}
            project={project}
            onCollaborate={(id) => collaborate(id)}
            onLeave={(id) => leave(id)}
            isCollaborator={(project.collaborators || []).some((c: any) =>
              (typeof c === 'string' ? c : c._id || c.id) === (user?._id || user?.id)
            )}
          />
        ))
      )}

      {/* Create Research Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <form onSubmit={handleCreateResearch}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
            <Box className="flex items-center gap-2">
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Science sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              New Research Project
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            <TextField fullWidth name="title" label="Project Title" required />
            <TextField fullWidth name="description" label="Description / Abstract" multiline rows={3} required />
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField select fullWidth name="field" label="Research Field" required defaultValue="">
                {RESEARCH_FIELDS.map((f) => <MenuItem key={f} value={f}>{f}</MenuItem>)}
              </TextField>
              <TextField select fullWidth name="status" label="Status" required defaultValue="ongoing">
                {RESEARCH_STATUS.map((s) => <MenuItem key={s.value} value={s.value}>{s.label}</MenuItem>)}
              </TextField>
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField fullWidth name="startDate" label="Start Date" type="date" required InputLabelProps={{ shrink: true }} />
              <TextField fullWidth name="endDate" label="End Date (optional)" type="date" InputLabelProps={{ shrink: true }} />
            </Box>
            <TextField fullWidth name="funding" label="Funding Source (optional)" />
            <Box>
              <TextField fullWidth label="Tags (press Enter to add)" value={tagInput}
                onChange={(e) => setTagInput(e.target.value)} onKeyDown={handleAddTag}
                helperText="e.g. Machine Learning, NLP, Computer Vision" />
              <Box className="flex flex-wrap gap-2 mt-2">
                {tags.map((tag) => (
                  <Chip key={tag} label={tag} onDelete={() => setTags(tags.filter((t) => t !== tag))} size="small" color="info" variant="outlined" />
                ))}
              </Box>
            </Box>
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setCreateDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating} sx={{ background: 'linear-gradient(135deg,#1d4ed8,#3b82f6)' }}>
              {isCreating ? 'Creating…' : 'Create Project'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default ResearchPage;
