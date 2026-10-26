import { Feather } from '@expo/vector-icons';
import { Pressable, StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { radius, size } from '@/constants/design';
import { useTheme } from '@/lib/ThemeContext';
import type { FeatherName } from './Button';

interface IconButtonProps {
  icon: FeatherName;
  onPress?: () => void;
  accessibilityLabel: string;
  variant?: 'ghost' | 'surface' | 'primary';
  color?: string;
  badge?: number;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Figma: IconButton. 40×40 터치 영역 */
export default function IconButton({
  icon, onPress, accessibilityLabel, variant = 'ghost', color, badge, disabled, style,
}: IconButtonProps) {
  const { colors } = useTheme();
  const bg = variant === 'primary' ? colors.accentFill : variant === 'surface' ? colors.surface : 'transparent';
  const fg = color ?? (variant === 'primary' ? colors.onAccent : colors.textPrimary);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      onPress={onPress}
      disabled={disabled}
      hitSlop={4}
      style={({ pressed }) => [
        styles.base,
        { backgroundColor: bg, opacity: disabled ? 0.4 : pressed ? 0.6 : 1 },
        variant === 'surface' && { borderWidth: 1, borderColor: colors.borderDefault },
        style,
      ]}>
      <Feather name={icon} size={22} color={fg} />
      {!!badge && badge > 0 && (
        <View style={[styles.badge, { backgroundColor: colors.accentFill, borderColor: colors.base }]}>
          <Text style={[styles.badgeText, { color: colors.onAccent }]}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    width: size.touch, height: size.touch, borderRadius: radius.md,
    alignItems: 'center', justifyContent: 'center',
  },
  badge: {
    position: 'absolute', top: 2, right: 0, minWidth: 18, height: 18,
    borderRadius: 9, paddingHorizontal: 4, borderWidth: 2,
    alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { fontSize: 10, fontWeight: '700' },
});
