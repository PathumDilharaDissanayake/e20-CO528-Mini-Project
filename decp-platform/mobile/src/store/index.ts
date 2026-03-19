import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { persistStore, persistReducer } from 'redux-persist';
import AsyncStorage from '@react-native-async-storage/async-storage';

import authReducer from '../features/authSlice';
import themeReducer from '../features/themeSlice';
import feedReducer from '../features/feedSlice';
import jobsReducer from '../features/jobsSlice';
import eventsReducer from '../features/eventsSlice';
import messagesReducer from '../features/messagesSlice';
import notificationsReducer from '../features/notificationsSlice';
import profileReducer from '../features/profileSlice';
import researchReducer from '../features/researchSlice';
import analyticsReducer from '../features/analyticsSlice';

const persistConfig = {
  key: 'root',
  storage: AsyncStorage,
  whitelist: ['auth', 'theme'],
};

const persistedAuthReducer = persistReducer(persistConfig, authReducer);
const persistedThemeReducer = persistReducer(persistConfig, themeReducer);

export const store = configureStore({
  reducer: {
    auth: persistedAuthReducer,
    theme: persistedThemeReducer,
    feed: feedReducer,
    jobs: jobsReducer,
    events: eventsReducer,
    messages: messagesReducer,
    notifications: notificationsReducer,
    profile: profileReducer,
    research: researchReducer,
    analytics: analyticsReducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST', 'persist/REHYDRATE'],
      },
    }),
});

export const persistor = persistStore(store);

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;

export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
