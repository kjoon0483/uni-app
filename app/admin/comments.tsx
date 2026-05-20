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

type Comment = {
  id: string;
  body: string;
  author_nickname: string;
  author_id: string | null;
  likes: number;
  created_at: string;
  post_id: string;
  parent_id: string | null;
  post_title: string;
};

export default function AdminComments() {
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => { loadComments(); }, []);

  const loadComments = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('comments')
      .select('id, body, author_nickname, author_id, likes, created_at, post_id, parent_id, posts(title)')
      .order('created_at', { ascending: false })
      .limit(300);

    if (!error && data) {
      setComments(data.map((c: any) => ({
        ...c,
        post_title: c.posts?.title ?? '(삭제된 게시글)',
      })));
    } else if (error) {
      setDeleteError('댓글 로드 실패: ' + error.message);
    }
    setLoading(false);
  };

  const confirmDelete = (comment: Comment) => {
    setDeleteError('');
    const preview = comment.body.slice(0, 30) + (comment.body.length > 30 ? '...' : '');
    if (Platform.OS === 'web') {
      if (window.confirm(`"${preview}" 댓글을 삭제하시겠습니까?`)) {
        doDelete(comment.id);
      }
    } else {
      Alert.alert(
        '댓글 삭제',
        `"${preview}" 댓글을 삭제하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '삭제', style: 'destructive', onPress: () => doDelete(comment.id) },
        ]
      );
    }
  };

  const doDelete = async (commentId: string) => {
    setDeletingId(commentId);
    const { error, count } = await supabase
      .from('comments')
      .delete({ count: 'exact' })
      .eq('id', commentId);
    if (error) {
      setDeleteError('삭제 실패: ' + error.message);
    } else if (count === 0) {
      setDeleteError('삭제 권한 없음 — Supabase SQL Editor에서 관리자 RLS 정책을 실행해주세요 (migrations.sql 11~15번 섹션)');
    } else {
      setComments(prev => prev.filter(c => c.id !== commentId));
    }
    setDeletingId(null);
  };

  const filtered = searchQuery.trim()
    ? comments.filter(c =>
        c.body.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (c.author_nickname ?? '').toLowerCase().includes(searchQuery.toLowerCase()) ||
        c.post_title.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : comments;

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.toLocaleDateString('ko-KR')} ${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/admin' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>댓글 관리</Text>
        <Text style={styles.count}>{filtered.length}개</Text>
      </View>

      {deleteError ? (
        <View style={styles.errorBanner}>
          <Text style={styles.errorBannerText}>⚠️ {deleteError}</Text>
          <TouchableOpacity onPress={() => setDeleteError('')}>
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
          placeholder="댓글 내용, 작성자, 게시글 검색..."
          placeholderTextColor="#44445a"
        />
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator color="#7c6fff" />
        </View>
      ) : (
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {filtered.length === 0 ? (
            <View style={styles.center}>
              <Text style={styles.emptyText}>댓글이 없어요</Text>
            </View>
          ) : filtered.map((comment) => (
            <View key={comment.id} style={styles.commentCard}>
              <View style={styles.postRef}>
                <Text style={styles.postRefIcon}>{comment.parent_id ? '↳ 대댓글' : '💬'}</Text>
                <Text style={styles.postRefTitle} numberOfLines={1}>{comment.post_title}</Text>
              </View>
              <Text style={styles.commentBody} numberOfLines={3}>{comment.body}</Text>
              <View style={styles.commentFooter}>
                <Text style={styles.author}>{comment.author_nickname || '익명'}</Text>
                <Text style={styles.date}>{formatDate(comment.created_at)}</Text>
                <View style={styles.metaRow}>
                  <Text style={styles.metaText}>❤️ {comment.likes ?? 0}</Text>
                  <TouchableOpacity
                    style={[styles.deleteBtn, deletingId === comment.id && styles.deleteBtnDisabled]}
                    onPress={() => confirmDelete(comment)}
                    disabled={deletingId === comment.id}
                  >
                    {deletingId === comment.id
                      ? <ActivityIndicator size="small" color="#ff6666" />
                      : <Text style={styles.deleteBtnText}>삭제</Text>
                    }
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

  errorBanner: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: '#ff444422', borderWidth: 1, borderColor: '#ff4444',
    marginHorizontal: 16, marginBottom: 8, borderRadius: 10,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  errorBannerText: { flex: 1, color: '#ff6666', fontSize: 12 },
  errorClose: { color: '#ff6666', fontSize: 14, fontWeight: '700', paddingLeft: 8 },

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
  commentCard: {
    backgroundColor: '#13131a', borderRadius: 14,
    borderWidth: 1, borderColor: '#1e1e30',
    padding: 14, marginBottom: 10,
  },
  postRef: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    marginBottom: 8, paddingBottom: 8,
    borderBottomWidth: 1, borderBottomColor: '#1e1e30',
  },
  postRefIcon: { fontSize: 12, color: '#555' },
  postRefTitle: { flex: 1, fontSize: 11, color: '#7c6fff', fontWeight: '600' },
  commentBody: { fontSize: 13, color: '#ddd', lineHeight: 20, marginBottom: 10 },
  commentFooter: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  author: { fontSize: 11, color: '#888', fontWeight: '600' },
  date: { flex: 1, fontSize: 10, color: '#555' },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  metaText: { fontSize: 11, color: '#555' },
  deleteBtn: {
    backgroundColor: '#ff444422', borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 5,
    borderWidth: 1, borderColor: '#ff4444',
    minWidth: 44, alignItems: 'center',
  },
  deleteBtnDisabled: { opacity: 0.5 },
  deleteBtnText: { fontSize: 11, color: '#ff6666', fontWeight: '700' },
});
