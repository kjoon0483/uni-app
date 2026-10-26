import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import { radius, type } from '@/constants/design';
import { makeStyles } from '@/lib/makeStyles';
import { useTheme } from '@/lib/ThemeContext';

const NEXT_STEPS = ['학교 선택', '기본 정보 입력', '시간표 등록 (선택)'];

export default function WelcomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const riseAnim = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 500, useNativeDriver: true }),
      Animated.spring(riseAnim, { toValue: 0, tension: 60, friction: 9, useNativeDriver: true }),
    ]).start();
  }, [fadeAnim, riseAnim]);

  return (
    <View style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <Animated.View style={[styles.content, { opacity: fadeAnim, transform: [{ translateY: riseAnim }] }]}>
        <View style={[styles.check, { backgroundColor: colors.accentSubtle }]}>
          <Feather name="check" size={36} color={colors.accentText} />
        </View>
        <Text style={[styles.title, { color: colors.textPrimary }]}>가입을 환영해요!</Text>
        <Text style={[type.bodyLarge, { color: colors.textSecondary }]}>
          학교와 기본 정보만 알려주면{'\n'}Uni가 우리 학교에 맞춰 준비할게요.
        </Text>

        <View style={[styles.steps, { backgroundColor: colors.surface }]}>
          {NEXT_STEPS.map((label, i) => (
            <View key={label} style={styles.stepRow}>
              <View style={[styles.stepNum, { backgroundColor: colors.raised }]}>
                <Text style={[type.labelSmall, { color: colors.textSecondary }]}>{i + 1}</Text>
              </View>
              <Text style={[type.bodyMedium, { color: colors.textPrimary }]}>{label}</Text>
            </View>
          ))}
        </View>
      </Animated.View>

      <View style={styles.bottom}>
        <Button label="시작하기" fullWidth onPress={() => router.push('/onboarding/school')} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 12 },
  check: { width: 72, height: 72, borderRadius: 36, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  steps: { borderRadius: radius.lg, padding: 16, gap: 12, marginTop: 12 },
  stepRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  stepNum: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  bottom: { paddingHorizontal: 20 },
}));
