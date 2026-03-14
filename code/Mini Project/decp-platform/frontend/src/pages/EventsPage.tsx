import React, { useState, useRef } from 'react';
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
  FormControlLabel,
  Switch,
  Paper,
  Chip,
  CircularProgress,
  InputAdornment,
  IconButton,
  Tooltip,
} from '@mui/material';
import {
  Add,
  Event,
  CalendarMonth,
  Videocam,
  Groups,
  EmojiEvents,
  PhotoCamera,
  Delete,
} from '@mui/icons-material';
import { useSelector } from 'react-redux';
import { RootState } from '@store';
import {
  useGetEventsQuery,
  useGetMyEventsQuery,
  useGetAttendingEventsQuery,
  useCreateEventMutation,
  useDeleteEventMutation,
  useRsvpEventMutation,
  useCancelRsvpMutation,
} from '@services/eventApi';
import { EventCard } from '@components/events/EventCard';
import { EventCardSkeleton, EmptyState } from '@components/common';
import { Event as EventType } from '@types';
import { EVENT_TYPES, getMediaUrl } from '@utils';

const HeroBanner: React.FC<{ eventCount: number; canCreate: boolean; onCreate: () => void }> = ({ eventCount, canCreate, onCreate }) => (
  <Paper
    elevation={0}
    sx={{
      borderRadius: '20px',
      overflow: 'hidden',
      mb: 3,
      position: 'relative',
      background: 'linear-gradient(135deg, #1e1b4b 0%, #312e81 40%, #1e1b4b 100%)',
    }}
  >
    <Box className="absolute inset-0 opacity-15" sx={{ backgroundImage: `radial-gradient(circle at 18px 18px, rgba(255,255,255,0.4) 1.5px, transparent 0)`, backgroundSize: '30px 30px' }} />
    <Box className="absolute top-0 right-0 w-64 h-64 rounded-full opacity-10" sx={{ background: 'radial-gradient(circle, #818cf8 0%, transparent 70%)', transform: 'translate(30%, -30%)' }} />
    <Box className="absolute bottom-0 left-0 w-48 h-48 rounded-full opacity-10" sx={{ background: 'radial-gradient(circle, #166534 0%, transparent 70%)', transform: 'translate(-30%, 40%)' }} />

    <Box className="relative p-6 sm:p-8">
      <Box className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <Box>
          <Box className="flex items-center gap-2 mb-2">
            <Box sx={{ width: 40, height: 40, borderRadius: '12px', background: 'rgba(129,140,248,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Event sx={{ color: '#a5b4fc', fontSize: 22 }} />
            </Box>
            <Typography variant="h5" sx={{ fontWeight: 800, color: '#fff' }}>
              Events & Webinars
            </Typography>
          </Box>
          <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', mb: 2 }}>
            Stay connected through workshops, seminars, career fairs and networking events
          </Typography>
          <Box className="flex flex-wrap gap-2">
            <Chip icon={<CalendarMonth sx={{ fontSize: '14px !important' }} />} label={`${eventCount} Upcoming`} size="small"
              sx={{ background: 'rgba(129,140,248,0.2)', color: '#a5b4fc', borderColor: 'rgba(129,140,248,0.35)', fontWeight: 600 }} variant="outlined" />
            <Chip icon={<Videocam sx={{ fontSize: '14px !important' }} />} label="Online & In-Person" size="small"
              sx={{ background: 'rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.8)', borderColor: 'rgba(255,255,255,0.2)', fontWeight: 600 }} variant="outlined" />
            <Chip icon={<Groups sx={{ fontSize: '14px !important' }} />} label="Open to All" size="small"
              sx={{ background: 'rgba(255,255,255,0.12)', color: 'rgba(255,255,255,0.92)', borderColor: 'rgba(255,255,255,0.3)', fontWeight: 600 }} variant="outlined" />
          </Box>
        </Box>
        {canCreate && (
          <Button variant="contained" startIcon={<Add />} onClick={onCreate}
            sx={{ background: 'linear-gradient(135deg, #6366f1, #818cf8)', borderRadius: '12px', px: 3, py: 1.5, fontWeight: 700, whiteSpace: 'nowrap', boxShadow: '0 4px 15px rgba(99,102,241,0.35)' }}>
            Create Event
          </Button>
        )}
      </Box>
    </Box>
  </Paper>
);

export const EventsPage: React.FC = () => {
  const { user } = useSelector((state: RootState) => state.auth);
  const [activeTab, setActiveTab] = useState(0);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [isOnline, setIsOnline] = useState(false);
  const [coverImage, setCoverImage] = useState('');
  const [coverUploading, setCoverUploading] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  // Track RSVP state locally since the list endpoint does not include RSVPs per event
  const [attendingIds, setAttendingIds] = useState<Set<string>>(new Set());
  // Delete confirmation state
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleteConfirmTitle, setDeleteConfirmTitle] = useState('');

  const { data: allEventsData, isLoading: isLoadingAll } = useGetEventsQuery({}, { skip: activeTab !== 0 });
  const { data: myEventsData, isLoading: isLoadingMy } = useGetMyEventsQuery({}, { skip: activeTab !== 1 });
  const { data: attendingData, isLoading: isLoadingAttending } = useGetAttendingEventsQuery({}, { skip: activeTab !== 2 });
  const [createEvent, { isLoading: isCreating }] = useCreateEventMutation();
  const [deleteEvent, { isLoading: isDeleting }] = useDeleteEventMutation();
  const [rsvpEvent] = useRsvpEventMutation();
  const [cancelRsvp] = useCancelRsvpMutation();

  const canCreateEvent = user?.role === 'admin' || user?.role === 'faculty';
  const isLoading = activeTab === 0 ? isLoadingAll : activeTab === 1 ? isLoadingMy : isLoadingAttending;
  const events = activeTab === 0 ? (allEventsData?.data || []) : activeTab === 1 ? (myEventsData?.data || []) : (attendingData?.data || []);
  const totalEvents = allEventsData?.total || allEventsData?.data?.length || 0;

  // Seed attendingIds from the attending tab data when it loads
  React.useEffect(() => {
    if (attendingData?.data) {
      setAttendingIds(new Set(attendingData.data.map((e: EventType) => e._id || e.id || '')));
    }
  }, [attendingData]);

  const handleCoverUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCoverUploading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const token = localStorage.getItem('token') || sessionStorage.getItem('token') || '';
      const apiBase = import.meta.env.VITE_API_URL || 'http://localhost:3000/api/v1';
      const resp = await fetch(`${apiBase}/posts/upload`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: fd,
      });
      const data = await resp.json();
      if (data.success) setCoverImage(data.data.url);
    } catch (err) { console.error('Cover upload failed', err); }
    finally { setCoverUploading(false); }
  };

  const handleCreateEvent = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      await createEvent({
        title: formData.get('title') as string,
        description: formData.get('description') as string,
        type: formData.get('type') as any,
        startDate: formData.get('startDate') as string,
        endDate: formData.get('endDate') as string,
        location: formData.get('location') as string,
        isOnline,
        meetingLink: formData.get('meetingLink') as string,
        maxAttendees: Number(formData.get('maxAttendees')) || undefined,
        coverImage: coverImage || undefined,
      }).unwrap();
      setCreateDialogOpen(false);
      setCoverImage('');
    } catch (err) { console.error('Failed to create event:', err); }
  };

  const handleRsvp = async (eventId: string) => {
    try {
      await rsvpEvent(eventId).unwrap();
      setAttendingIds((prev) => new Set([...prev, eventId]));
    } catch (e) { console.error(e); }
  };

  const handleCancelRsvp = async (eventId: string) => {
    try {
      await cancelRsvp(eventId).unwrap();
      setAttendingIds((prev) => { const next = new Set(prev); next.delete(eventId); return next; });
    } catch (e) { console.error(e); }
  };

  const handleDeleteEvent = async (eventId: string) => {
    try {
      await deleteEvent(eventId).unwrap();
      setDeleteConfirmId(null);
    } catch (e) {
      console.error('Delete failed', e);
    }
  };

  return (
    <Box className="page-enter">
      <HeroBanner eventCount={totalEvents} canCreate={canCreateEvent} onCreate={() => setCreateDialogOpen(true)} />

      <Paper elevation={0} sx={{ borderRadius: '14px', mb: 2.5, border: '1px solid', borderColor: 'divider', overflow: 'hidden' }}>
        <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)} sx={{ px: 2, minHeight: 48 }}>
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
            <CalendarMonth sx={{ fontSize: 16 }} /> Upcoming
            {totalEvents > 0 && <Chip label={totalEvents} size="small" sx={{ height: 18, fontSize: '0.65rem', fontWeight: 700, ml: 0.5 }} color="secondary" />}
          </Box>} />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><EmojiEvents sx={{ fontSize: 16 }} /> My Events</Box>} />
          <Tab label={<Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}><Groups sx={{ fontSize: 16 }} /> Attending</Box>} />
        </Tabs>
      </Paper>

      {isLoading ? (
        <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}>
          <EventCardSkeleton /><EventCardSkeleton /><EventCardSkeleton />
        </Box>
      ) : events.length === 0 ? (
        <EmptyState icon="empty"
          title={activeTab === 1 ? "No events created" : activeTab === 2 ? "Not attending any events" : "No upcoming events"}
          description={activeTab === 0 ? "Check back soon for upcoming events!" : activeTab === 1 ? "Create your first event." : "Browse upcoming events and RSVP."}
          action={canCreateEvent && activeTab !== 2 ? (
            <Button variant="contained" startIcon={<Add />} onClick={() => setCreateDialogOpen(true)} sx={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
              Create Event
            </Button>
          ) : undefined}
        />
      ) : (
        <Box
          className="stagger-children"
          sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr', lg: '1fr 1fr 1fr' }, gap: 2 }}
        >
          {events.map((event: EventType) => {
            const eventId = event._id || event.id || '';
            const isOwner =
              user?.id === event.organizerId ||
              user?._id === event.organizerId ||
              user?.id === (event as any).userId ||
              user?._id === (event as any).userId ||
              user?.id === (event as any).createdBy ||
              user?._id === (event as any).createdBy;

            return (
              <Box key={eventId} sx={{ position: 'relative' }}>
                <EventCard
                  event={event}
                  onRsvp={handleRsvp}
                  onCancelRsvp={handleCancelRsvp}
                  isAttending={attendingIds.has(eventId)}
                />
                {isOwner && (
                  <Tooltip title="Delete event">
                    <IconButton
                      size="small"
                      onClick={() => { setDeleteConfirmId(eventId); setDeleteConfirmTitle(event.title || ''); }}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        color: 'error.main',
                        bgcolor: 'background.paper',
                        boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
                        transition: 'all 0.2s ease',
                        '&:hover': {
                          bgcolor: 'error.main',
                          color: 'white',
                          transform: 'scale(1.1)',
                        },
                      }}
                    >
                      <Delete fontSize="small" />
                    </IconButton>
                  </Tooltip>
                )}
              </Box>
            );
          })}
        </Box>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog
        open={!!deleteConfirmId}
        onClose={() => setDeleteConfirmId(null)}
        maxWidth="xs"
        fullWidth
        PaperProps={{ sx: { borderRadius: '16px' } }}
      >
        <DialogTitle sx={{ fontWeight: 700 }}>Delete Event</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete <strong>"{deleteConfirmTitle}"</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
          <Button onClick={() => setDeleteConfirmId(null)} variant="outlined" sx={{ borderRadius: '10px' }}>
            Cancel
          </Button>
          <Button
            onClick={() => deleteConfirmId && handleDeleteEvent(deleteConfirmId)}
            color="error"
            variant="contained"
            disabled={isDeleting}
            sx={{ borderRadius: '10px' }}
          >
            {isDeleting ? 'Deleting…' : 'Delete'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Create Event Dialog */}
      <Dialog open={createDialogOpen} onClose={() => setCreateDialogOpen(false)} maxWidth="sm" fullWidth PaperProps={{ sx: { borderRadius: '20px' } }}>
        <form onSubmit={handleCreateEvent}>
          <DialogTitle sx={{ pb: 1, fontWeight: 700 }}>
            <Box className="flex items-center gap-2">
              <Box sx={{ width: 36, height: 36, borderRadius: '10px', background: 'linear-gradient(135deg,#6366f1,#818cf8)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Event sx={{ color: '#fff', fontSize: 18 }} />
              </Box>
              Create New Event
            </Box>
          </DialogTitle>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: '8px !important' }}>
            <TextField fullWidth name="title" label="Event Title" required />
            <TextField select fullWidth name="type" label="Event Type" required defaultValue="webinar">
              {EVENT_TYPES.map((t) => <MenuItem key={t.value} value={t.value}>{t.label}</MenuItem>)}
            </TextField>
            <TextField fullWidth name="description" label="Description" multiline rows={3} required />
            {/* Cover image URL + upload button */}
            <input type="file" accept="image/*" ref={coverInputRef} style={{ display: 'none' }} onChange={handleCoverUpload} />
            <TextField
              label="Cover Image URL (optional)"
              fullWidth
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              placeholder="Paste URL or click the camera to upload"
              size="small"
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton size="small" onClick={() => coverInputRef.current?.click()} disabled={coverUploading}>
                      {coverUploading ? <CircularProgress size={18} /> : <PhotoCamera fontSize="small" />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
            {coverImage && (
              <Box component="img" src={getMediaUrl(coverImage)} alt="Cover preview"
                sx={{ width: '100%', height: 120, objectFit: 'cover', borderRadius: '8px' }}
                onError={(e: any) => { e.target.style.display = 'none'; }}
              />
            )}
            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
              <TextField fullWidth name="startDate" label="Start Date & Time" type="datetime-local" required InputLabelProps={{ shrink: true }} />
              <TextField fullWidth name="endDate" label="End Date & Time" type="datetime-local" required InputLabelProps={{ shrink: true }} />
            </Box>
            <FormControlLabel control={<Switch checked={isOnline} onChange={(e) => setIsOnline(e.target.checked)} color="primary" />} label="Online Event" />
            {isOnline ? (
              <TextField fullWidth name="meetingLink" label="Meeting Link" placeholder="https://..." />
            ) : (
              <TextField fullWidth name="location" label="Venue / Location" />
            )}
            <TextField fullWidth name="maxAttendees" label="Max Attendees (optional)" type="number" />
          </DialogContent>
          <DialogActions sx={{ px: 3, pb: 3, gap: 1 }}>
            <Button onClick={() => setCreateDialogOpen(false)} variant="outlined" sx={{ borderRadius: '10px' }}>Cancel</Button>
            <Button type="submit" variant="contained" disabled={isCreating} sx={{ background: 'linear-gradient(135deg,#6366f1,#818cf8)' }}>
              {isCreating ? 'Creating…' : 'Create Event'}
            </Button>
          </DialogActions>
        </form>
      </Dialog>
    </Box>
  );
};

export default EventsPage;
