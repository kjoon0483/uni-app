import { StyleSheet, View } from 'react-native';
import { useTheme } from '@/lib/ThemeContext';
import IconButton from './IconButton';

/** 온보딩 상단: 뒤로 버튼 + 진행 단계(4단계 중 step) */
export default function OnboardingNav({ step, total = 4, onBack }: { step?: number; total?: number; onBack?: () => void }) {
  const { colors } = useTheme();
  return (
    <View style={styles.wrap}>
      {onBack ? <IconButton icon="chevron-left" accessibilityLabel="뒤로" onPress={onBack} /> : <View style={styles.spacer} />}
      {step ? (
        <View style={styles.steps} accessibilityRole="progressbar" accessibilityLabel={`${total}단계 중 ${step}단계`}>
          {Array.from({ length: total }, (_, i) => (
            <View key={i} style={[styles.step, { backgroundColor: i < step ? colors.accentFill : colors.borderStrong }]} />
          ))}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingLeft: 8, paddingRight: 20, paddingTop: 4, minHeight: 48 },
  spacer: { width: 40, height: 40 },
  steps: { flex: 1, flexDirection: 'row', gap: 6 },
  step: { flex: 1, height: 4, borderRadius: 2 },
});
