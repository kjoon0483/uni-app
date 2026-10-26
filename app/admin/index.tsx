import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import { router } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { supabase } from '../../lib/supabase';

type Stats = {
  totalUsers: number;
  bannedUsers: number;
  totalPosts: number;
  totalComments: number;
  totalMessages: number;
  todayPosts: number;
};

export default function AdminDashboard() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [stats, setStats] = useState<Stats>({
    totalUsers: 0, bannedUsers: 0, totalPosts: 0,
    totalComments: 0, totalMessages: 0, todayPosts: 0,
  });

  useEffect(() => { loadStats(); }, []);

  const loadStats = async () => {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const [usersRes, bannedRes, postsRes, commentsRes, msgsRes, todayRes] = await Promise.all([
      supabase.from('profiles').select('id', { count: 'exact', head: true }),
      supabase.from('profiles').select('id', { count: 'exact', head: true }).eq('is_banned', true),
      supabase.from('posts').select('id', { count: 'exact', head: true }),
      supabase.from('comments').select('id', { count: 'exact', head: true }),
      supabase.from('chat_messages').select('id', { count: 'exact', head: true }),
      supabase.from('posts').select('id', { count: 'exact', head: true }).gte('created_at', todayStart.toISOString()),
    ]);
    setStats({
      totalUsers: usersRes.count ?? 0,
      bannedUsers: bannedRes.count ?? 0,
      totalPosts: postsRes.count ?? 0,
      totalComments: commentsRes.count ?? 0,
      totalMessages: msgsRes.count ?? 0,
      todayPosts: todayRes.count ?? 0,
    });
  };

  const STAT_CARDS = [
    { label: '전체 사용자', value: stats.totalUsers, icon: '👤', color: colors.accentText },
    { label: '정지 계정', value: stats.bannedUsers, icon: '🚫', color: '#ef4444' },
    { label: '전체 게시글', value: stats.totalPosts, icon: '📝', color: '#06b6d4' },
    { label: '오늘 게시글', value: stats.todayPosts, icon: '🆕', color: '#10b981' },
    { label: '전체 댓글', value: stats.totalComments, icon: '💬', color: colors.warning },
    { label: '채팅 메시지', value: stats.totalMessages, icon: '✉️', color: colors.accentText },
  ];

  const MENU = [
    { icon: '👤', title: '사용자 관리', desc: '회원 조회, 정지/해제, 관리자 권한 설정', path: '/admin/users' },
    { icon: '📝', title: '게시글 관리', desc: '전체 게시글 조회 및 삭제', path: '/admin/posts' },
    { icon: '💬', title: '댓글 관리', desc: '전체 댓글 조회 및 삭제', path: '/admin/comments' },
  ];

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.canGoBack() ? router.back() : router.replace('/(tabs)' as any)} style={styles.backBtn}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>
        <Text style={styles.title}>관리자 대시보드</Text>
        <View style={styles.adminBadge}>
          <Text style={styles.adminBadgeText}>ADMIN</Text>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.grid}>
          {STAT_CARDS.map((card) => (
            <View key={card.label} style={[styles.statCard, { borderColor: card.color + '40' }]}>
              <Text style={styles.statIcon}>{card.icon}</Text>
              <Text style={[styles.statValue, { color: card.color }]}>{card.value.toLocaleString()}</Text>
              <Text style={styles.statLabel}>{card.label}</Text>
            </View>
          ))}
        </View>

        <Text style={styles.sectionTitle}>관리 메뉴</Text>

        {MENU.map((item) => (
          <TouchableOpacity
            key={item.path}
            style={styles.menuCard}
            onPress={() => router.push(item.path as any)}
          >
            <View style={styles.menuLeft}>
              <Text style={styles.menuIcon}>{item.icon}</Text>
              <View>
                <Text style={styles.menuTitle}>{item.title}</Text>
                <Text style={styles.menuDesc}>{item.desc}</Text>
              </View>
            </View>
            <Text style={styles.menuArrow}>›</Text>
          </TouchableOpacity>
        ))}

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.base },
  header: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingTop: 55, paddingBottom: 16,
  },
  backBtn: { paddingRight: 8 },
  backText: { color: c.accentText, fontSize: 14 },
  title: { flex: 1, fontSize: 20, fontWeight: '700', color: c.textPrimary },
  adminBadge: {
    backgroundColor: c.accentSubtle, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 4,
    borderWidth: 1, borderColor: c.accentFill,
  },
  adminBadgeText: { fontSize: 12, color: c.accentText, fontWeight: '700' },

  content: { flex: 1, paddingHorizontal: 16 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 28 },
  statCard: {
    width: '30%', flexGrow: 1,
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, padding: 14, alignItems: 'center', gap: 4,
  },
  statIcon: { fontSize: 20 },
  statValue: { fontSize: 22, fontWeight: '700' },
  statLabel: { fontSize: 12, color: c.textSecondary, textAlign: 'center' },

  sectionTitle: { fontSize: 14, fontWeight: '700', color: c.textSecondary, marginBottom: 12 },
  menuCard: {
    backgroundColor: c.surface, borderRadius: 16,
    borderWidth: 1, borderColor: c.borderDefault,
    padding: 16, marginBottom: 10,
    flexDirection: 'row', alignItems: 'center',
  },
  menuLeft: { flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1 },
  menuIcon: { fontSize: 24 },
  menuTitle: { fontSize: 15, fontWeight: '700', color: c.textPrimary, marginBottom: 2 },
  menuDesc: { fontSize: 12, color: c.textTertiary },
  menuArrow: { fontSize: 20, color: c.textTertiary },
}));
