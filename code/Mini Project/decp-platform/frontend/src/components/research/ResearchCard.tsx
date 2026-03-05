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
} from '@mui/material';

const getMediaUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  // Use relative path - Vite will proxy /uploads to API Gateway
  return `${url.startsWith('/') ? '' : '/'}${url}`;
};
import {
  Science,
  CalendarToday,
  Group,
  Description,
  Person,
} from '@mui/icons-material';
import { ResearchProject, User } from '@types';
import { formatDate } from '@utils';
import { RESEARCH_STATUS } from '@utils';

interface ResearchCardProps {
  project: ResearchProject;
  onCollaborate?: (projectId: string) => void;
  onLeave?: (projectId: string) => void;
  isCollaborator?: boolean;
  isCollaborating?: boolean;
  isLeaving?: boolean;
  isLeadResearcher?: boolean;
  onEdit?: (projectId: string) => void;
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

  return (
    <Card className="mb-4 shadow-card hover:shadow-card-hover transition-all duration-300">
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
      <CardContent>
        <Box className="flex justify-between items-start mb-3">
          <Chip
            icon={<Science fontSize="small" />}
            label={project.field || 'General'}
            size="small"
            color="primary"
            variant="outlined"
          />
          <Chip
            label={statusConfig?.label || project.status || 'Ongoing'}
            size="small"
            sx={{
              backgroundColor: statusConfig?.color || '#2196f3',
              color: '#fff',
            }}
          />
        </Box>

        <Typography variant="h6" className="font-semibold mb-2">
          {project.title || 'Untitled Research Project'}
        </Typography>

        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
          {project.description || 'No description provided.'}
        </Typography>

        <Box className="flex items-center gap-1 mb-4">
          <Person fontSize="small" sx={{ color: 'text.secondary', fontSize: 16 }} />
          <Typography variant="caption" sx={{ color: 'text.secondary', fontWeight: 500 }}>
            Lead Researcher:
          </Typography>
          <Typography variant="caption" sx={{ color: 'text.primary', fontWeight: 600 }}>
            {typeof leadResearcher === 'string'
              ? leadResearcher
              : `${leadResearcher.firstName || 'Lead'} ${leadResearcher.lastName || 'Researcher'}`}
          </Typography>
        </Box>

        <Box className="mb-4">
          <Box className="flex justify-between mb-1">
            <Typography variant="caption" className="text-gray-500">
              Progress
            </Typography>
            <Typography variant="caption" className="text-gray-500">
              {getProgress()}%
            </Typography>
          </Box>
          <LinearProgress variant="determinate" value={getProgress()} className="h-2 rounded-full" />
        </Box>

        {tags.length > 0 && (
          <Box className="flex flex-wrap gap-2 mb-4">
            {tags.map((tag, index) => (
              <Chip key={index} label={tag} size="small" className="bg-gray-100 dark:bg-gray-800" />
            ))}
          </Box>
        )}

        <Box className="flex items-center justify-between">
          <Box className="flex items-center gap-2">
            <Group fontSize="small" className="text-gray-400" />
            <AvatarGroup max={4}>
              <Tooltip title={`Lead: ${leadResearcher.firstName || 'Lead'} ${leadResearcher.lastName || 'Researcher'}`}>
                <Avatar
                  src={leadResearcher.avatar || leadResearcher.profilePicture}
                  className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600"
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
                      className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600"
                    >
                      {(collaborator.firstName || 'C')[0]}
                    </Avatar>
                  </Tooltip>
                );
              })}
            </AvatarGroup>
            <Typography variant="caption" className="text-gray-500 ml-2">
              {collaborators.length + 1} members
            </Typography>
          </Box>

          <Box className="flex items-center gap-2">
            {documents.length > 0 && (
              <Chip
                icon={<Description fontSize="small" />}
                label={`${documents.length} docs`}
                size="small"
                variant="outlined"
              />
            )}

            {isLeadResearcher ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onEdit?.(projectId)}
              >
                Edit Project
              </Button>
            ) : isCollaborator ? (
              <Button variant="outlined" size="small" onClick={() => onLeave?.(projectId)} color="error" disabled={isLeaving}>
                {isLeaving ? 'Leaving…' : 'Leave'}
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => onCollaborate?.(projectId)}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
                disabled={isCollaborating}
              >
                {isCollaborating ? 'Joining…' : 'Collaborate'}
              </Button>
            )}
          </Box>
        </Box>

        <Box className="flex items-center gap-2 mt-3 text-gray-500">
          <CalendarToday fontSize="small" />
          <Typography variant="caption">
            Started {formatDate(project.startDate || new Date().toISOString())}
          </Typography>
        </Box>
      </CardContent>
    </Card>
  );
};

export default ResearchCard;