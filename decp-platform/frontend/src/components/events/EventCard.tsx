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

  return (
    <Card className="mb-4 shadow-card hover:shadow-card-hover transition-all duration-300 overflow-hidden">
      {(event.banner || event.imageUrl || event.coverImage) && (
        <CardMedia
          component="img"
          height="160"
          image={getMediaUrl(event.coverImage || event.banner || event.imageUrl || '')}
          alt={event.title || 'Event banner'}
          className="object-cover"
          onError={(e: any) => { e.target.style.display = 'none'; }}
        />
      )}
      <CardContent>
        <Box className="flex justify-between items-start mb-3">
          <Chip
            label={eventTypeLabel || 'Event'}
            size="small"
            color="primary"
            className="rounded-full"
          />
          {isOnline ? (
            <Chip
              icon={<Videocam fontSize="small" />}
              label="Online"
              size="small"
              color="success"
              variant="outlined"
            />
          ) : (
            <Chip
              icon={<LocationOn fontSize="small" />}
              label="In Person"
              size="small"
              variant="outlined"
            />
          )}
        </Box>

        <Typography variant="h6" className="font-semibold mb-2">
          {event.title}
        </Typography>

        <Box className="flex items-center gap-2 mb-2">
          <CalendarToday fontSize="small" className="text-gray-400" />
          <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
            {formatDateTime(event.startDate)}
          </Typography>
        </Box>

        {event.location && (
          <Box className="flex items-center gap-2 mb-3">
            <LocationOn fontSize="small" className="text-gray-400" />
            <Typography variant="body2" className="text-gray-600 dark:text-gray-400">
              {event.location}
            </Typography>
          </Box>
        )}

        <Typography
          variant="body2"
          className="text-gray-600 dark:text-gray-400 mb-4 line-clamp-2"
        >
          {event.description}
          {!event.description && 'No description provided.'}
        </Typography>

        <Box className="flex justify-between items-center">
          <Box className="flex items-center gap-2">
            <People fontSize="small" className="text-gray-400" />
            <Typography variant="body2" className="text-gray-500">
              {attendees.length}
              {maxAttendees && ` / ${maxAttendees}`} attending
            </Typography>
          </Box>

          <Box className="flex gap-2">
            <IconButton size="small">
              <Share fontSize="small" />
            </IconButton>

            {isAttending ? (
              <Button
                variant="outlined"
                size="small"
                onClick={() => onCancelRsvp?.(eventId)}
                color="error"
              >
                Cancel
              </Button>
            ) : (
              <Button
                variant="contained"
                size="small"
                onClick={() => onRsvp?.(eventId)}
                disabled={isFull}
                className="bg-gradient-to-r from-blue-500 to-purple-600"
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
