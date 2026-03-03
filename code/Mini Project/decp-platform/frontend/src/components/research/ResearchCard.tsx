import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  LinearProgress,
  Avatar,
  AvatarGroup,
  Tooltip,
} from '@mui/material';
import {
  Science,
  CalendarToday,
  Group,
  Description,
} from '@mui/icons-material';
import { ResearchProject, User } from '@types';
import { formatDate } from '@utils';
import { RESEARCH_STATUS } from '@utils';

interface ResearchCardProps {
  project: ResearchProject;
  onCollaborate?: (projectId: string) => void;
  onLeave?: (projectId: string) => void;
  isCollaborator?: boolean;
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
    if (project.status === 'published') return 100;
    if (project.status === 'completed') return 90;
    if (project.endDate) {
      const start = new Date(project.startDate || Date.now()).getTime();
      const end = new Date(project.endDate).getTime();
      const now = Date.now();
      return Math.min(100, Math.round(((now - start) / (end - start)) * 100));
    }
    return 50;
  };

  return (
    <Card className="mb-4 shadow-card hover:shadow-card-hover transition-all duration-300">
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

        <Typography variant="body2" className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
          {project.description || 'No description provided.'}
        </Typography>

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

            {isCollaborator ? (
              <Button variant="outlined" size="small" onClick={() => onLeave?.(projectId)} color="error">
                Leave
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => onCollaborate?.(projectId)}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
              >
                Collaborate
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