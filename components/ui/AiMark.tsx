import { LinearGradient } from 'expo-linear-gradient';
import { ReactNode } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

/** AI 전용 그라데이션 배경 (보라→핑크). 앱·웹 모두 동일하게 보인다 */
export function AiGradient({ style, children }: { style?: StyleProp<ViewStyle>; children?: ReactNode }) {
  const { colors } = useTheme();
  return (
    <LinearGradient
      colors={[colors.aiStart, colors.aiEnd]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={style}>
      {children}
    </LinearGradient>
  );
}

/** AI 전용 표시 ✦. 보라(accent)가 아닌 ai* 색만 사용 */
export function AiMark({ size = 20 }: { size?: number }) {
  return (
    <AiGradient style={[styles.mark, { width: size, height: size, borderRadius: size * 0.35 }]}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.55, fontWeight: '700', lineHeight: size * 0.7 }}>✦</Text>
    </AiGradient>
  );
}

/** "✦ Uni" 라벨 */
export function AiLabel({ text = 'Uni' }: { text?: string }) {
  const { colors } = useTheme();
  return (
    <View style={styles.label}>
      <AiMark size={18} />
      <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.aiText }}>{text}</Text>
    </View>
  );
}

/** 작은 "AI" 배지 */
export function AiBadge() {
  const { colors } = useTheme();
  return (
    <View style={[styles.badge, { backgroundColor: colors.aiSubtle }]}>
      <Text style={{ fontSize: 12, lineHeight: 16, fontWeight: '700', color: colors.aiText }}>AI</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  mark: { alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
});
