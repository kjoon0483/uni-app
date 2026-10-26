import { Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, type } from '@/constants/design';
import { useTheme } from '@/lib/ThemeContext';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

/** Figma: Chip (Selected). 높이 36, 알약형 */
export default function Chip({ label, selected, onPress, style }: ChipProps) {
  const { colors } = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={({ pressed }) => [
        styles.base,
        selected
          ? { backgroundColor: colors.accentFill, borderColor: colors.accentFill }
          : { backgroundColor: colors.surface, borderColor: colors.borderDefault },
        pressed && { opacity: 0.8 },
        style,
      ]}>
      <Text style={[type.labelMedium, { color: selected ? colors.onAccent : colors.textSecondary }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    height: 36, paddingHorizontal: 14, borderRadius: radius.full, borderWidth: 1,
    alignItems: 'center', justifyContent: 'center',
  },
});
