import React from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
  Avatar,
} from '@mui/material';
import {
  LocationOn,
  Work,
  Schedule,
  Bookmark,
  BookmarkBorder,
} from '@mui/icons-material';
import { Job } from '@types';
import { formatDate, formatCurrency } from '@utils';
import { JOB_TYPES } from '@utils';

interface JobCardProps {
  job: Job;
  onApply?: (job: Job) => void;
  onView?: (job: Job) => void;
}

export const JobCard: React.FC<JobCardProps> = ({ job, onApply, onView }) => {
  const [isSaved, setIsSaved] = React.useState(false);
  
  const jobTypeLabel = JOB_TYPES.find((t) => t.value === job.type)?.label || job.type;
  const company = job.company || 'Unknown Company';

  return (
    <Card className="mb-4 shadow-card hover:shadow-card-hover transition-all duration-300">
      <CardContent>
        <Box className="flex justify-between items-start">
          <Box className="flex gap-4 flex-1">
            <Avatar
              className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 text-2xl"
            >
              {company[0] || 'J'}
            </Avatar>
            <Box className="flex-1">
              <Typography variant="h6" className="font-semibold text-gray-900 dark:text-gray-100">
                {job.title || 'Untitled Job'}
              </Typography>
              <Typography variant="subtitle1" className="text-gray-600 dark:text-gray-400">
                {company}
              </Typography>
              
              <Box className="flex flex-wrap gap-2 mt-2">
                <Chip
                  icon={<LocationOn fontSize="small" />}
                  label={job.location || 'Location not specified'}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Work fontSize="small" />}
                  label={jobTypeLabel}
                  size="small"
                  color="primary"
                  variant="outlined"
                />
                {job.salary && (
                  <Chip
                    label={`${formatCurrency(job.salary.min)} - ${formatCurrency(job.salary.max)}`}
                    size="small"
                    color="success"
                    variant="outlined"
                  />
                )}
              </Box>
            </Box>
          </Box>
          
          <IconButton onClick={() => setIsSaved(!isSaved)}>
            {isSaved ? <Bookmark color="primary" /> : <BookmarkBorder />}
          </IconButton>
        </Box>

        <Typography
          variant="body2"
          className="text-gray-600 dark:text-gray-400 mt-3 line-clamp-2"
        >
          {job.description}
          {!job.description && 'No description provided.'}
        </Typography>

        <Box className="flex justify-between items-center mt-4 pt-4 border-t border-gray-100 dark:border-gray-800">
          <Box className="flex items-center gap-2">
            <Schedule fontSize="small" className="text-gray-400" />
            <Typography variant="caption" className="text-gray-500">
              Posted {formatDate(job.createdAt || new Date().toISOString())}
            </Typography>
            {job.deadline && (
              <>
                <Typography variant="caption" className="text-gray-400">•</Typography>
                <Typography variant="caption" className="text-red-500">
                  Deadline: {formatDate(job.deadline)}
                </Typography>
              </>
            )}
          </Box>
          
          <Box className="flex gap-2">
            <Button
              variant="outlined"
              size="small"
              onClick={() => onView?.(job)}
            >
              View
            </Button>
            <Button
              variant="contained"
              size="small"
              onClick={() => onApply?.(job)}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              Apply
            </Button>
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default JobCard;
