import React from 'react';
import {
  Card,
  CardContent,
  CardMedia,
  Typography,
  Box,
  Chip,
  Button,
  IconButton,
} from '@mui/material';

const getMediaUrl = (url: string): string => {
  if (!url) return '';
  if (url.startsWith('http') || url.startsWith('blob:')) return url;
  // Use relative path - Vite will proxy /uploads to API Gateway
  return `${url.startsWith('/') ? '' : '/'}${url}`;
};
import {
  CalendarToday,
  LocationOn,
  Videocam,
  People,
  Share,
} from '@mui/icons-material';
import { Event } from '@types';
import { formatDateTime } from '@utils';
import { EVENT_TYPES } from '@utils';

interface EventCardProps {
  event: Event;
  onRsvp?: (eventId: string) => void;
  onCancelRsvp?: (eventId: string) => void;
  isAttending?: boolean;
}

export const EventCard: React.FC<EventCardProps> = ({
  event,
  onRsvp,
  onCancelRsvp,
  isAttending = false,
}) => {
  const eventId = event._id || event.id || '';
  const eventTypeLabel = EVENT_TYPES.find((t) => t.value === event.type)?.label || event.type;
  const attendees = Array.isArray(event.attendees) ? event.attendees : [];
  const isOnline = event.isOnline ?? event.isVirtual ?? false;
  const maxAttendees = event.maxAttendees ?? event.capacity;
  const isFull = maxAttendees ? attendees.length >= maxAttendees : false;
  const capacityPct = maxAttendees ? Math.min((attendees.length / maxAttendees) * 100, 100) : 0;
  const hasBanner = !!(event.banner || event.imageUrl || event.coverImage);

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
      {/* Banner image with gradient overlay */}
      <Box sx={{ position: 'relative', height: hasBanner ? 180 : 0, overflow: 'hidden' }}>
        {hasBanner && (
          <>
            <CardMedia
              component="img"
              height="180"
              image={getMediaUrl(event.coverImage || event.banner || event.imageUrl || '')}
              alt={event.title || 'Event banner'}
              sx={{ objectFit: 'cover', width: '100%', height: '100%', display: 'block' }}
              onError={(e: any) => {
                e.target.closest('[data-banner]').style.display = 'none';
              }}
            />
            {/* Gradient overlay */}
            <Box
              sx={{
                position: 'absolute',
                inset: 0,
                background:
                  'linear-gradient(to bottom, rgba(0,0,0,0.10) 0%, rgba(0,0,0,0.55) 100%)',
              }}
            />
          </>
        )}

        {/* Top badges — rendered inside banner when present, otherwise in content */}
        {hasBanner && (
          <Box
            sx={{
              position: 'absolute',
              top: 12,
              left: 12,
              right: 12,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'flex-start',
            }}
          >
            {/* Event-type badge (top-left) */}
            <Chip
              label={eventTypeLabel || 'Event'}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.03em',
                border: 'none',
                boxShadow: '0 2px 8px rgba(16,185,129,0.35)',
                height: 24,
              }}
            />
            {/* Online / In-Person badge (top-right) */}
            {isOnline ? (
              <Chip
                icon={<Videocam sx={{ fontSize: 14, color: '#14b8a6 !important' }} />}
                label="Online"
                size="small"
                sx={{
                  background: 'rgba(20,184,166,0.18)',
                  color: '#14b8a6',
                  border: '1px solid rgba(20,184,166,0.45)',
                  backdropFilter: 'blur(6px)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 24,
                }}
              />
            ) : (
              <Chip
                icon={<LocationOn sx={{ fontSize: 14, color: '#a3e635 !important' }} />}
                label="In Person"
                size="small"
                sx={{
                  background: 'rgba(163,230,53,0.14)',
                  color: '#a3e635',
                  border: '1px solid rgba(163,230,53,0.38)',
                  backdropFilter: 'blur(6px)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 24,
                }}
              />
            )}
          </Box>
        )}
      </Box>

      <CardContent sx={{ p: 2.5 }}>
        {/* Badges when there is no banner */}
        {!hasBanner && (
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Chip
              label={eventTypeLabel || 'Event'}
              size="small"
              sx={{
                background: 'linear-gradient(135deg, #059669, #10b981)',
                color: '#fff',
                fontWeight: 700,
                fontSize: '0.68rem',
                letterSpacing: '0.03em',
                border: 'none',
                boxShadow: '0 2px 8px rgba(16,185,129,0.28)',
                height: 24,
              }}
            />
            {isOnline ? (
              <Chip
                icon={<Videocam sx={{ fontSize: 14, color: '#14b8a6 !important' }} />}
                label="Online"
                size="small"
                sx={{
                  background: 'rgba(20,184,166,0.14)',
                  color: '#14b8a6',
                  border: '1px solid rgba(20,184,166,0.40)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 24,
                }}
              />
            ) : (
              <Chip
                icon={<LocationOn sx={{ fontSize: 14, color: '#a3e635 !important' }} />}
                label="In Person"
                size="small"
                sx={{
                  background: 'rgba(163,230,53,0.10)',
                  color: '#a3e635',
                  border: '1px solid rgba(163,230,53,0.32)',
                  fontWeight: 600,
                  fontSize: '0.68rem',
                  height: 24,
                }}
              />
            )}
          </Box>
        )}

        {/* Title */}
        <Typography
          variant="h6"
          sx={{
            fontWeight: 800,
            fontSize: '1.05rem',
            lineHeight: 1.3,
            mb: 1.5,
            color: 'inherit',
            letterSpacing: '-0.01em',
          }}
        >
          {event.title}
        </Typography>

        {/* Date */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.75 }}>
          <CalendarToday sx={{ fontSize: 15, color: '#10b981' }} />
          <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
            {formatDateTime(event.startDate)}
          </Typography>
        </Box>

        {/* Location */}
        {event.location && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
            <LocationOn sx={{ fontSize: 15, color: '#14b8a6' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.82rem' }}>
              {event.location}
            </Typography>
          </Box>
        )}

        {/* Description */}
        <Typography
          variant="body2"
          sx={{
            color: 'text.secondary',
            fontSize: '0.82rem',
            lineHeight: 1.55,
            mb: 2,
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            overflow: 'hidden',
          }}
        >
          {event.description || 'No description provided.'}
        </Typography>

        {/* Attendees + capacity bar */}
        <Box sx={{ mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: maxAttendees ? 0.75 : 0 }}>
            <People sx={{ fontSize: 15, color: '#6366f1' }} />
            <Typography variant="body2" sx={{ color: 'text.secondary', fontSize: '0.80rem' }}>
              {attendees.length}
              {maxAttendees && ` / ${maxAttendees}`} attending
            </Typography>
          </Box>
          {maxAttendees && (
            <Box
              sx={{
                height: 4,
                borderRadius: 4,
                background: 'rgba(255,255,255,0.08)',
                overflow: 'hidden',
              }}
            >
              <Box
                sx={{
                  height: '100%',
                  width: `${capacityPct}%`,
                  borderRadius: 4,
                  background:
                    capacityPct >= 90
                      ? 'linear-gradient(90deg, #ef4444, #f97316)'
                      : 'linear-gradient(90deg, #059669, #10b981)',
                  transition: 'width 0.4s ease',
                }}
              />
            </Box>
          )}
        </Box>

        {/* Footer actions */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            pt: 1.5,
            borderTop: '1px solid rgba(255,255,255,0.07)',
          }}
        >
          <IconButton
            size="small"
            sx={{
              color: 'text.secondary',
              '&:hover': { color: '#10b981', background: 'rgba(16,185,129,0.10)' },
            }}
          >
            <Share sx={{ fontSize: 17 }} />
          </IconButton>

          <Box sx={{ display: 'flex', gap: 1 }}>
            {isAttending ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onCancelRsvp?.(eventId)}
                sx={{
                  borderColor: 'rgba(239,68,68,0.55)',
                  color: '#ef4444',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  px: 2,
                  '&:hover': {
                    background: 'rgba(239,68,68,0.08)',
                    borderColor: '#ef4444',
                  },
                }}
              >
                Cancel RSVP
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => onRsvp?.(eventId)}
                disabled={isFull}
                sx={{
                  background: isFull
                    ? 'rgba(255,255,255,0.10)'
                    : 'linear-gradient(135deg, #059669, #10b981)',
                  color: '#fff',
                  fontWeight: 700,
                  fontSize: '0.75rem',
                  borderRadius: '10px',
                  px: 2.5,
                  boxShadow: isFull ? 'none' : '0 2px 10px rgba(16,185,129,0.35)',
                  border: 'none',
                  '&:hover': {
                    background: isFull
                      ? 'rgba(255,255,255,0.10)'
                      : 'linear-gradient(135deg, #047857, #059669)',
                    boxShadow: isFull ? 'none' : '0 4px 16px rgba(16,185,129,0.45)',
                  },
                  '&.Mui-disabled': {
                    color: 'rgba(255,255,255,0.35)',
                    background: 'rgba(255,255,255,0.07)',
                  },
                }}
              >
                {isFull ? 'Full' : 'RSVP'}
              </Button>
            )}
          </Box>
        </Box>
      </CardContent>
    </Card>
  );
};

export default EventCard;
