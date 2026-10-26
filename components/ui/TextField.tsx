import { Feather } from '@expo/vector-icons';
import { forwardRef, ReactNode, useState } from 'react';
import { StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import { radius, size, type } from '@/constants/design';
import { useTheme } from '@/lib/ThemeContext';
import type { FeatherName } from './Button';

interface TextFieldProps extends TextInputProps {
  label?: string;
  error?: string;
  helper?: string;
  icon?: FeatherName;
  right?: ReactNode;
  containerStyle?: StyleProp<ViewStyle>;
}

/** Figma: TextField (Default / Focused / Error). 높이 52, 라벨은 위 */
const TextField = forwardRef<TextInput, TextFieldProps>(function TextField(
  { label, error, helper, icon, right, containerStyle, style, onFocus, onBlur, multiline, ...rest }, ref,
) {
  const { colors } = useTheme();
  const [focused, setFocused] = useState(false);
  const borderColor = error ? colors.danger : focused ? colors.accentFill : colors.borderInput;

  return (
    <View style={[styles.wrap, containerStyle]}>
      {label ? <Text style={[type.labelMedium, { color: colors.textSecondary }]}>{label}</Text> : null}
      <View style={[
        styles.field,
        multiline && styles.multiline,
        { backgroundColor: colors.surface, borderColor, borderWidth: focused || error ? 1.5 : 1 },
      ]}>
        {icon && <Feather name={icon} size={20} color={colors.textTertiary} />}
        <TextInput
          ref={ref}
          placeholderTextColor={colors.textTertiary}
          multiline={multiline}
          onFocus={e => { setFocused(true); onFocus?.(e); }}
          onBlur={e => { setFocused(false); onBlur?.(e); }}
          style={[styles.input, type.bodyLarge, { color: colors.textPrimary }, multiline && styles.inputMulti, style]}
          {...rest}
        />
        {right}
      </View>
      {error ? (
        <Text style={[type.caption, { color: colors.danger }]}>{error}</Text>
      ) : helper ? (
        <Text style={[type.caption, { color: colors.textTertiary }]}>{helper}</Text>
      ) : null}
    </View>
  );
});

export default TextField;

const styles = StyleSheet.create({
  wrap: { gap: 8, alignSelf: 'stretch' },
  field: {
    minHeight: size.control, borderRadius: radius.md, paddingHorizontal: 16,
    flexDirection: 'row', alignItems: 'center', gap: 10,
  },
  multiline: { alignItems: 'flex-start', paddingVertical: 12 },
  input: { flex: 1, paddingVertical: 0, outlineStyle: 'none' } as any,
  inputMulti: { minHeight: 120, textAlignVertical: 'top' },
});
