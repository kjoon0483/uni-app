import { makeStyles } from '@/lib/makeStyles';
import { router, useFocusEffect } from 'expo-router';
import React, { useCallback, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import {
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import Avatar from '@/components/ui/Avatar';
import Button, { type FeatherName } from '@/components/ui/Button';
import ScreenHeader from '@/components/ui/ScreenHeader';
import { radius, type } from '@/constants/design';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

export default function ProfileScreen() {
  const styles = useStyles();
  const { colors, mode, setMode } = useTheme();
  const [email, setEmail] = useState('');
  const [nickname, setNickname] = useState('');
  const [schoolName, setSchoolName] = useState('');
  const [, setSchoolEmoji] = useState('🏫');
  const [loading, setLoading] = useState(true);
  const [logoutMsg, setLogoutMsg] = useState('');
  const [logoutLoading, setLogoutLoading] = useState(false);

  // 프로필 편집 후 돌아왔을 때 최신 정보 반영
  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      const loadProfile = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          setEmail(session.user.email ?? '');
          const { data: profile } = await supabase
            .from('profiles')
            .select('nickname, school_name, school_emoji')
            .eq('id', session.user.id)
            .single();
          const meta = session.user.user_metadata ?? {};
          setNickname(profile?.nickname ?? meta.nickname ?? '학생');
          setSchoolName(profile?.school_name ?? meta.school_name ?? '');
          setSchoolEmoji(profile?.school_emoji ?? meta.school_emoji ?? '🏫');
        }
        setLoading(false);
      };
      loadProfile();
    }, [])
  );

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await supabase.auth.signOut();
      setLogoutMsg('로그아웃 됐어요. 잠시 후 이동합니다...');
      setTimeout(() => router.replace('/onboarding/register'), 1500);
    } catch {
      setLogoutMsg('로그아웃 중 오류가 발생했어요');
      setLogoutLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.base }]}>
      <ScreenHeader title="프로필" />
      <ScrollView contentContainerStyle={styles.content}>
        {/* 프로필 카드 */}
        <View style={[styles.profileCard, { backgroundColor: colors.surface }]}>
          <Avatar name={nickname || '?'} size={72} />
          <View style={styles.flex}>
            <Text style={[type.titleMedium, { color: colors.textPrimary }]} numberOfLines={1}>{loading ? '…' : nickname}</Text>
            <View style={styles.schoolRow}>
              <Feather name="map-pin" size={14} color={colors.textTertiary} />
              <Text style={[type.bodyMedium, { color: colors.textSecondary }]} numberOfLines={1}>{schoolName || '학교 미설정'}</Text>
            </View>
          </View>
        </View>
        <Button label="프로필 편집" icon="edit-3" variant="secondary" size="M" fullWidth onPress={() => router.push('/edit-profile')} />

        <Group title="계정">
          <Row icon="user" label="닉네임" value={loading ? '…' : nickname} />
          <Row icon="mail" label="이메일" value={loading ? '…' : email} />
          <Row icon="map-pin" label="학교" value={loading ? '…' : (schoolName || '미설정')} />
        </Group>

        <Group title="앱">
          <Row icon={mode === 'dark' ? 'moon' : 'sun'} label="테마" value={mode === 'dark' ? '다크' : '라이트'}
            onPress={() => setMode(mode === 'dark' ? 'light' : 'dark')} />
          <Row icon="info" label="버전" value="1.0.0" />
        </Group>

        {/* 로그아웃 */}
        {logoutMsg ? (
          <Text style={[type.labelLarge, styles.logoutMsg, { color: colors.success }]}>{logoutMsg}</Text>
        ) : (
          <Group>
            <Row icon="log-out" label={logoutLoading ? '로그아웃 중…' : '로그아웃'} danger onPress={logoutLoading ? undefined : handleLogout} />
          </Group>
        )}
      </ScrollView>
    </View>
  );
}

function Group({ title, children }: { title?: string; children: React.ReactNode }) {
  const styles = useStyles();
  const { colors } = useTheme();
  return (
    <View style={styles.group}>
      {title ? <Text style={[type.labelSmall, styles.groupTitle, { color: colors.textTertiary }]}>{title}</Text> : null}
      <View style={[styles.groupCard, { backgroundColor: colors.surface }]}>{children}</View>
    </View>
  );
}

function Row({ icon, label, value, onPress, danger }: {
  icon: FeatherName; label: string; value?: string; onPress?: () => void; danger?: boolean;
}) {
  const styles = useStyles();
  const { colors } = useTheme();
  const fg = danger ? colors.danger : colors.textPrimary;
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      accessibilityRole={onPress ? 'button' : undefined}
      style={({ pressed }) => [styles.row, { borderTopColor: colors.borderDefault }, pressed && { backgroundColor: colors.raised }]}>
      <Feather name={icon} size={20} color={danger ? colors.danger : colors.textSecondary} />
      <Text style={[type.bodyLarge, styles.flex, { color: fg }]}>{label}</Text>
      {value ? <Text style={[type.bodyMedium, styles.rowValue, { color: colors.textTertiary }]} numberOfLines={1}>{value}</Text> : null}
      {onPress && !danger ? <Feather name="chevron-right" size={18} color={colors.textTertiary} /> : null}
    </Pressable>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  content: { paddingHorizontal: 20, paddingTop: 4, paddingBottom: 40, gap: 16 },
  flex: { flex: 1 },
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: radius.lg, padding: 16 },
  schoolRow: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 2 },
  group: { gap: 8 },
  groupTitle: { paddingHorizontal: 4 },
  groupCard: { borderRadius: radius.lg, overflow: 'hidden' },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    minHeight: 52, paddingHorizontal: 16, borderTopWidth: 1, marginTop: -1,
  },
  rowValue: { maxWidth: '55%', textAlign: 'right' },
  logoutMsg: { textAlign: 'center', marginTop: 8 },
}));
