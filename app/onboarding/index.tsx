import { Feather } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AiLabel } from '@/components/ui/AiMark';
import Button, { type FeatherName } from '@/components/ui/Button';
import { radius, type } from '@/constants/design';
import { makeStyles } from '@/lib/makeStyles';
import { useTheme } from '@/lib/ThemeContext';

const slides: { title: string; desc: string; demo: 'ai' | 'map' | 'community' }[] = [
  {
    title: 'AI가 대신 찾아줘요',
    desc: '교수님 평가, 맛집, 여행 계획까지\n자연어로 물어보면 바로 답해요',
    demo: 'ai',
  },
  {
    title: '학생 맛집 지도',
    desc: '커뮤니티 글에서 AI가 맛집 정보를\n모아 지도에 추가해요',
    demo: 'map',
  },
  {
    title: '우리 학교 커뮤니티',
    desc: '익명 게시판, 강의평가, 중고거래\n우리 학교 학생들끼리만 소통해요',
    demo: 'community',
  },
];

/** 슬라이드마다 앱 기능을 보여주는 간단한 그림 */
function Demo({ kind }: { kind: 'ai' | 'map' | 'community' }) {
  const styles = useStyles();
  const { colors } = useTheme();
  if (kind === 'ai') {
    return (
      <View style={[styles.demo, { backgroundColor: colors.accentSubtle }]}>
        <View style={[styles.userBubble, { backgroundColor: colors.accentFill }]}>
          <Text style={[type.bodyMedium, { color: colors.onAccent }]}>근처 돈카츠 맛집 찾아줘</Text>
        </View>
        <View style={styles.aiWrap}>
          <AiLabel />
          <View style={[styles.aiBubble, { backgroundColor: colors.surface }]}>
            <Text style={[type.bodyMedium, { color: colors.textPrimary }]}>카츠야를 추천해! 도보 5분이야</Text>
          </View>
        </View>
      </View>
    );
  }
  const items: [FeatherName, string, string][] = kind === 'map'
    ? [['map-pin', '카츠야', '일식 · 정문 도보 5분'], ['map-pin', '신구분식', '분식 · 후문 도보 3분']]
    : [['message-square', '기숙사 와이파이 나만 느림?', '자유 · 댓글 4'], ['message-square', '국가장학금 2차 마감 D-3', '정보 · 댓글 9']];
  const tint = kind === 'map' ? [colors.info.sky, colors.info.teal] : [colors.info.indigo, colors.info.peach];
  return (
    <View style={[styles.demo, { backgroundColor: colors.accentSubtle }]}>
      {items.map(([icon, t, sub], i) => (
        <View key={i} style={[styles.demoRow, { backgroundColor: colors.surface }]}>
          <Feather name={icon} size={20} color={tint[i]} />
          <View style={{ flex: 1 }}>
            <Text style={[type.labelMedium, { color: colors.textPrimary }]} numberOfLines={1}>{t}</Text>
            <Text style={[type.caption, { color: colors.textTertiary }]}>{sub}</Text>
          </View>
        </View>
      ))}
    </View>
  );
}

export default function OnboardingScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [current, setCurrent] = useState(0);
  const last = current === slides.length - 1;

  const next = () => {
    if (!last) setCurrent(current + 1);
    else router.replace('/onboarding/profile');
  };

  const slide = slides[current];

  return (
    <View style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <View style={styles.top}>
        {!last && <Button label="건너뛰기" variant="ghost" size="M" onPress={() => router.replace('/onboarding/profile')} />}
      </View>

      <View style={styles.content}>
        <Demo kind={slide.demo} />
        <Text style={[styles.title, { color: colors.textPrimary }]}>{slide.title}</Text>
        <Text style={[type.bodyLarge, { color: colors.textSecondary }]}>{slide.desc}</Text>
      </View>

      <View style={styles.bottom}>
        <View style={styles.dots} accessibilityLabel={`${slides.length}장 중 ${current + 1}번째`}>
          {slides.map((_, i) => (
            <View key={i} style={[styles.dot, {
              backgroundColor: i === current ? colors.accentFill : colors.borderStrong,
              width: i === current ? 24 : 8,
            }]} />
          ))}
        </View>
        <Button label={last ? '시작하기' : '다음'} fullWidth onPress={next} />
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  top: { minHeight: 48, flexDirection: 'row', justifyContent: 'flex-end', paddingHorizontal: 8 },
  content: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 12 },
  demo: { borderRadius: 32, height: 260, paddingHorizontal: 24, justifyContent: 'center', gap: 12, marginBottom: 28 },
  userBubble: { alignSelf: 'flex-end', borderRadius: radius.lg, borderTopRightRadius: 4, paddingVertical: 10, paddingHorizontal: 14 },
  aiWrap: { alignSelf: 'flex-start', gap: 6 },
  aiBubble: { borderRadius: radius.lg, borderTopLeftRadius: 4, paddingVertical: 10, paddingHorizontal: 14 },
  demoRow: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: radius.md, padding: 14 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  bottom: { paddingHorizontal: 20, gap: 24 },
  dots: { flexDirection: 'row', gap: 6 },
  dot: { height: 8, borderRadius: 4 },
}));
