import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
  IconButton,
} from '@mui/material';
import {
  Science,
  CalendarToday,
  Group,
  Description,
  Person,
  Delete,
} from '@mui/icons-material';

import { ResearchProject, User } from '@types';
import { formatDate } from '@utils';
import { RESEARCH_STATUS } from '@utils';

const getMediaUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  return `${url.startsWith('/') ? '' : '/'}${url}`;
};

interface ResearchCardProps {
  project: ResearchProject;
  onCollaborate?: (projectId: string) => void;
  onLeave?: (projectId: string) => void;
  isCollaborator?: boolean;
  isCollaborating?: boolean;
  isLeaving?: boolean;
  isLeadResearcher?: boolean;
  onEdit?: (projectId: string) => void;
  onDelete?: (projectId: string) => void;
}

const toUser = (value: User | string): User => {
  if (typeof value !== 'string') {
    return value;
  }

  return {
    _id: value,
    id: value,
    firstName: 'Collaborator',
    lastName: value.slice(0, 6),
    role: 'faculty',
  };
};

export const ResearchCard: React.FC<ResearchCardProps> = ({
  project,
  onCollaborate,
  onLeave,
  isCollaborator = false,
  isCollaborating = false,
  isLeaving = false,
  isLeadResearcher = false,
  onEdit,
  onDelete,
}) => {
  const projectId = project._id || project.id || '';
  const collaborators = Array.isArray(project.collaborators) ? project.collaborators.map(toUser) : [];
  const tags = Array.isArray(project.tags) ? project.tags : [];
  const documents = Array.isArray(project.documents) ? project.documents : [];
  const leadResearcher = project.leadResearcher || {
    firstName: 'Lead',
    lastName: 'Researcher',
    role: 'faculty' as const,
  };

  const statusConfig = RESEARCH_STATUS.find((s) => s.value === project.status);

  const getProgress = () => {
    if (typeof (project as any).progress === 'number') return (project as any).progress;
    if (project.status === 'published') return 100;
    if (project.status === 'completed') return 90;
    if (project.endDate) {
      const start = new Date(project.startDate || Date.now()).getTime();
      const end = new Date(project.endDate).getTime();
      const now = Date.now();
      return Math.min(100, Math.max(0, Math.round(((now - start) / (end - start)) * 100)));
    }
    return 50;
  };

  const progress = getProgress();

  return (
    <Card
      elevation={0}
      sx={{
        mb: 2.5,
        borderRadius: '20px',
        border: '1px solid',
        borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.07)' : 'rgba(0,0,0,0.07)',
        background: (t) =>
          t.palette.mode === 'dark'
            ? 'rgba(255,255,255,0.03)'
            : 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(12px)',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        '&:hover': {
          transform: 'translateY(-3px)',
          boxShadow: (t) =>
            t.palette.mode === 'dark'
              ? '0 12px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(16,185,129,0.15)'
              : '0 12px 40px rgba(0,0,0,0.12)',
        },
      }}
    >
      {project.coverImage && (
        <CardMedia
          component="img"
          height="140"
          image={getMediaUrl(project.coverImage)}
          alt={project.title || 'Research cover'}
          sx={{ objectFit: 'cover' }}
          onError={(e: any) => { e.target.style.display = 'none'; }}
        />
      )}
      <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
        {/* Header row: field chip + status */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Chip
            icon={<Science sx={{ fontSize: '14px !important', color: '#10b981 !important' }} />}
            label={project.field || 'General'}
            size="small"
            variant="outlined"
            sx={{ borderColor: 'rgba(16,185,129,0.4)', color: '#10b981', fontWeight: 600, bgcolor: 'rgba(16,185,129,0.08)' }}
          />
          <Chip
            label={statusConfig?.label || project.status || 'Ongoing'}
            size="small"
            sx={{
              backgroundColor: statusConfig?.color ? `${statusConfig.color}22` : 'rgba(16,185,129,0.15)',
              color: statusConfig?.color || '#10b981',
              border: `1px solid ${statusConfig?.color ? `${statusConfig.color}44` : 'rgba(16,185,129,0.3)'}`,
              fontWeight: 700,
              fontSize: '0.68rem',
            }}
          />
        </Box>

        {/* Title */}
        <Typography variant="h6" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3, fontSize: '1rem' }}>
          {project.title || 'Untitled Research Project'}
        </Typography>

        {/* Description */}
        <Typography
          variant="body2"
          sx={{ color: 'text.secondary', mb: 2, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}
        >
          {project.description || 'No description provided.'}
        </Typography>

        {/* Lead researcher */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mb: 2, p: 1.25, borderRadius: '10px', bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)' }}>
          <Person sx={{ fontSize: 15, color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Lead:</Typography>
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 700 }}>
            {typeof leadResearcher === 'string'
              ? leadResearcher
              : `${leadResearcher.firstName || 'Lead'} ${leadResearcher.lastName || 'Researcher'}`}
          </Typography>
        </Box>

        {/* Progress bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 0.75 }}>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>Progress</Typography>
            <Typography variant="caption" sx={{ color: '#10b981', fontWeight: 700 }}>{progress}%</Typography>
          </Box>
          <LinearProgress
            variant="determinate"
            value={progress}
            sx={{
              height: 6,
              borderRadius: 3,
              bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.08)',
              '& .MuiLinearProgress-bar': {
                borderRadius: 3,
                background: 'linear-gradient(90deg, #059669, #10b981)',
              },
            }}
          />
        </Box>

        {/* Tags */}
        {tags.length > 0 && (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75, mb: 2 }}>
            {tags.map((tag, index) => (
              <Chip
                key={index}
                label={tag}
                size="small"
                sx={{
                  height: 22,
                  fontSize: '0.68rem',
                  bgcolor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)',
                  color: 'text.secondary',
                  border: '1px solid',
                  borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
                }}
              />
            ))}
          </Box>
        )}

        {/* Footer: collaborators + actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', pt: 2, borderTop: '1px solid', borderColor: (t) => t.palette.mode === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Group sx={{ fontSize: 16, color: 'text.disabled' }} />
            <AvatarGroup max={4} sx={{ '& .MuiAvatar-root': { width: 28, height: 28, fontSize: '0.7rem', border: '2px solid', borderColor: 'background.paper' } }}>
              <Tooltip title={`Lead: ${leadResearcher.firstName || 'Lead'} ${leadResearcher.lastName || 'Researcher'}`}>
                <Avatar
                  src={leadResearcher.avatar || leadResearcher.profilePicture}
                  sx={{ background: 'linear-gradient(135deg, #059669, #14b8a6)' }}
                >
                  {(leadResearcher.firstName || 'L')[0]}
                </Avatar>
              </Tooltip>
              {collaborators.map((collaborator) => {
                const collaboratorId = collaborator._id || collaborator.id || Math.random().toString();

                return (
                  <Tooltip
                    key={collaboratorId}
                    title={`${collaborator.firstName || 'Collaborator'} ${collaborator.lastName || ''}`}
                  >
                    <Avatar
                      src={collaborator.avatar || collaborator.profilePicture}
                      sx={{ background: 'linear-gradient(135deg, #059669, #14b8a6)' }}
                    >
                      {(collaborator.firstName || 'C')[0]}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </AvatarGroup>
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.7rem' }}>
              {collaborators.length + 1} members
            </Typography>
          </Box>

          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {documents.length > 0 && (
              <Chip
                icon={<Description sx={{ fontSize: '13px !important' }} />}
                label={`${documents.length} docs`}
                size="small"
                variant="outlined"
                sx={{ height: 24, fontSize: '0.68rem' }}
              />
            )}

            {isLeadResearcher ? (
              <Box sx={{ display: 'flex', gap: 0.75 }}>
                <Button
                  variant="outlined"
                  size="small"
                  onClick={() => onEdit?.(projectId)}
                  sx={{ borderRadius: '8px', fontSize: '0.75rem', borderColor: 'rgba(16,185,129,0.5)', color: '#10b981', '&:hover': { borderColor: '#10b981', bgcolor: 'rgba(16,185,129,0.08)' } }}
                >
                  Edit
                </Button>
                <Tooltip title="Delete project">
                  <IconButton
                    size="small"
                    onClick={() => onDelete?.(projectId)}
                    sx={{ color: 'error.main', border: '1px solid', borderColor: 'error.light', borderRadius: '8px', '&:hover': { bgcolor: 'error.main', color: '#fff' } }}
                  >
                    <Delete sx={{ fontSize: 16 }} />
                  </IconButton>
                </Tooltip>
              </Box>
            ) : isCollaborator ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onLeave?.(projectId)}
                color="error"
                disabled={isLeaving}
                sx={{ borderRadius: '8px', fontSize: '0.75rem' }}
              >
                {isLeaving ? 'Leaving…' : 'Leave'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => onCollaborate?.(projectId)}
                disabled={isCollaborating}
                sx={{ borderRadius: '8px', fontSize: '0.75rem', background: 'linear-gradient(135deg, #059669, #10b981)', '&:hover': { background: 'linear-gradient(135deg, #047857, #059669)' } }}
              >
                {isCollaborating ? 'Joining…' : 'Collaborate'}
              </Button>
            )}
          </Box>
        </Box>

        {/* Date footer */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, mt: 1.5 }}>
          <CalendarToday sx={{ fontSize: 12, color: 'text.disabled' }} />
          <Typography variant="caption" sx={{ color: 'text.disabled', fontSize: '0.7rem' }}>
            Started {formatDate(project.startDate || new Date().toISOString())}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResearchCard;
