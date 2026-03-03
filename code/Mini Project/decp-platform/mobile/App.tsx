import React, { useEffect } from 'react';
import { Provider as ReduxProvider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Provider as PaperProvider, MD3LightTheme, MD3DarkTheme } from 'react-native-paper';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { StyleSheet } from 'react-native';

import { store, persistor } from './src/store';
import RootNavigator from './src/navigation/RootNavigator';
import { useAppSelector } from './src/store';
import { COLORS, DARK_COLORS } from './src/utils/constants';
import { useNotifications } from './src/hooks/useNotifications';

// Theme wrapper component
const ThemeWrapper: React.FC = () => {
  const { mode } = useAppSelector((state) => state.theme);
  const { user } = useAppSelector((state) => state.auth);

  useNotifications();

  const paperTheme = {
    ...(mode === 'dark' ? MD3DarkTheme : MD3LightTheme),
    colors: {
      ...(mode === 'dark' ? MD3DarkTheme.colors : MD3LightTheme.colors),
      primary: mode === 'dark' ? DARK_COLORS.primary : COLORS.primary,
      background: mode === 'dark' ? DARK_COLORS.background : COLORS.background,
      surface: mode === 'dark' ? DARK_COLORS.surface : COLORS.surface,
      error: mode === 'dark' ? DARK_COLORS.error : COLORS.error,
    },
  };

  return (
    <PaperProvider theme={paperTheme}>
      <RootNavigator />
    </PaperProvider>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={styles.container}>
      <SafeAreaProvider>
        <ReduxProvider store={store}>
          <PersistGate loading={null} persistor={persistor}>
            <ThemeWrapper />
          </PersistGate>
        </ReduxProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
