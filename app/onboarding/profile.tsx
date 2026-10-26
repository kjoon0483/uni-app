import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { ScrollView, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import Chip from '@/components/ui/Chip';
import OnboardingNav from '@/components/ui/OnboardingNav';
import TextField from '@/components/ui/TextField';
import { radius, type } from '@/constants/design';
import { supabase } from '@/lib/supabase';

const GRADES = ['1학년', '2학년', '3학년', '4학년'];

export default function ProfileSetupScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');
  const insets = useSafeAreaInsets();
  const [school, setSchool] = useState<{ name: string; region: string; emoji: string } | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('selected_school').then(val => {
      if (val) setSchool(JSON.parse(val));
    });
  }, []);

  const isReady = studentId && department && grade;

  const handleDone = async () => {
    if (!isReady) return;
    try {
      const meta: Record<string, string> = {
        student_id: studentId,
        department,
        grade,
      };
      if (school) {
        meta.school_name = school.name;
        meta.school_region = school.region;
        meta.school_emoji = school.emoji;
      }
      await supabase.auth.updateUser({ data: meta });
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        await supabase.from('profiles').upsert({
          id: user.id,
          nickname: user.user_metadata?.nickname ?? null,
          school: school?.name ?? null,
          updated_at: new Date().toISOString(),
        }, { onConflict: 'id' });
      }
    } catch {
      // 저장 실패해도 진행
    }
    router.replace('/(tabs)');
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
      <OnboardingNav step={3} onBack={router.canGoBack() ? () => router.back() : undefined} />

      <ScrollView style={styles.flex} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.textPrimary }]}>기본 정보를 알려주세요</Text>
        <Text style={[type.bodyLarge, styles.sub, { color: colors.textSecondary }]}>학교 인증과 맞춤 추천에만 사용돼요</Text>

        {school && (
          <View style={[styles.schoolCard, { backgroundColor: colors.surface }]}>
            <Feather name="map-pin" size={18} color={colors.accentText} />
            <Text style={[type.labelMedium, styles.flex, { color: colors.textPrimary }]} numberOfLines={1}>{school.name}</Text>
            <Button label="변경" variant="ghost" size="M" onPress={() => router.push('/onboarding/school')} />
          </View>
        )}

        <View style={styles.form}>
          <TextField label="학번" placeholder="예: 20240001" value={studentId} onChangeText={setStudentId} keyboardType="number-pad" />
          <TextField label="학과" placeholder="예: 컴퓨터공학과" value={department} onChangeText={setDepartment} />
          <View style={styles.gradeGroup}>
            <Text style={[type.labelMedium, { color: colors.textSecondary }]}>학년</Text>
            <View style={styles.gradeRow}>
              {GRADES.map(g => (
                <Chip key={g} label={g} selected={grade === g} onPress={() => setGrade(g)} style={styles.flex} />
              ))}
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottom}>
        <Button label="Uni 시작하기" fullWidth disabled={!isReady} onPress={handleDone} />
        {!isReady && (
          <Text style={[type.caption, styles.hint, { color: colors.textTertiary }]}>학번, 학과, 학년을 입력하면 시작할 수 있어요</Text>
        )}
      </View>
    </View>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  flex: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  sub: { marginTop: 8, marginBottom: 24 },
  schoolCard: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: radius.md, paddingLeft: 14, paddingRight: 4, minHeight: 52, marginBottom: 20 },
  form: { gap: 16 },
  gradeGroup: { gap: 8 },
  gradeRow: { flexDirection: 'row', gap: 8 },
  bottom: { paddingHorizontal: 20, gap: 8 },
  hint: { textAlign: 'center' },
}));
