import { useColorScheme } from 'react-native';
import { useAppSelector } from '../store';
import { COLORS, DARK_COLORS } from '../utils/constants';

export const useCustomTheme = () => {
  const systemColorScheme = useColorScheme();
  const { mode } = useAppSelector((state) => state.theme);

  const isDark = mode === 'dark' || (mode === 'system' && systemColorScheme === 'dark');
  const colors = isDark ? DARK_COLORS : COLORS;

  return {
    isDark,
    colors,
  };
};

export default useCustomTheme;
