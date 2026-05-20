import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
  is_banned: boolean;
  created_at: string;
};

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => setMyId(data?.user?.id ?? null));
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, nickname, email, school, is_admin, is_banned, created_at')
      .order('created_at', { ascending: false });
    setUsers((data as Profile[]) ?? []);
    setLoading(false);
  };

  const filtered = searchQuery.trim()
    ? users.filter(u =>
        (u.nickname ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        (u.email ?? '').toLowerCase().includes(searchQuery.toLowerCase())
      )
    : users;

  const toggleAdmin = (user: Profile) => {
    if (user.id === myId) {
      Alert.alert('불가', '본인의 관리자 권한은 변경할 수 없습니다.');
      return;
    }
    const action = user.is_admin ? '관리자 권한 해제' : '관리자 권한 부여';
    Alert.alert(action, `${user.nickname || user.email}의 ${action}하시겠습니까?`, [
      { text: '취소', style: 'cancel' },
      {
        text: '확인',
        onPress: async () => {
          const { error } = await supabase
            .from('profiles').update({ is_admin: !user.is_admin }).eq('id', user.id);
          if (!error) loadUsers();
          else Alert.alert('오류', error.message);
        },
      },
    ]);
  };

  const toggleBan = (user: Profile) => {
    if (user.id === myId) {
      Alert.alert('불가', '본인 계정은 정지할 수 없습니다.');
      return;
    }
    const action = user.is_banned ? '정지 해제' : '계정 정지';
    const detail = user.is_banned
      ? '이 사용자의 정지를 해제하시겠습니까?'
      : '이 사용자를 정지하면 로그인이 차단됩니다. 계속하시겠습니까?';
    Alert.alert(action, `${user.nickname || user.email}\n${detail}`, [
      { text: '취소', style: 'cancel' },
      {
        text: action, style: user.is_banned ? 'default' : 'destructive',
        onPress: async () => {
          const { error } = await supabase
            .from('profiles').update({ is_banned: !user.is_banned }).eq('id', user.id);
          if (!error) loadUsers();
          else Alert.alert('오류', error.message);
        },
      },
    ]);
  };

  const deleteUser = (user: Profile) => {
    if (user.id === myId) {
      Alert.alert('불가', '본인 계정은 삭제할 수 없습니다.');
      return;
    }
    Alert.alert(
      '계정 삭제',
      `"${user.nickname || user.email}" 계정을 완전히 삭제하시겠습니까?\n이 작업은 되돌릴 수 없습니다.`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('profiles').delete().eq('id', user.id);
            if (!error) setUsers(prev => prev.filter(u => u.id !== user.id));
            else Alert.alert('오류', error.message);
          },
        },
      ]
    );
  };

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>사용자 관리</Text>
        <Text style={styles.count}>{filtered.length}명</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="닉네임 또는 이메일 검색..."
          placeholderTextColor="#44445a"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7c6fff" />
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
                >
                  <Text style={[styles.actionBtnText, user.is_banned ? styles.unbanText : styles.banText]}>
                    {user.is_banned ? '정지 해제' : '계정 정지'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, user.is_admin ? styles.adminActiveBtn : styles.adminBtn]}
                  onPress={() => toggleAdmin(user)}
                >
                  <Text style={[styles.actionBtnText, user.is_admin ? styles.adminActiveText : styles.adminText]}>
                    {user.is_admin ? '관리자 해제' : '관리자 지정'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.actionBtn, styles.deleteBtn]}
                  onPress={() => deleteUser(user)}
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

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070d' },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: '#7c6fff', fontSize: 14 },
  title: { flex: 1, fontSize: 20, fontWeight: '900', color: '#eee' },
  count: { fontSize: 14, color: '#666' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 60 },
  emptyText: { color: '#555', fontSize: 14 },

  searchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#13131a', borderRadius: 14,
    borderWidth: 1, borderColor: '#2a2a40',
    marginHorizontal: 16, marginBottom: 12,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#eee', fontSize: 13 },

  content: { flex: 1, paddingHorizontal: 16 },
  userCard: {
    backgroundColor: '#13131a', borderRadius: 16,
    borderWidth: 1, borderColor: '#1e1e30',
    padding: 14, marginBottom: 10,
  },
  userCardBanned: { borderColor: '#ef444430', backgroundColor: '#1a0a0a' },
  userTop: { flexDirection: 'row', gap: 12, marginBottom: 12 },
  avatar: {
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#7c6fff33', justifyContent: 'center', alignItems: 'center',
  },
  avatarBanned: { backgroundColor: '#ef444422' },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#7c6fff' },
  avatarTextBanned: { color: '#ef4444' },
  userInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2, flexWrap: 'wrap' },
  nickname: { fontSize: 15, fontWeight: '700', color: '#eee' },
  nicknameBanned: { color: '#888' },
  adminBadge: {
    backgroundColor: '#7c6fff22', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#7c6fff',
  },
  adminBadgeText: { fontSize: 9, color: '#7c6fff', fontWeight: '900' },
  bannedBadge: {
    backgroundColor: '#ef444422', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#ef4444',
  },
  bannedBadgeText: { fontSize: 9, color: '#ef4444', fontWeight: '900' },
  meBadge: {
    backgroundColor: '#10b98122', borderRadius: 6,
    paddingHorizontal: 6, paddingVertical: 2,
    borderWidth: 1, borderColor: '#10b981',
  },
  meBadgeText: { fontSize: 9, color: '#10b981', fontWeight: '900' },
  email: { fontSize: 12, color: '#888', marginBottom: 2 },
  school: { fontSize: 11, color: '#555' },

  btnRow: { flexDirection: 'row', gap: 8 },
  actionBtn: {
    flex: 1, borderRadius: 10, paddingVertical: 8, alignItems: 'center',
    borderWidth: 1,
  },
  actionBtnText: { fontSize: 12, fontWeight: '700' },
  banBtn: { backgroundColor: '#1a0a0a', borderColor: '#ef4444' },
  banText: { color: '#ef4444' },
  unbanBtn: { backgroundColor: '#0a1a0a', borderColor: '#10b981' },
  unbanText: { color: '#10b981' },
  adminBtn: { backgroundColor: '#1a1a2e', borderColor: '#2a2a40' },
  adminText: { color: '#888' },
  adminActiveBtn: { backgroundColor: '#7c6fff22', borderColor: '#7c6fff' },
  adminActiveText: { color: '#7c6fff' },
  deleteBtn: { backgroundColor: '#ff444411', borderColor: '#ff4444', flex: 0, paddingHorizontal: 16 },
  deleteText: { color: '#ff6666' },
});
