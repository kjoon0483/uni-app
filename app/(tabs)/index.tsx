import { makeStyles } from '@/lib/makeStyles';
import { createGeminiModel } from '@/lib/gemini';
import { formatTimetableContext, isCommunityQuery, isTimetableQuery, searchLocalData } from '@/lib/localSearch';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import type { ChatSession, GenerativeModel } from '@google/generative-ai';
import { router, useFocusEffect } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useCallback, useRef, useState } from 'react';
import { AiBadge, AiLabel } from '@/components/ui/AiMark';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { radius, resolveClassColor, type } from '@/constants/design';
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Pressable,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';

type Message = { role: 'user' | 'ai'; text: string; mapCategory?: string; restaurantQuery?: string };

const MAP_KEYWORDS: { keywords: string[]; category: string }[] = [
  { keywords: ['한식', '한국음식', '국밥', '찌개', '비빔밥', '설렁탕'], category: '한식' },
  { keywords: ['중식', '중국집', '짜장', '짬뽕', '탕수육'], category: '중식' },
  { keywords: ['일식', '초밥', '스시', '라멘', '돈카츠', '우동'], category: '일식' },
  { keywords: ['양식', '파스타', '피자', '스테이크', '버거'], category: '양식' },
  { keywords: ['카페', '커피', '디저트', '케이크', '라떼'], category: '카페' },
  { keywords: ['술집', '포차', '이자카야', '맥주', '소주'], category: '술집' },
  { keywords: ['분식', '떡볶이', '순대', '튀김', '김밥'], category: '분식' },
  { keywords: ['맛집', '식당', '음식점', '밥집', '먹을'], category: '전체' },
];

function detectMapCategory(text: string): string | null {
  const lower = text.toLowerCase().replace(/\s+/g, '');
  for (const { keywords, category } of MAP_KEYWORDS) {
    if (keywords.some(k => lower.includes(k.replace(/\s+/g, '')))) return category;
  }
  return null;
}

