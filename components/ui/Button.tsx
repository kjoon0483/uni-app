import { Feather } from '@expo/vector-icons';
import type { ComponentProps } from 'react';
import { ActivityIndicator, Pressable, StyleProp, StyleSheet, Text, ViewStyle } from 'react-native';
import { radius, size, type } from '@/constants/design';
import { useTheme } from '@/lib/ThemeContext';

export type FeatherName = ComponentProps<typeof Feather>['name'];
type Variant = 'primary' | 'secondary' | 'ghost' | 'danger';

interface ButtonProps {
  label: string;
  onPress?: () => void;
  variant?: Variant;
  size?: 'L' | 'M';
  icon?: FeatherName;
  disabled?: boolean;
  loading?: boolean;
  fullWidth?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Figma: Button (Variant × Size). 높이 52/40, 모서리 12 */
export default function Button({
  label, onPress, variant = 'primary', size: s = 'L', icon, disabled, loading, fullWidth, style,
}: ButtonProps) {
  const { colors } = useTheme();
  const palette = {
    primary: { bg: colors.accentFill, fg: colors.onAccent, border: undefined },
    secondary: { bg: colors.surface, fg: colors.textPrimary, border: colors.borderDefault },
    ghost: { bg: 'transparent', fg: colors.accentText, border: undefined },
    danger: { bg: colors.dangerSubtle, fg: colors.danger, border: undefined },
  }[variant];
  const large = s === 'L';
  const inactive = disabled || loading;

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !!inactive, busy: !!loading }}
      onPress={onPress}
      disabled={inactive}
      style={({ pressed }) => [
        styles.base,
        {
          height: large ? size.control : size.controlSm,
          paddingHorizontal: large ? 20 : 16,
          backgroundColor: palette.bg,
          borderColor: palette.border ?? 'transparent',
          borderWidth: palette.border ? 1 : 0,
          opacity: disabled ? 0.4 : pressed ? 0.85 : 1,
        },
        fullWidth && styles.full,
        style,
      ]}>
      {loading ? (
        <ActivityIndicator color={palette.fg} />
      ) : (
        <>
          {icon && <Feather name={icon} size={large ? 20 : 18} color={palette.fg} />}
          <Text style={[large ? type.labelLarge : type.labelMedium, { color: palette.fg }, !large && styles.boldM]}>
            {label}
          </Text>
        </>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  base: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: radius.md,
  },
  full: { alignSelf: 'stretch' },
  boldM: { fontWeight: '700' },
});
