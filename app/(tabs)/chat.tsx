import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import { router, useFocusEffect } from 'expo-router';
import { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';
import { startOrOpenChat } from '../../lib/chat';
import { Feather } from '@expo/vector-icons';
import Avatar from '@/components/ui/Avatar';
import IconButton from '@/components/ui/IconButton';
import ScreenHeader from '@/components/ui/ScreenHeader';

type Room = {
  id: string;
  user1_id: string;
  user2_id: string;
  user1_nickname: string;
  user2_nickname: string;
  last_message: string;
  last_message_at: string;
  unread_count?: number;
};

type Friend = {
  id: string;
  partner_id: string;
  partner_nickname: string;
  partner_school: string;
  status: string;
  requester_id: string;
};

type SearchProfile = {
  id: string;
  nickname: string;
  school: string;
};

export default function ChatListScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [rooms, setRooms] = useState<Room[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [pendingReceived, setPendingReceived] = useState<Friend[]>([]);
  const [pendingSent, setPendingSent] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(true);
  const [myId, setMyId] = useState<string | null>(null);
  const [myNickname, setMyNickname] = useState('');

  const [searchModal, setSearchModal] = useState(false);
  const [friendModal, setFriendModal] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchProfile[]>([]);
  const [searching, setSearching] = useState(false);
  const [friendStatuses, setFriendStatuses] = useState<Record<string, 'none' | 'pending_sent' | 'accepted'>>({});

  const roomChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const friendChannelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const myIdRef = useRef<string | null>(null);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      setMyId(user.id);
      myIdRef.current = user.id;
      const { data: profile } = await supabase.from('profiles').select('nickname').eq('id', user.id).single();
      setMyNickname(profile?.nickname ?? user.user_metadata?.nickname ?? '나');
      await Promise.all([loadRooms(user.id), loadFriends(user.id)]);
      subscribeToRooms(user.id);
      subscribeToFriends(user.id);
    })();
    return () => {
      roomChannelRef.current?.unsubscribe();
      friendChannelRef.current?.unsubscribe();
    };
  }, []);

  // 탭 포커스 시 데이터 새로고침 (앱 전환 후 돌아왔을 때 대비)
  useFocusEffect(useCallback(() => {
    const uid = myIdRef.current;
    if (!uid) return;
    loadRooms(uid);
    loadFriends(uid);
  }, []));

  const loadRooms = async (uid: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('chat_rooms').select('*')
      .or(`user1_id.eq.${uid},user2_id.eq.${uid}`)
      .order('last_message_at', { ascending: false });

    if (data) {
      const withUnread = await Promise.all(data.map(async (room) => {
        const { count } = await supabase.from('chat_messages')
          .select('id', { count: 'exact', head: true })
          .eq('room_id', room.id).eq('is_read', false).neq('sender_id', uid);
        return { ...room, unread_count: count ?? 0 };
      }));
      setRooms(withUnread);
    }
    setLoading(false);
  };

  const loadFriends = async (uid: string) => {
    const { data, error } = await supabase
      .from('friends')
      .select('id, requester_id, addressee_id, status')
      .or(`requester_id.eq.${uid},addressee_id.eq.${uid}`);

    if (error || !data) return;

    // 파트너 ID 목록으로 프로필 별도 조회 (FK join명 의존 방지)
    const partnerIds = data.map(row =>
      row.requester_id === uid ? row.addressee_id : row.requester_id
    );
    const { data: profileRows } = partnerIds.length
      ? await supabase.from('profiles').select('id, nickname, school').in('id', partnerIds)
      : { data: [] };
    const profileMap: Record<string, { nickname: string; school: string }> =
      Object.fromEntries((profileRows ?? []).map((p: any) => [p.id, p]));

    const accepted: Friend[] = [];
    const received: Friend[] = [];
    const sent: Friend[] = [];

    for (const row of data) {
      const isRequester = row.requester_id === uid;
      const partnerId = isRequester ? row.addressee_id : row.requester_id;
      const partnerProfile = profileMap[partnerId];

      const entry: Friend = {
        id: row.id,
        partner_id: partnerId,
        partner_nickname: partnerProfile?.nickname ?? '알 수 없음',
        partner_school: partnerProfile?.school ?? '',
        status: row.status,
        requester_id: row.requester_id,
      };

      if (row.status === 'accepted') accepted.push(entry);
      else if (row.status === 'pending' && !isRequester) received.push(entry);
      else if (row.status === 'pending' && isRequester) sent.push(entry);
    }

    setFriends(accepted);
    setPendingReceived(received);
    setPendingSent(sent);
  };

  const subscribeToRooms = (uid: string) => {
    roomChannelRef.current = supabase.channel('chat_rooms_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'chat_rooms' }, () => loadRooms(uid))
      .subscribe();
  };

  const subscribeToFriends = (uid: string) => {
    friendChannelRef.current = supabase.channel('friends_list')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends',
        filter: `addressee_id=eq.${uid}` }, () => loadFriends(uid))
      .on('postgres_changes', { event: '*', schema: 'public', table: 'friends',
        filter: `requester_id=eq.${uid}` }, () => loadFriends(uid))
      .subscribe();
  };

  const acceptFriend = async (friend: Friend) => {
    await supabase.from('friends').update({ status: 'accepted' }).eq('id', friend.id);
    if (myId) loadFriends(myId);
  };

  const declineFriend = async (friend: Friend) => {
    await supabase.from('friends').delete().eq('id', friend.id);
    if (myId) loadFriends(myId);
  };

  const cancelFriendRequest = async (friend: Friend) => {
    await supabase.from('friends').delete().eq('id', friend.id);
    if (myId) loadFriends(myId);
  };

  const chatWithFriend = async (friend: Friend) => {
    if (!myId) return;
    setFriendModal(false);
    try {
      await startOrOpenChat(myId, myNickname, friend.partner_id, friend.partner_nickname);
    } catch (e: any) {
      alert('채팅 시작 실패: ' + (e?.message ?? '알 수 없는 오류'));
    }
  };

  const searchUsers = async (q: string) => {
    if (!q.trim()) { setSearchResults([]); setFriendStatuses({}); return; }
    setSearching(true);
    const { data } = await supabase
      .from('profiles')
      .select('id, nickname, school')
      .ilike('nickname', `%${q.trim()}%`)
      .neq('id', myId ?? '')
      .limit(10);
    const profiles = (data as SearchProfile[]) ?? [];
    setSearchResults(profiles);
    setSearching(false);

    if (profiles.length && myId) {
      const orFilter = profiles.map(p =>
        `and(requester_id.eq.${myId},addressee_id.eq.${p.id}),and(requester_id.eq.${p.id},addressee_id.eq.${myId})`
      ).join(',');
      const { data: frows } = await supabase.from('friends').select('requester_id, addressee_id, status').or(orFilter);
      const statuses: Record<string, 'none' | 'pending_sent' | 'accepted'> = {};
      for (const p of profiles) statuses[p.id] = 'none';
      for (const row of frows ?? []) {
        const pid = row.requester_id === myId ? row.addressee_id : row.requester_id;
        statuses[pid] = row.status === 'accepted' ? 'accepted' : (row.requester_id === myId ? 'pending_sent' : 'none');
      }
      setFriendStatuses(statuses);
    }
  };

  const sendFriendRequest = async (profileId: string) => {
    if (!myId) return;
    const { error } = await supabase
      .from('friends')
      .insert({ requester_id: myId, addressee_id: profileId, status: 'pending' });
    if (error) {
      alert('친구 요청 실패: ' + error.message);
      return;
    }
    setFriendStatuses(prev => ({ ...prev, [profileId]: 'pending_sent' }));
    if (myId) loadFriends(myId);
  };

  const startChatFromSearch = async (profile: SearchProfile) => {
    if (!myId) return;
    setSearchModal(false);
    setSearchQuery('');
    setSearchResults([]);
    await startOrOpenChat(myId, myNickname, profile.id, profile.nickname);
  };

  const getPartnerName = (room: Room) =>
    myId === room.user1_id ? room.user2_nickname : room.user1_nickname;

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return '방금';
    if (diff < 3600) return `${Math.floor(diff / 60)}분 전`;
    if (diff < 86400) return d.toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' });
    return d.toLocaleDateString('ko-KR', { month: 'short', day: 'numeric' });
  };

  const totalPending = pendingReceived.length;

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="채팅"
        actions={
          <>
            <IconButton icon="search" accessibilityLabel="사용자 찾기" onPress={() => setSearchModal(true)} />
            <IconButton icon="users" accessibilityLabel={`친구 목록${totalPending ? `, 받은 요청 ${totalPending}개` : ''}`}
              badge={totalPending} onPress={() => setFriendModal(true)} />
          </>
        }
      />

      {/* 채팅방 목록 */}
      {loading ? (
        <View style={styles.center}><ActivityIndicator color={colors.accentText} /></View>
      ) : rooms.length === 0 ? (
        <View style={styles.center}>
          <View style={styles.emptyIconWrap}>
            <Feather name="message-circle" size={28} color={colors.accentText} />
          </View>
          <Text style={styles.emptyTitle}>아직 채팅이 없어요</Text>
          <Text style={styles.emptySubtitle}>위의 검색으로 사용자를 찾거나{'\n'}커뮤니티에서 프로필을 눌러 대화를 시작하세요</Text>
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {rooms.map((room) => (
            <TouchableOpacity
              key={room.id}
              style={styles.roomCard}
              onPress={() => router.push({ pathname: '/chat/[roomId]' as any, params: { roomId: room.id } })}>
              <Avatar name={getPartnerName(room) || '?'} size={48} />
              <View style={styles.roomInfo}>
                <View style={styles.roomTop}>
                  <Text style={styles.partnerName}>{getPartnerName(room) || '알 수 없음'}</Text>
                  <Text style={styles.timeText}>{formatTime(room.last_message_at)}</Text>
                </View>
                <View style={styles.roomBottom}>
                  <Text style={[styles.lastMessage, (room.unread_count ?? 0) > 0 && { color: colors.textPrimary }]} numberOfLines={1}>
                    {room.last_message || '메시지 없음'}
                  </Text>
                  {(room.unread_count ?? 0) > 0 && (
                    <View style={styles.unreadBadge}>
                      <Text style={styles.unreadText}>{room.unread_count}</Text>
                    </View>
                  )}
                </View>
              </View>
            </TouchableOpacity>
          ))}
          <View style={{ height: 40 }} />
        </ScrollView>
      )}

      {/* 친구 목록 모달 */}
      <Modal visible={friendModal} transparent animationType="slide" onRequestClose={() => setFriendModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, { maxHeight: '85%' }]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>친구 목록</Text>
              <View style={{ flexDirection: 'row', gap: 12, alignItems: 'center' }}>
                <TouchableOpacity onPress={() => myId && loadFriends(myId)}>
                  <Feather name="refresh-cw" size={18} color={colors.textSecondary} />
                </TouchableOpacity>
                <TouchableOpacity onPress={() => setFriendModal(false)}>
                  <Feather name="x" size={22} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>
            </View>

            <ScrollView showsVerticalScrollIndicator={false}>
              {/* 받은 친구 요청 */}
              {pendingReceived.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>받은 요청 {pendingReceived.length}개</Text>
                  {pendingReceived.map(f => (
                    <View key={f.id} style={styles.friendCard}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.avatarText}>{f.partner_nickname[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.partner_nickname}</Text>
                        {f.partner_school ? <Text style={styles.friendSchool}>{f.partner_school}</Text> : null}
                      </View>
                      <View style={styles.requestBtns}>
                        <TouchableOpacity style={styles.acceptBtn} onPress={() => acceptFriend(f)}>
                          <Text style={styles.acceptBtnText}>수락</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.declineBtn} onPress={() => declineFriend(f)}>
                          <Text style={styles.declineBtnText}>거절</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* 보낸 친구 요청 */}
              {pendingSent.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>보낸 요청 {pendingSent.length}개</Text>
                  {pendingSent.map(f => (
                    <View key={f.id} style={styles.friendCard}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.avatarText}>{f.partner_nickname[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.partner_nickname}</Text>
                        {f.partner_school ? <Text style={styles.friendSchool}>{f.partner_school}</Text> : null}
                      </View>
                      <TouchableOpacity style={styles.cancelBtn} onPress={() => cancelFriendRequest(f)}>
                        <Text style={styles.cancelBtnText}>취소</Text>
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* 친구 목록 */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>친구 {friends.length}명</Text>
                {friends.length === 0 ? (
                  <View style={styles.emptyFriends}>
                    <View style={styles.emptyIconWrap}><Feather name="users" size={28} color={colors.accentText} /></View>
                    <Text style={styles.emptyTitle}>아직 친구가 없어요</Text>
                    <Text style={styles.emptySubtitle}>검색으로 사용자를 찾아 친구를 추가하세요</Text>
                  </View>
                ) : (
                  friends.map(f => (
                    <View key={f.id} style={styles.friendCard}>
                      <View style={styles.friendAvatar}>
                        <Text style={styles.avatarText}>{f.partner_nickname[0]?.toUpperCase()}</Text>
                      </View>
                      <View style={styles.friendInfo}>
                        <Text style={styles.friendName}>{f.partner_nickname}</Text>
                        {f.partner_school ? <Text style={styles.friendSchool}>{f.partner_school}</Text> : null}
                      </View>
                      <TouchableOpacity style={styles.chatFriendBtn} onPress={() => chatWithFriend(f)}>
                        <Text style={styles.chatFriendBtnText}>채팅</Text>
                      </TouchableOpacity>
                    </View>
                  ))
                )}
              </View>
              <View style={{ height: 20 }} />
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* 사용자 검색 모달 */}
      <Modal visible={searchModal} transparent animationType="slide" onRequestClose={() => setSearchModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>사용자 찾기</Text>
              <TouchableOpacity onPress={() => { setSearchModal(false); setSearchQuery(''); setSearchResults([]); }}>
                <Feather name="x" size={22} color={colors.textSecondary} />
              </TouchableOpacity>
            </View>
            <View style={styles.modalSearchBox}>
              <Feather name="search" size={18} color={colors.textTertiary} style={{ marginRight: 8 }} />
              <TextInput
                style={styles.modalSearchInput}
                placeholder="닉네임으로 검색..."
                placeholderTextColor={colors.textTertiary}
                value={searchQuery}
                onChangeText={q => { setSearchQuery(q); searchUsers(q); }}
                autoFocus
              />
            </View>
            {searching ? (
              <ActivityIndicator color={colors.accentText} style={{ marginTop: 24 }} />
            ) : (
              <ScrollView style={{ maxHeight: 320 }}>
                {searchResults.map(p => (
                  <View key={p.id} style={styles.searchResultItem}>
                    <View style={styles.friendAvatar}>
                      <Text style={styles.avatarText}>{p.nickname[0]?.toUpperCase()}</Text>
                    </View>
                    <View style={styles.friendInfo}>
                      <Text style={styles.friendName}>{p.nickname}</Text>
                      {p.school ? <Text style={styles.friendSchool}>{p.school}</Text> : null}
                    </View>
                    <View style={{ flexDirection: 'row', gap: 8 }}>
                      {friendStatuses[p.id] === 'accepted' ? (
                        <View style={[styles.tagBtn, { borderColor: colors.success }]}>
                          <Text style={[styles.tagBtnText, { color: colors.success }]}>✓ 친구</Text>
                        </View>
                      ) : friendStatuses[p.id] === 'pending_sent' ? (
                        <View style={[styles.tagBtn, { borderColor: colors.borderStrong }]}>
                          <Text style={[styles.tagBtnText, { color: colors.textSecondary }]}>요청 중</Text>
                        </View>
                      ) : (
                        <TouchableOpacity style={styles.tagBtn} onPress={() => sendFriendRequest(p.id)}>
                          <Text style={styles.tagBtnText}>👤+ 친구</Text>
                        </TouchableOpacity>
                      )}
                      <TouchableOpacity style={styles.tagBtn} onPress={() => startChatFromSearch(p)}>
                        <Text style={styles.tagBtnText}>채팅</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
                {!searching && searchQuery.trim() && searchResults.length === 0 && (
                  <Text style={styles.noResult}>"{searchQuery}" 닉네임 사용자가 없어요</Text>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.base },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 12,
  },
  title: { fontSize: 24, fontWeight: '700', color: c.accentText },
  subtitle: { fontSize: 12, color: c.textTertiary, marginTop: 3 },
  headerBtns: { flexDirection: 'row', gap: 8 },
  headerBtn: {
    backgroundColor: c.surface, borderRadius: 12,
    paddingHorizontal: 12, paddingVertical: 8,
    borderWidth: 1, borderColor: c.borderDefault,
    flexDirection: 'row', alignItems: 'center', gap: 4,
  },
  headerBtnText: { fontSize: 12, color: c.accentText, fontWeight: '700' },
  badge: {
    backgroundColor: c.accentFill, borderRadius: 8,
    minWidth: 16, height: 16,
    paddingHorizontal: 4, justifyContent: 'center', alignItems: 'center',
  },
  badgeText: { fontSize: 12, color: c.onAccent, fontWeight: '700' },

  center: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: 6, padding: 24 },
  emptyIconWrap: { width: 64, height: 64, borderRadius: 32, backgroundColor: c.accentSubtle, alignItems: 'center', justifyContent: 'center', marginBottom: 10 },
  emptyTitle: { fontSize: 17, lineHeight: 24, fontWeight: '700', color: c.textPrimary },
  emptySubtitle: { fontSize: 14, color: c.textSecondary, textAlign: 'center', lineHeight: 20 },
  emptyFriends: { alignItems: 'center', paddingVertical: 32, gap: 10 },

  content: { flex: 1 },
  section: { paddingHorizontal: 4, paddingTop: 20 },
  sectionTitle: { fontSize: 12, fontWeight: '700', color: c.textTertiary, marginBottom: 10 },

  roomCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 12,
  },
  friendCard: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderDefault,
  },
  avatar: {
    width: 50, height: 50, borderRadius: 25,
    backgroundColor: c.accentSubtle, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: c.accentSubtle,
  },
  friendAvatar: {
    width: 40, height: 40, borderRadius: 20,
    backgroundColor: c.accentSubtle, justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: c.accentSubtle,
  },
  avatarText: { fontSize: 16, fontWeight: '700', color: c.accentText },
  roomInfo: { flex: 1 },
  friendInfo: { flex: 1 },
  roomTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 2 },
  partnerName: { flex: 1, fontSize: 16, lineHeight: 22, fontWeight: '700', color: c.textPrimary },
  friendName: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  friendSchool: { fontSize: 12, color: c.textTertiary },
  timeText: { fontSize: 12, color: c.textTertiary },
  roomBottom: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  lastMessage: { flex: 1, fontSize: 14, lineHeight: 20, color: c.textSecondary },
  unreadBadge: {
    backgroundColor: c.accentFill, borderRadius: 10,
    minWidth: 20, height: 20,
    paddingHorizontal: 5, justifyContent: 'center', alignItems: 'center',
  },
  unreadText: { fontSize: 12, color: c.onAccent, fontWeight: '700' },

  requestBtns: { flexDirection: 'row', gap: 6 },
  acceptBtn: {
    backgroundColor: c.accentFill, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
  },
  acceptBtnText: { fontSize: 12, color: c.onAccent, fontWeight: '700' },
  declineBtn: {
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: c.borderDefault,
  },
  declineBtnText: { fontSize: 12, color: c.textSecondary, fontWeight: '700' },
  cancelBtn: {
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: c.borderStrong,
  },
  cancelBtnText: { fontSize: 12, color: c.textSecondary, fontWeight: '700' },
  chatFriendBtn: {
    backgroundColor: c.surface, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: c.accentSubtle,
  },
  chatFriendBtnText: { fontSize: 12, color: c.accentText, fontWeight: '700' },

  modalOverlay: { flex: 1, backgroundColor: c.overlay, justifyContent: 'flex-end' },
  modalCard: {
    backgroundColor: c.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40,
  },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  modalTitle: { fontSize: 18, fontWeight: '700', color: c.textPrimary },
  modalClose: { fontSize: 18, color: c.textTertiary },
  modalSearchBox: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.base, borderRadius: 14,
    borderWidth: 1, borderColor: c.borderDefault,
    paddingHorizontal: 14, paddingVertical: 10, marginBottom: 16,
  },
  modalSearchInput: { flex: 1, color: c.textPrimary, fontSize: 14 },
  searchResultItem: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: c.borderDefault,
  },
  noResult: { textAlign: 'center', color: c.textTertiary, paddingVertical: 24, fontSize: 13 },
  tagBtn: {
    borderRadius: 10, paddingHorizontal: 10, paddingVertical: 6,
    borderWidth: 1, borderColor: c.accentSubtle, backgroundColor: c.surface,
  },
  tagBtnText: { fontSize: 12, color: c.accentText, fontWeight: '700' },
}));
