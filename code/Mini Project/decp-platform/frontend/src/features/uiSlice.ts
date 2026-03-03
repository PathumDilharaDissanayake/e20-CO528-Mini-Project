import { createSlice, PayloadAction } from '@reduxjs/toolkit';

interface Toast {
  id: string;
  message: string;
  type: 'success' | 'error' | 'warning' | 'info';
}

interface ModalState {
  isOpen: boolean;
  type: string | null;
  data: unknown;
}

interface UIState {
  sidebarOpen: boolean;
  toasts: Toast[];
  modal: ModalState;
  searchQuery: string;
}

const initialState: UIState = {
  sidebarOpen: false,
  toasts: [],
  modal: {
    isOpen: false,
    type: null,
    data: null,
  },
  searchQuery: '',
};

const uiSlice = createSlice({
  name: 'ui',
  initialState,
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },
    setSidebarOpen: (state, action: PayloadAction<boolean>) => {
      state.sidebarOpen = action.payload;
    },
    addToast: (state, action: PayloadAction<Omit<Toast, 'id'>>) => {
      const id = Date.now().toString();
      state.toasts.push({ ...action.payload, id });
    },
    removeToast: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((toast) => toast.id !== action.payload);
    },
    openModal: (state, action: PayloadAction<{ type: string; data?: unknown }>) => {
      state.modal = {
        isOpen: true,
        type: action.payload.type,
        data: action.payload.data || null,
      };
    },
    closeModal: (state) => {
      state.modal = {
        isOpen: false,
        type: null,
        data: null,
      };
    },
    setSearchQuery: (state, action: PayloadAction<string>) => {
      state.searchQuery = action.payload;
    },
  },
});

export const {
  toggleSidebar,
  setSidebarOpen,
  addToast,
  removeToast,
  openModal,
  closeModal,
  setSearchQuery,
} = uiSlice.actions;
export default uiSlice.reducer;
