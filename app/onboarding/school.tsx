import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { supabase } from '@/lib/supabase';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import OnboardingNav from '@/components/ui/OnboardingNav';
import TextField from '@/components/ui/TextField';
import { radius, type } from '@/constants/design';

const KAKAO_REST_KEY = process.env.EXPO_PUBLIC_KAKAO_REST_API_KEY ?? '';

type School = { name: string; region: string; emoji: string };

const searchSchools = async (query: string): Promise<School[]> => {
  if (!query.trim()) return [];
  try {
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?query=${encodeURIComponent(query)}&size=15`,
      { headers: { Authorization: `KakaoAK ${KAKAO_REST_KEY}` } }
    );
    const data = await res.json();
    return (data.documents ?? [])
      .filter((d: any) =>
        (d.place_name.endsWith('대학교') || d.place_name.endsWith('캠퍼스')) &&
        d.place_name.includes(query.trim())
      )
      .map((d: any) => ({
        name: d.place_name,
        region: d.address_name?.split(' ').slice(0, 2).join(' ') ?? '',
        emoji: '🏫',
      }));
  } catch {
    return [];
  }
};

export default function SchoolScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<School[]>([]);
  const [selected, setSelected] = useState<School | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const insets = useSafeAreaInsets();

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    const timer = setTimeout(async () => {
      setLoading(true);
      const found = await searchSchools(query);
      setResults(found);
      setLoading(false);
    }, 400);
    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (school: School) => {
    setSelected(school);
    setResults([]);
    setQuery('');
  };

  const handleCustom = () => {
    handleSelect({ name: query.trim(), region: '직접 입력', emoji: '🏫' });
  };

  const confirm = async () => {
    if (!selected) return;
    setSaving(true);
    await AsyncStorage.setItem('selected_school', JSON.stringify(selected));
    const { data: { user } } = await supabase.auth.getUser();
    if (user) {
      await supabase.from('profiles').update({ school: selected.name }).eq('id', user.id);
    }
    setSaving(false);
    router.back();
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <OnboardingNav step={2} onBack={() => router.back()} />

      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>어느 학교에 다니세요?</Text>
        <Text style={[type.bodyLarge, { color: colors.textSecondary }]}>학교에 맞춘 AI 답변과 커뮤니티를 열어드려요</Text>
        <TextField
          icon="search"
          placeholder="학교 이름 검색"
          value={query}
          onChangeText={v => { setQuery(v); setSelected(null); }}
          autoCorrect={false}
          containerStyle={styles.search}
          right={loading
            ? <ActivityIndicator size="small" color={colors.accentText} />
            : query.length > 0 ? (
              <Pressable onPress={() => { setQuery(''); setResults([]); }} hitSlop={8} accessibilityLabel="검색어 지우기">
                <Feather name="x" size={18} color={colors.textTertiary} />
              </Pressable>
            ) : null}
        />
      </View>

      <ScrollView style={styles.list} contentContainerStyle={styles.listContent} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {selected ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            <View style={styles.row}>
              <View style={styles.flex}>
                <Text style={[type.labelLarge, { color: colors.textPrimary }]}>{selected.name}</Text>
                <Text style={[type.caption, { color: colors.textTertiary }]}>{selected.region}</Text>
              </View>
              <View style={[styles.checkCircle, { backgroundColor: colors.accentFill }]}>
                <Feather name="check" size={16} color={colors.onAccent} />
              </View>
            </View>
          </View>
        ) : results.length > 0 ? (
          <View style={[styles.card, { backgroundColor: colors.surface }]}>
            {results.map((school, i) => (
              <Pressable key={i}
                style={({ pressed }) => [styles.row, i > 0 && { borderTopWidth: 1, borderTopColor: colors.borderDefault }, pressed && { backgroundColor: colors.raised }]}
                onPress={() => handleSelect(school)}>
                <View style={styles.flex}>
                  <Text style={[type.labelLarge, { color: colors.textPrimary }]}>{school.name}</Text>
                  <Text style={[type.caption, { color: colors.textTertiary }]}>{school.region}</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.textTertiary} />
              </Pressable>
            ))}
          </View>
        ) : null}

        {/* 목록에 없을 때 직접 입력 */}
        {!selected && query.trim().length > 0 && !loading && results.length === 0 && (
          <Pressable style={[styles.custom, { borderColor: colors.borderStrong }]} onPress={handleCustom}>
            <Feather name="plus" size={20} color={colors.textSecondary} />
            <View style={styles.flex}>
              <Text style={[type.labelLarge, { color: colors.textPrimary }]}>{`“${query.trim()}” 직접 입력`}</Text>
              <Text style={[type.caption, { color: colors.textTertiary }]}>목록에 없는 학교도 사용할 수 있어요</Text>
            </View>
          </Pressable>
        )}

        {/* 검색 전 안내 */}
        {!selected && query.trim().length === 0 && (
          <View style={styles.empty}>
            <Feather name="search" size={28} color={colors.textTertiary} />
            <Text style={[type.bodyMedium, { color: colors.textSecondary }]}>전국 모든 대학교를 검색할 수 있어요</Text>
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Button label="다음" fullWidth disabled={!selected} loading={saving} onPress={confirm} />
        {selected && <Button label="다른 학교 선택" variant="ghost" size="M" fullWidth onPress={() => setSelected(null)} />}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  flex: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 24, gap: 8 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  search: { marginTop: 16 },
  list: { flex: 1 },
  listContent: { paddingHorizontal: 20, paddingTop: 16, paddingBottom: 24, gap: 12 },
  card: { borderRadius: radius.lg, overflow: 'hidden' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 14, paddingHorizontal: 16 },
  checkCircle: { width: 24, height: 24, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  custom: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    borderRadius: radius.lg, borderWidth: 1, borderStyle: 'dashed', paddingVertical: 14, paddingHorizontal: 16,
  },
  empty: { alignItems: 'center', gap: 8, paddingTop: 48 },
  bottom: { paddingHorizontal: 20, gap: 4 },
}));