function extractFirstRestaurantName(text: string): string | null {
  const boldMatches = [...text.matchAll(/\*\*([^*\n]+?)\*\*/g)];
  for (const m of boldMatches) {
    const raw = m[1].trim();
    if (raw.endsWith(':') || raw.endsWith('쪽') || raw.endsWith('**')) continue;
    if (['메뉴', '위치', '특징', '분위기', '위치/특징'].some(k => raw.startsWith(k))) continue;
    // 따옴표 안에 있는 이름 우선 추출 ('멘텐' → 멘텐)
    const quoted = raw.match(/['''"]([^'''"\s]{1,15})['''"]/);
    if (quoted) return quoted[1].trim();
    // 15자 이내 순수 이름
    if (raw.length >= 2 && raw.length <= 15) return raw;
  }
  const listMatch = text.match(/^\d+[\.\)]\s*([^\n\-:：'''"/]{2,12})/m);
  if (listMatch) return listMatch[1].trim();
  return null;
}

type NextClass = { name: string; room: string; start: string; color: string; todayCount: number; label: string };

/** 시간표(user_timetables)에서 오늘 남은 첫 수업을 찾는다 */
async function loadNextClass(uid: string): Promise<NextClass | null> {
  const { data } = await supabase.from('user_timetables').select('classes').eq('user_id', uid).single();
  const list = (data?.classes ?? []) as { name: string; room?: string; day: number; startTime: string; endTime: string; color?: string }[];
  const d = new Date().getDay();
  const dayIdx = d >= 1 && d <= 5 ? d - 1 : -1;
  const now = new Date().getHours() * 60 + new Date().getMinutes();
  const toMin = (t: string) => { const [h, m] = t.split(':').map(Number); return h * 60 + m; };
  const today = list.filter(c => c.day === dayIdx).sort((a, b) => toMin(a.startTime) - toMin(b.startTime));
  const names = new Set(today.map(c => c.name));
  const upcoming = today.find(c => toMin(c.endTime) > now);
  if (!upcoming) return null;
  const ongoing = toMin(upcoming.startTime) <= now;
  return {
    name: upcoming.name, room: upcoming.room ?? '', start: upcoming.startTime, color: upcoming.color ?? '',
    todayCount: names.size, label: ongoing ? `지금 수업 중 · ~${upcoming.endTime}` : `다음 수업 · ${upcoming.startTime}`,
  };
}

export default function HomeScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [message, setMessage] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [userId, setUserId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(false);
  const [nextClass, setNextClass] = useState<NextClass | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const chatRef = useRef<ChatSession | null>(null);
  const modelRef = useRef<GenerativeModel | null>(null);

  const loadUserSchool = useCallback(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const uid = session?.user?.id ?? null;
      setUserId(uid);
      const meta = session?.user?.user_metadata ?? {};
      const name = meta.school_name ?? '';
      const region = meta.school_region ?? '';
      setSchoolName(name);
      if (uid) loadNextClass(uid).then(setNextClass);
      modelRef.current = createGeminiModel(name || '대학교', region);
      chatRef.current = null;
      setMessages([{
        role: 'ai',
        text: name
          ? `안녕! 나는 ${name} 전용 AI 친구 Uni야 🎓\n학교 주변 맛집, 학교생활 고민, 수강신청, 취업 정보까지 뭐든 물어봐!`
          : '안녕! 나는 AI 친구 Uni야 🎓\n학교생활 고민, 맛집, 수강신청, 취업 정보까지 뭐든 물어봐!',
      }]);
    });
  }, []);

  useFocusEffect(loadUserSchool);

  const getChat = () => {
    if (!modelRef.current) {
      modelRef.current = createGeminiModel('대학교', '');
    }
    if (!chatRef.current) {
      chatRef.current = modelRef.current.startChat();
    }
    return chatRef.current;
  };

  // 커뮤니티 게시글 검색 (Supabase)
  const searchCommunityPosts = async (query: string): Promise<string | null> => {
    try {
      const { data } = await supabase
        .from('posts')
        .select('tab, title, body, author_nickname, is_anonymous, created_at')
        .order('created_at', { ascending: false })
        .limit(60);
      if (!data || data.length === 0) return null;

      const keywords = query.split(/\s+/).filter(w => w.length > 1);
      const matched = data.filter(post => {
        const content = `${post.title} ${post.body}`.toLowerCase();
        return keywords.some(k => content.includes(k.toLowerCase()));
      }).slice(0, 5);

      if (matched.length === 0) return null;

      const lines = matched.map(p =>
        `[${p.tab}] ${p.title}\n${p.body.slice(0, 120)}${p.body.length > 120 ? '...' : ''}`
      );
      return `💬 커뮤니티 관련 글 (${matched.length}개):\n${lines.join('\n\n')}`;
    } catch {
      return null;
    }
  };

  const sendMessage = async () => {
    const text = message.trim();
    if (!text || loading) return;

    setMessages(prev => [...prev, { role: 'user', text }]);
    setMessage('');
    setLoading(true);

    try {
      const contexts: string[] = [];

      // 1. 시간표 컨텍스트
      if (isTimetableQuery(text)) {
        const uid = userId ?? (await supabase.auth.getUser()).data.user?.id;
        if (uid) {
          const stored = await AsyncStorage.getItem(`timetable_${uid}`);
          if (stored) {
            const timetableCtx = formatTimetableContext(stored, text);
            if (timetableCtx) contexts.push(timetableCtx);
          } else {
            contexts.push('📅 아직 시간표가 등록되지 않았어요. 시간표 탭에서 먼저 등록해보세요!');
          }
        }
      }

      // 2. 커뮤니티 컨텍스트
      if (isCommunityQuery(text)) {
        const communityCtx = await searchCommunityPosts(text);
        if (communityCtx) contexts.push(communityCtx);
      }

      // 3. 앱 내 일반 팁
      const localCtx = searchLocalData(text);
      if (localCtx) contexts.push(localCtx);

      const prompt = contexts.length > 0
        ? `[앱 내 정보]\n${contexts.join('\n\n')}\n\n[사용자 질문]\n${text}`
        : text;

      const result = await getChat().sendMessage(prompt);
      const reply = result.response.text();
      const mapCategory = detectMapCategory(text) ?? detectMapCategory(reply) ?? undefined;
      const restaurantQuery = mapCategory ? (extractFirstRestaurantName(reply) ?? undefined) : undefined;
      setMessages(prev => [...prev, { role: 'ai', text: reply, mapCategory, restaurantQuery }]);
    } catch (e: any) {
      const msg = e?.message?.includes('API_KEY') ? 'API 키가 올바르지 않아요.' :
        e?.message?.includes('quota') ? '오늘 사용량을 초과했어요.' :
        '오류가 발생했어요: ' + (e?.message ?? '다시 시도해주세요.');
      setMessages(prev => [...prev, { role: 'ai', text: msg }]);
    } finally {
      setLoading(false);
      setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 100);
    }
  };

  const quickQuestions = schoolName
    ? [`${schoolName} 주변 맛집`, '수강신청 꿀팁', '장학금 정보', '학교 근처 카페', '과제 도움', '취업 정보']
    : ['주변 맛집 추천', '수강신청 꿀팁', '장학금 정보', '근처 카페 어디?', '과제 도움', '취업 정보'];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={0}>

      <ScreenHeader
        eyebrow={schoolName || '학교 설정하기'}
        onEyebrowPress={() => router.push('/edit-profile')}
        title="무엇이든 물어봐요"
      />

      <View style={styles.top}>
        {/* 커뮤니티 AI 검색 */}
        <Pressable
          style={[styles.searchBar, { backgroundColor: colors.surface, borderColor: colors.borderInput }]}
          onPress={() => router.push('/(tabs)/search' as any)}
          accessibilityRole="search">
          <Feather name="search" size={20} color={colors.textTertiary} />
          <Text style={[type.bodyMedium, styles.flex, { color: colors.textTertiary }]}>커뮤니티 글을 AI로 검색</Text>
          <AiBadge />
        </Pressable>

        {/* 다음 수업 */}
        {nextClass && (
          <Pressable
            style={[styles.todayCard, { backgroundColor: colors.surface }]}
            onPress={() => router.push('/(tabs)/timetable' as any)}>
            <View style={[styles.todayBar, { backgroundColor: resolveClassColor(nextClass.color, colors) }]} />
            <View style={styles.flex}>
              <Text style={[type.caption, { color: colors.textTertiary }]}>{nextClass.label}</Text>
              <Text style={[type.labelLarge, { color: colors.textPrimary }]} numberOfLines={1}>
                {nextClass.name}{nextClass.room ? ` · ${nextClass.room}` : ''}
              </Text>
            </View>
            <Text style={[type.labelSmall, { color: colors.textSecondary }]}>오늘 {nextClass.todayCount}개</Text>
            <Feather name="chevron-right" size={16} color={colors.textTertiary} />
          </Pressable>
        )}
      </View>

      {/* 대화 */}
      <ScrollView
        ref={scrollRef}
        style={styles.chat}
        contentContainerStyle={styles.chatContent}
        onContentSizeChange={() => scrollRef.current?.scrollToEnd({ animated: true })}>
        {messages.map((m, i) => m.role === 'user' ? (
          <View key={i} style={[styles.bubble, styles.userBubble, { backgroundColor: colors.accentFill }]}>
            <Text style={[type.bodyMedium, { color: colors.onAccent }]}>{m.text}</Text>
          </View>
        ) : (
          <View key={i} style={styles.aiWrap}>
            <AiLabel />
            <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
              <Text style={[type.bodyMedium, { color: colors.textPrimary }]}>{m.text}</Text>
              {m.mapCategory && (
                <Button
                  label="지도에서 보기" icon="map" variant="secondary" size="M"
                  style={styles.mapBtn}
                  onPress={() => router.push({ pathname: '/(tabs)/map', params: { category: m.mapCategory, query: m.restaurantQuery ?? '', t: String(Date.now()) } })}
                />
              )}
            </View>
          </View>
        ))}
        {loading && (
          <View style={styles.aiWrap}>
            <AiLabel />
            <View style={[styles.bubble, styles.aiBubble, { backgroundColor: colors.surface }]}>
              <ActivityIndicator color={colors.aiText} size="small" />
            </View>
          </View>
        )}
      </ScrollView>

      {/* 추천 질문 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickScroll} contentContainerStyle={styles.quickContent}>
        {quickQuestions.map((q, i) => <Chip key={i} label={q} onPress={() => setMessage(q)} />)}
      </ScrollView>

      {/* 입력창 */}
      <View style={[styles.inputRow, { backgroundColor: colors.surface, borderColor: colors.borderInput }]}>
        <TextInput
          style={[styles.input, type.bodyLarge, { color: colors.textPrimary }]}
          value={message}
          onChangeText={setMessage}
          placeholder="메시지를 입력하세요"
          placeholderTextColor={colors.textTertiary}
          multiline
          numberOfLines={1}
          blurOnSubmit
          onSubmitEditing={sendMessage}
          returnKeyType="send"
        />
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="보내기"
          style={[styles.sendBtn, { backgroundColor: colors.accentFill }, (loading || !message.trim()) && styles.sendBtnDisabled]}
          onPress={sendMessage}
          disabled={loading}>
          <Feather name="arrow-up" size={20} color={colors.onAccent} />
        </Pressable>
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  flex: { flex: 1 },
  top: { paddingHorizontal: 20, gap: 12 },
  searchBar: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    height: 48, borderRadius: radius.md, borderWidth: 1, paddingHorizontal: 14,
  },
  todayCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.lg, paddingVertical: 14, paddingHorizontal: 16,
  },
  todayBar: { width: 4, height: 40, borderRadius: 2 },
  chat: { flex: 1 },
  chatContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 8, gap: 12 },
  aiWrap: { alignSelf: 'flex-start', maxWidth: '85%', gap: 6 },
  bubble: { paddingVertical: 12, paddingHorizontal: 14, borderRadius: radius.lg },
  userBubble: { alignSelf: 'flex-end', maxWidth: '80%', borderTopRightRadius: 4 },
  aiBubble: { borderTopLeftRadius: 4, gap: 10 },
  mapBtn: { alignSelf: 'flex-start' },
  quickScroll: { flexGrow: 0, marginBottom: 8 },
  quickContent: { paddingHorizontal: 20, gap: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center', gap: 8,
    marginHorizontal: 20, marginBottom: 12,
    borderRadius: 24, paddingLeft: 16, paddingRight: 6, paddingVertical: 6, borderWidth: 1,
  },
  input: { flex: 1, maxHeight: 96, paddingVertical: 6, outlineStyle: 'none' } as any,
  sendBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  sendBtnDisabled: { opacity: 0.4 },
}));
