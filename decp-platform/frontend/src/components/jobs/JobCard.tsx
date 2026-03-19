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
    <Card
      sx={{
        mb: 2,
        borderRadius: '20px',
        border: '1px solid',
        borderColor: 'rgba(255,255,255,0.08)',
        background: 'rgba(255,255,255,0.04)',
        backdropFilter: 'blur(14px)',
        WebkitBackdropFilter: 'blur(14px)',
        overflow: 'hidden',
        transition: 'transform 0.25s ease, box-shadow 0.25s ease',
        boxShadow: '0 4px 24px rgba(0,0,0,0.18)',
        '.light &, [data-theme="light"] &': {
          background: 'rgba(255,255,255,0.70)',
          borderColor: 'rgba(0,0,0,0.06)',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08)',
        },
        '&:hover': {
          transform: 'translateY(-2px)',
          boxShadow: '0 8px 32px rgba(16,185,129,0.18), 0 2px 12px rgba(0,0,0,0.22)',
        },
      }}
    >
      <CardContent sx={{ p: 2.5 }}>
        {/* Header row: avatar + info + bookmark */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <Box sx={{ display: 'flex', gap: 2, flex: 1, minWidth: 0 }}>
            {/* Company avatar with green/teal gradient */}
            <Avatar
              sx={{
                width: 56,
                height: 56,
                flexShrink: 0,
                background: 'linear-gradient(135deg, #059669, #14b8a6)',
                fontSize: '1.4rem',
                fontWeight: 800,
                color: '#fff',
                boxShadow: '0 4px 14px rgba(5,150,105,0.40)',
                border: '2px solid rgba(16,185,129,0.25)',
              }}
            >
              {company[0]?.toUpperCase() || 'J'}
            </Avatar>

            {/* Title + company + chips */}
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography
                variant="h6"
                sx={{
                  fontWeight: 800,
                  fontSize: '1.02rem',
                  lineHeight: 1.3,
                  letterSpacing: '-0.01em',
                  color: 'inherit',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}
              >
                {job.title || 'Untitled Job'}
              </Typography>

              <Typography
                variant="subtitle2"
                sx={{
                  color: 'text.secondary',
                  fontWeight: 500,
                  fontSize: '0.85rem',
                  mb: 1.25,
                }}
              >
                {company}
              </Typography>

              {/* Chips row */}
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.75 }}>
                {/* Location chip — neutral gray */}
                <Chip
                  icon={<LocationOn sx={{ fontSize: 13, color: 'text.secondary !important' }} />}
                  label={job.location || 'Location not specified'}
                  size="small"
                  sx={{
                    background: 'rgba(255,255,255,0.06)',
                    color: 'text.secondary',
                    border: '1px solid rgba(255,255,255,0.10)',
                    fontSize: '0.72rem',
                    height: 24,
                    fontWeight: 500,
                  }}
                />

                {/* Job-type chip — teal/emerald */}
                <Chip
                  icon={<Work sx={{ fontSize: 13, color: '#14b8a6 !important' }} />}
                  label={jobTypeLabel}
                  size="small"
                  sx={{
                    background: 'rgba(20,184,166,0.12)',
                    color: '#14b8a6',
                    border: '1px solid rgba(20,184,166,0.35)',
                    fontSize: '0.72rem',
                    height: 24,
                    fontWeight: 600,
                  }}
                />

                {/* Salary chip — green */}
                {job.salary && (
                  <Chip
                    label={`${formatCurrency(job.salary.min)} – ${formatCurrency(job.salary.max)}`}
                    size="small"
                    sx={{
                      background: 'rgba(16,185,129,0.12)',
                      color: '#10b981',
                      border: '1px solid rgba(16,185,129,0.35)',
                      fontSize: '0.72rem',
                      height: 24,
                      fontWeight: 600,
                    }}
                  />
                )}
              </Box>
            </Box>
          </Box>

          {/* Bookmark toggle */}
          <IconButton
            onClick={() => setIsSaved(!isSaved)}
            size="small"
            sx={{
              ml: 1,
              flexShrink: 0,
              color: isSaved ? '#10b981' : 'text.secondary',
              background: isSaved ? 'rgba(16,185,129,0.10)' : 'transparent',
              borderRadius: '10px',
              transition: 'color 0.2s, background 0.2s',
              '&:hover': {
                background: 'rgba(16,185,129,0.12)',
                color: '#10b981',
              },
            }}
          >
            {isSaved ? <Bookmark sx={{ fontSize: 20 }} /> : <BookmarkBorder sx={{ fontSize: 20 }} />}
          </IconButton>
        </Box>

        {/* Description — 2-line clamp */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            mt: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {job.description || 'No description provided.'}
        </Typography>

        {/* Footer: dates + action buttons */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            mt: 2.5,
            pt: 2,
            borderTop: '1px solid rgba(255,255,255,0.07)',
            flexWrap: 'wrap',
            gap: 1,
          }}
        >
          {/* Posted / deadline */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, flexWrap: 'wrap' }}>
            <Schedule sx={{ fontSize: 14, color: 'text.disabled' }} />
            <Typography variant="caption" sx={{ color: 'text.secondary', fontSize: '0.75rem' }}>
              Posted {formatDate(job.createdAt || new Date().toISOString())}
            </Typography>
            {job.deadline && (
              <>
                <Typography variant="caption" sx={{ color: 'text.disabled' }}>•</Typography>
                <Typography
                  variant="caption"
                  sx={{ color: '#f87171', fontWeight: 600, fontSize: '0.75rem' }}
                >
                  Deadline: {formatDate(job.deadline)}
                </Typography>
              </>
            )}
          </Box>

          {/* Buttons */}
          <Box sx={{ display: 'flex', gap: 1 }}>
            <Button
              variant="outlined"
              size="small"
              onClick={() => onView?.(job)}
              sx={{
                borderColor: 'rgba(255,255,255,0.18)',
                color: 'text.secondary',
                fontWeight: 600,
                fontSize: '0.75rem',
                borderRadius: '10px',
                px: 2,
                '&:hover': {
                  borderColor: 'rgba(16,185,129,0.55)',
                  color: '#10b981',
                  background: 'rgba(16,185,129,0.06)',
                },
              }}
            >
              View
            </Button>

            <Button
              variant="contained"
              size="small"
              onClick={() => onApply?.(job)}
              sx={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.75rem',
                borderRadius: '10px',
                px: 2.5,
                border: 'none',
                boxShadow: '0 2px 10px rgba(16,185,129,0.35)',
                '&:hover': {
                  background: 'linear-gradient(135deg, #047857, #059669)',
                  boxShadow: '0 4px 16px rgba(16,185,129,0.45)',
                },
              }}
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
