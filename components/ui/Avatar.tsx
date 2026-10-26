import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

/** Figma: Avatar (Size 28/40/48/72) */
export default function Avatar({ name, size = 40 }: { name?: string; size?: 28 | 40 | 48 | 72 }) {
  const { colors } = useTheme();
  const initial = (name?.trim()?.[0] ?? '?').toUpperCase();
  const fontSize = size >= 72 ? 28 : size >= 48 ? 18 : size >= 40 ? 16 : 12;
  return (
    <View style={[styles.base, { width: size, height: size, borderRadius: size / 2, backgroundColor: colors.accentSubtle }]}>
      <Text style={{ fontSize, fontWeight: '700', color: colors.accentText }}>{initial}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  base: { alignItems: 'center', justifyContent: 'center' },
});
