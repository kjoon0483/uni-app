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

const TABS = ['전체', '자유', '질문', '정보', '익명'];

type Post = {
  id: string;
  title: string;
  body: string;
  tab: string;
  author_nickname: string;
  is_anonymous: boolean;
  likes: number;
  created_at: string;
};

export default function AdminPosts() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTab, setSelectedTab] = useState('전체');

  useEffect(() => { loadPosts(); }, []);

  const loadPosts = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('posts')
      .select('id, title, body, tab, author_nickname, is_anonymous, likes, created_at')
      .order('created_at', { ascending: false })
      .limit(200);
    if (!error) setPosts((data as Post[]) ?? []);
    setLoading(false);
  };

  const deletePost = (post: Post) => {
    Alert.alert(
      '게시글 삭제',
      `"${post.title}" 게시글과 관련 댓글을 모두 삭제하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제', style: 'destructive',
          onPress: async () => {
            const { error } = await supabase.from('posts').delete().eq('id', post.id);
            if (!error) setPosts(prev => prev.filter(p => p.id !== post.id));
            else Alert.alert('오류', error.message);
          },
        },
      ]
    );
  };

  const filtered = posts.filter(p => {
    const matchTab = selectedTab === '전체' || p.tab === selectedTab;
    const q = searchQuery.toLowerCase();
    const matchSearch = !q ||
      p.title.toLowerCase().includes(q) ||
      p.body.toLowerCase().includes(q) ||
      (p.author_nickname ?? '').toLowerCase().includes(q);
    return matchTab && matchSearch;
  });

  const formatDate = (iso: string) => new Date(iso).toLocaleDateString('ko-KR');

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>게시글 관리</Text>
        <Text style={styles.count}>{filtered.length}개</Text>
      </View>

      <View style={styles.searchBox}>
        <Text style={styles.searchIcon}>🔍</Text>
        <TextInput
          style={styles.searchInput}
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="제목, 내용, 작성자 검색..."
          placeholderTextColor="#44445a"
        />
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.tabScroll}
        contentContainerStyle={styles.tabRow}
      >
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab}
            style={[styles.tabBtn, selectedTab === tab && styles.tabBtnActive]}
            onPress={() => setSelectedTab(tab)}
          >
            <Text style={[styles.tabText, selectedTab === tab && styles.tabTextActive]}>{tab}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7c6fff" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>게시글이 없어요</Text>
            </View>
          ) : filtered.map((post) => (
            <View key={post.id} style={styles.postCard}>
              <View style={styles.postTop}>
                <View style={styles.catBadge}>
                  <Text style={styles.catText}>{post.tab}</Text>
                </View>
                {post.is_anonymous && (
                  <View style={styles.anonBadge}>
                    <Text style={styles.anonText}>익명</Text>
                  </View>
                )}
                <Text style={styles.date}>{formatDate(post.created_at)}</Text>
              </View>
              <Text style={styles.postTitle} numberOfLines={1}>{post.title}</Text>
              <Text style={styles.postContent} numberOfLines={2}>{post.body}</Text>
              <View style={styles.postFooter}>
                <Text style={styles.author}>
                  {post.is_anonymous ? '익명' : (post.author_nickname || '알 수 없음')}
                </Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>❤️ {post.likes ?? 0}</Text>
                  <TouchableOpacity style={styles.deleteBtn} onPress={() => deletePost(post)}>
                    <Text style={styles.deleteBtnText}>삭제</Text>
                  </TouchableOpacity>
                </View>
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
    marginHorizontal: 16, marginBottom: 8,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  searchIcon: { fontSize: 14, marginRight: 8 },
  searchInput: { flex: 1, color: '#eee', fontSize: 13 },

  tabScroll: { flexGrow: 0, marginBottom: 8 },
  tabRow: { paddingHorizontal: 16, gap: 8, flexDirection: 'row' },
  tabBtn: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, backgroundColor: '#13131a',
    borderWidth: 1, borderColor: '#2a2a40',
  },
  tabBtnActive: { backgroundColor: '#7c6fff22', borderColor: '#7c6fff' },
  tabText: { fontSize: 12, color: '#666', fontWeight: '600' },
  tabTextActive: { color: '#7c6fff' },

  content: { flex: 1, paddingHorizontal: 16 },
  postCard: {
    backgroundColor: '#13131a', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e30',
    padding: 14, marginBottom: 10,
  },
  postTop: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 8 },
  catBadge: {
    backgroundColor: '#1a1a2e', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  catText: { fontSize: 10, color: '#7c6fff', fontWeight: '700' },
  anonBadge: {
    backgroundColor: '#2a2a2a', borderRadius: 8,
    paddingHorizontal: 8, paddingVertical: 3,
  },
  anonText: { fontSize: 10, color: '#888', fontWeight: '700' },
  date: { fontSize: 11, color: '#555', marginLeft: 'auto' },
  postTitle: { fontSize: 14, fontWeight: '700', color: '#eee', marginBottom: 4 },
  postContent: { fontSize: 12, color: '#888', lineHeight: 18, marginBottom: 10 },
  postFooter: { flexDirection: 'row', alignItems: 'center' },
  author: { flex: 1, fontSize: 11, color: '#666' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { fontSize: 11, color: '#555' },
  deleteBtn: {
    backgroundColor: '#ff444422', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#ff4444',
  },
  deleteBtnText: { fontSize: 11, color: '#ff6666', fontWeight: '700' },
});
