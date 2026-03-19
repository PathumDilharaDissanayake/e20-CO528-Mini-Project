import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Event, PaginatedResponse, PaginationParams } from '../types';
import { eventsService } from '../services/eventsService';

interface EventsState {
  events: Event[];
  currentEvent: Event | null;
  myEvents: Event[];
  isLoading: boolean;
  isLoadingMore: boolean;
  error: string | null;
  page: number;
  hasMore: boolean;
  total: number;
}

const initialState: EventsState = {
  events: [],
  currentEvent: null,
  myEvents: [],
  isLoading: false,
  isLoadingMore: false,
  error: null,
  page: 1,
  hasMore: true,
  total: 0,
};

export const fetchEvents = createAsyncThunk(
  'events/fetchEvents',
  async (params: PaginationParams = {}, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEvents(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch events');
    }
  }
);

export const fetchMoreEvents = createAsyncThunk(
  'events/fetchMoreEvents',
  async (params: PaginationParams = {}, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEvents(params);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch more events');
    }
  }
);

export const fetchEventById = createAsyncThunk(
  'events/fetchEventById',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.getEventById(eventId);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch event');
    }
  }
);

export const createEvent = createAsyncThunk(
  'events/createEvent',
  async (eventData: Partial<Event>, { rejectWithValue }) => {
    try {
      const response = await eventsService.createEvent(eventData);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to create event');
    }
  }
);

export const updateEvent = createAsyncThunk(
  'events/updateEvent',
  async ({ eventId, data }: { eventId: string; data: Partial<Event> }, { rejectWithValue }) => {
    try {
      const response = await eventsService.updateEvent(eventId, data);
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to update event');
    }
  }
);

export const deleteEvent = createAsyncThunk(
  'events/deleteEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      await eventsService.deleteEvent(eventId);
      return eventId;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to delete event');
    }
  }
);

export const attendEvent = createAsyncThunk(
  'events/attendEvent',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.attendEvent(eventId);
      return { eventId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to attend event');
    }
  }
);

export const cancelAttendance = createAsyncThunk(
  'events/cancelAttendance',
  async (eventId: string, { rejectWithValue }) => {
    try {
      const response = await eventsService.cancelAttendance(eventId);
      return { eventId, ...response };
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to cancel attendance');
    }
  }
);

export const fetchMyEvents = createAsyncThunk(
  'events/fetchMyEvents',
  async (_, { rejectWithValue }) => {
    try {
      const response = await eventsService.getMyEvents();
      return response;
    } catch (error: any) {
      return rejectWithValue(error.response?.data?.message || 'Failed to fetch my events');
    }
  }
);

const eventsSlice = createSlice({
  name: 'events',
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
    clearCurrentEvent: (state) => {
      state.currentEvent = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEvents.fulfilled, (state, action: PayloadAction<PaginatedResponse<Event>>) => {
        state.isLoading = false;
        state.events = action.payload.data;
        state.total = action.payload.total;
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(fetchMoreEvents.pending, (state) => {
        state.isLoadingMore = true;
        state.error = null;
      })
      .addCase(fetchMoreEvents.fulfilled, (state, action: PayloadAction<PaginatedResponse<Event>>) => {
        state.isLoadingMore = false;
        state.events = [...state.events, ...action.payload.data];
        state.page = action.payload.page;
        state.hasMore = action.payload.hasMore;
      })
      .addCase(fetchMoreEvents.rejected, (state, action) => {
        state.isLoadingMore = false;
        state.error = action.payload as string;
      })
      .addCase(fetchEventById.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchEventById.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        state.currentEvent = action.payload;
      })
      .addCase(fetchEventById.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(createEvent.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(createEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        state.isLoading = false;
        state.events = [action.payload, ...state.events];
        state.total += 1;
      })
      .addCase(createEvent.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      })
      .addCase(updateEvent.fulfilled, (state, action: PayloadAction<Event>) => {
        const index = state.events.findIndex((e) => e.id === action.payload.id);
        if (index !== -1) {
          state.events[index] = action.payload;
        }
        if (state.currentEvent?.id === action.payload.id) {
          state.currentEvent = action.payload;
        }
        const myIndex = state.myEvents.findIndex((e) => e.id === action.payload.id);
        if (myIndex !== -1) {
          state.myEvents[myIndex] = action.payload;
        }
      })
      .addCase(deleteEvent.fulfilled, (state, action: PayloadAction<string>) => {
        state.events = state.events.filter((e) => e.id !== action.payload);
        state.myEvents = state.myEvents.filter((e) => e.id !== action.payload);
        state.total -= 1;
        if (state.currentEvent?.id === action.payload) {
          state.currentEvent = null;
        }
      })
      .addCase(attendEvent.fulfilled, (state, action) => {
        const { eventId, attendees } = action.payload;
        const event = state.events.find((e) => e.id === eventId);
        if (event) {
          event.attendees = attendees;
          event.isAttending = true;
        }
        if (state.currentEvent?.id === eventId) {
          state.currentEvent.attendees = attendees;
          state.currentEvent.isAttending = true;
        }
      })
      .addCase(cancelAttendance.fulfilled, (state, action) => {
        const { eventId, attendees } = action.payload;
        const event = state.events.find((e) => e.id === eventId);
        if (event) {
          event.attendees = attendees;
          event.isAttending = false;
        }
        if (state.currentEvent?.id === eventId) {
          state.currentEvent.attendees = attendees;
          state.currentEvent.isAttending = false;
        }
      })
      .addCase(fetchMyEvents.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchMyEvents.fulfilled, (state, action: PayloadAction<Event[]>) => {
        state.isLoading = false;
        state.myEvents = action.payload;
      })
      .addCase(fetchMyEvents.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError, clearCurrentEvent } = eventsSlice.actions;
export default eventsSlice.reducer;
