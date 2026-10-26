import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Profile = {
  id: string;
  nickname: string;
  email: string;
  school: string;
  is_admin: boolean;
  is_banned?: boolean;
  created_at: string;
};

export default function AdminUsers() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [myId, setMyId] = useState<string | null>(null);
  const [actionError, setActionError] = useState('');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data?.user?.id ?? null));
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data, error } = await supabase.rpc('get_profiles_for_admin');
    if (error) setActionError('불러오기 실패: ' + error.message);
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  };

  const filtered = searchQuery.trim()
    ? users.filter(u =>
        (u.nickname ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const RLS_MSG = 'Supabase SQL Editor에서 관리자 RLS 정책을 실행해주세요 (migrations.sql 11~15번 섹션)';

  const doToggleAdmin = async (user: Profile) => {
    if (user.id === myId) { setActionError('본인의 관리자 권한은 변경할 수 없습니다.'); return; }
    setLoadingId(user.id);
    setActionError('');
    const { error, count } = await supabase
      .from('profiles').update({ is_admin: !user.is_admin }, { count: 'exact' }).eq('id', user.id);
    if (error) setActionError('권한 변경 실패: ' + error.message);
    else if (count === 0) setActionError('권한 없음 — ' + RLS_MSG);
    else await loadUsers();
    setLoadingId(null);
  };

  const doToggleBan = async (user: Profile) => {
    if (user.id === myId) { setActionError('본인 계정은 정지할 수 없습니다.'); return; }
    setLoadingId(user.id);
    setActionError('');
    const { error, count } = await supabase
      .from('profiles').update({ is_banned: !user.is_banned }, { count: 'exact' }).eq('id', user.id);
    if (error) setActionError('정지 처리 실패: ' + error.message);
    else if (count === 0) setActionError('권한 없음 — ' + RLS_MSG);
    else await loadUsers();
    setLoadingId(null);
  };

  const doDeleteUser = async (user: Profile) => {
    if (user.id === myId) { setActionError('본인 계정은 삭제할 수 없습니다.'); return; }
    setLoadingId(user.id);
    setActionError('');
    const { error, count } = await supabase
      .from('profiles').delete({ count: 'exact' }).eq('id', user.id);
    if (error) setActionError('삭제 실패: ' + error.message);
    else if (count === 0) setActionError('권한 없음 — ' + RLS_MSG);
    else setUsers(prev => prev.filter(u => u.id !== user.id));
    setLoadingId(null);
  };

  const toggleAdmin = (user: Profile) => {
    setActionError('');
    if (Platform.OS === 'web') {
      const action = user.is_admin ? '관리자 권한을 해제' : '관리자 권한을 부여';
      if (window.confirm(`${user.nickname || user.email}의 ${action}하시겠습니까?`)) doToggleAdmin(user);
    } else {
      const action = user.is_admin ? '관리자 권한 해제' : '관리자 권한 부여';
      Alert.alert(action, `${user.nickname || user.email}에게 ${action}하시겠습니까?`, [
        { text: '취소', style: 'cancel' },
        { text: '확인', onPress: () => doToggleAdmin(user) },
      ]);
    }
  };

  const toggleBan = (user: Profile) => {
    setActionError('');
    if (Platform.OS === 'web') {
      const msg = user.is_banned
        ? `${user.nickname || user.email}의 정지를 해제하시겠습니까?`
        : `${user.nickname || user.email}을 정지하면 로그인이 차단됩니다. 계속하시겠습니까?`;
      if (window.confirm(msg)) doToggleBan(user);
    } else {
      const action = user.is_banned ? '정지 해제' : '계정 정지';
      Alert.alert(action, `${user.nickname || user.email}\n${user.is_banned ? '정지를 해제하시겠습니까?' : '정지하면 로그인이 차단됩니다.'}`, [
        { text: '취소', style: 'cancel' },
        { text: action, style: user.is_banned ? 'default' : 'destructive', onPress: () => doToggleBan(user) },
      ]);
    }
  };

  const deleteUser = (user: Profile) => {
    setActionError('');
    if (Platform.OS === 'web') {
      if (window.confirm(`"${user.nickname || user.email}" 계정을 완전히 삭제하시겠습니까? 되돌릴 수 없습니다.`)) doDeleteUser(user);
    } else {
      Alert.alert('계정 삭제', `"${user.nickname || user.email}" 계정을 완전히 삭제하시겠습니까?\n되돌릴 수 없습니다.`, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => doDeleteUser(user) },
      ]);
    }
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>사용자 관리</Text>
        <Text style={styles.count}>{filtered.length}명</Text>
      </View>

      {actionError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {actionError}</Text>
          <TouchableOpacity onPress={() => setActionError('')}>
            <Text style={styles.errorClose}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : null}

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="닉네임 또는 이메일 검색..."
          placeholderTextColor={colors.textTertiary}
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color={colors.accentText} />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 && (
            <View style={styles.center}>
              <Text style={styles.emptyText}>사용자가 없어요</Text>
            </View>
          )}
          {filtered.map((user) => (
            <View key={user.id} style={[styles.userCard, user.is_banned && styles.userCardBanned]}>
              <View style={styles.userTop}>
                <View style={[styles.avatar, user.is_banned && styles.avatarBanned]}>
                  <Text style={[styles.avatarText, user.is_banned && styles.avatarTextBanned]}>
                    {(user.nickname || user.email || '?')[0].toUpperCase()}
                  </Text>
                </View>
                <View style={styles.userInfo}>
                  <View style={styles.nameRow}>
                    <Text style={[styles.nickname, user.is_banned && styles.nicknameBanned]}>
                      {user.nickname || '(닉네임 없음)'}
                    </Text>
                    {user.is_admin && (
                      <View style={styles.adminBadge}>
                        <Text style={styles.adminBadgeText}>ADMIN</Text>
                      </View>
                    )}
                    {user.is_banned && (
                      <View style={styles.bannedBadge}>
                        <Text style={styles.bannedBadgeText}>정지</Text>
                      </View>
                    )}
                    {user.id === myId && (
                      <View style={styles.meBadge}>
                        <Text style={styles.meBadgeText}>나</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.email}>{user.email}</Text>
                  <Text style={styles.school}>
                    {user.school || '학교 미설정'} · {formatDate(user.created_at)}
                  </Text>
                </View>
              </View>

              <View style={styles.btnRow}>
                <TouchableOpacity
                  style={[styles.actionBtn, user.is_banned ? styles.unbanBtn : styles.banBtn]}
                  onPress={() => toggleBan(user)}
                  disabled={loadingId === user.id}
                >
                  {loadingId === user.id
                    ? <ActivityIndicator size="small" color={colors.textSecondary} />
                    : <Text style={[styles.actionBtnText, user.is_banned ? styles.unbanText : styles.banText]}>
                        {user.is_banned ? '정지 해제' : '계정 정지'}
                      </Text>
                  }
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, user.is_admin ? styles.adminActiveBtn : styles.adminBtn]}
                  onPress={() => toggleAdmin(user)}
                  disabled={loadingId === user.id}
                >
                  <Text style={[styles.actionBtnText, user.is_admin ? styles.adminActiveText : styles.adminText]}>
                    {user.is_admin ? '관리자 해제' : '관리자 지정'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => deleteUser(user)}
                  disabled={loadingId === user.id}
                >
                  <Text style={[styles.actionBtnText, styles.deleteText]}>삭제</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.base },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: c.accentText, fontSize: 14 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: c.textPrimary },
  count: { fontSize: 14, color: c.textTertiary },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: c.textTertiary, fontSize: 14 },

  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.dangerSubtle, borderWidth: 1, borderColor: c.danger,
    marginHorizontal: 16, marginBottom: 8, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorBannerText: { flex: 1, color: c.danger, fontSize: 12 },
  errorClose: { color: c.danger, fontSize: 14, fontWeight: '700', paddingLeft: 8 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.borderDefault,
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: c.textPrimary, fontSize: 13 },

  content: { flex: 1, paddingHorizontal: 16 },
  userCard: {
    backgroundColor: c.surface, borderRadius: 16,
    borderWidth: 1, borderColor: c.borderDefault,
    padding: 14, marginBottom: 10,
  },
  userCardBanned: { borderColor: c.danger, backgroundColor: c.dangerSubtle },
  userTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: c.accentSubtle, justifyContent: 'center', alignItems: 'center',
  },
  avatarBanned: { backgroundColor: c.dangerSubtle },
  avatarText: { fontSize: 18, fontWeight: '700', color: c.accentText },
  avatarTextBanned: { color: c.danger },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  nickname: { fontSize: 15, fontWeight: '700', color: c.textPrimary },
  nicknameBanned: { color: c.textSecondary },
  adminBadge: {
    backgroundColor: c.accentSubtle, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: c.accentFill,
  },
  adminBadgeText: { fontSize: 12, color: c.accentText, fontWeight: '700' },
  bannedBadge: {
    backgroundColor: c.dangerSubtle, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: c.danger,
  },
  bannedBadgeText: { fontSize: 12, color: c.danger, fontWeight: '700' },
  meBadge: {
    backgroundColor: c.raised, borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: c.success,
  },
  meBadgeText: { fontSize: 12, color: c.success, fontWeight: '700' },
  email: { fontSize: 12, color: c.textSecondary, marginBottom: 2 },
  school: { fontSize: 12, color: c.textTertiary },

  btnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1, minHeight: 34, justifyContent: 'center',
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  banBtn: { backgroundColor: c.dangerSubtle, borderColor: c.danger },
  banText: { color: c.danger },
  unbanBtn: { backgroundColor: c.surface, borderColor: c.success },
  unbanText: { color: c.success },
  adminBtn: { backgroundColor: c.surface, borderColor: c.borderDefault },
  adminText: { color: c.textSecondary },
  adminActiveBtn: { backgroundColor: c.accentSubtle, borderColor: c.accentFill },
  adminActiveText: { color: c.accentText },
  deleteBtn: { backgroundColor: c.dangerSubtle, borderColor: c.danger, flex: 0, paddingHorizontal: 16 },
  deleteText: { color: c.danger },
}));
