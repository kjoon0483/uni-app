import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';

/** AI 전용 표시 ✦. 보라(accent)가 아닌 ai* 색만 사용 */
export function AiMark({ size = 20 }: { size?: number }) {
  const { colors } = useTheme();
  return (
    <View style={[styles.mark, {
      width: size, height: size, borderRadius: size * 0.35, backgroundColor: colors.aiStart,
      // 웹에서는 AI 그라데이션(보라→핑크), 앱에서는 시작색 단색
      ...({ backgroundImage: `linear-gradient(135deg, ${colors.aiStart}, ${colors.aiEnd})` } as object),
    }]}>
      <Text style={{ color: '#FFFFFF', fontSize: size * 0.55, fontWeight: '700', lineHeight: size * 0.7 }}>✦</Text>
    </View>
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
  mark: { alignItems: 'center', justifyContent: 'center' },
  label: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  badge: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 2 },
});
