import { router, Tabs, usePathname } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { Feather } from '@expo/vector-icons';
import { PanResponder, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Sidebar from '@/components/Sidebar';
import { AiGradient } from '@/components/ui/AiMark';
import Button, { type FeatherName } from '@/components/ui/Button';
import { radius, type } from '@/constants/design';
import { SidebarContext } from '@/lib/SidebarContext';
import { useTheme } from '@/lib/ThemeContext';
import { supabase } from '@/lib/supabase';

function TabIcon({ name, color }: { name: FeatherName; color: string }) {
  return <Feather name={name} size={24} color={color} />;
}

/** AI홈 탭: AI 전용 색(ai*)으로 구별. 선택되면 보라→핑크 그라데이션 */
function HomeTabIcon({ focused }: { focused: boolean }) {
  const { colors } = useTheme();
  const box = { width: 28, height: 28, borderRadius: 10, alignItems: 'center', justifyContent: 'center' } as const;
  return focused ? (
    <AiGradient style={box}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: '#FFFFFF' }}>✦</Text>
    </AiGradient>
  ) : (
    <View style={[box, { backgroundColor: colors.aiSubtle }]}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.aiText }}>✦</Text>
    </View>
  );
}

const TAB_PATHS = [
  '/(tabs)/timetable',
  '/(tabs)/community',
  '/(tabs)',
  '/(tabs)/map',
  '/(tabs)/chat',
  '/(tabs)/profile',
] as const;

function getTabIndex(pathname: string) {
  if (pathname.includes('timetable')) return 0;
  if (pathname.includes('community')) return 1;
  if (pathname.includes('map')) return 3;
  if (pathname.includes('chat')) return 4;
  if (pathname.includes('profile')) return 5;
  return 2;
}

export default function TabLayout() {
  const insets = useSafeAreaInsets();
  const { colors } = useTheme();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [schoolPopup, setSchoolPopup] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { data } = await supabase
        .from('profiles')
        .select('school')
        .eq('id', user.id)
        .single();
      if (!data?.school) setSchoolPopup(true);
    })();
  }, []);

  const currentIndexRef = useRef(2);
  currentIndexRef.current = getTabIndex(pathname);

  const panResponder = useRef(PanResponder.create({
    onMoveShouldSetPanResponder: (_, gs) =>
      Math.abs(gs.dx) > 18 && Math.abs(gs.dx) > Math.abs(gs.dy) * 3,
    onPanResponderRelease: (_, gs) => {
      const idx = currentIndexRef.current;
      if (gs.dx < -60 && idx < TAB_PATHS.length - 1) {
        router.navigate(TAB_PATHS[idx + 1] as any);
      } else if (gs.dx > 60 && idx > 0) {
        router.navigate(TAB_PATHS[idx - 1] as any);
      }
    },
  })).current;

  return (
    <SidebarContext.Provider value={{ open: () => setSidebarOpen(true) }}>
    <View style={{ flex: 1, backgroundColor: colors.base }} {...panResponder.panHandlers}>
      <Tabs screenOptions={{
        headerShown: false,
        sceneStyle: { backgroundColor: colors.base },
        tabBarStyle: {
          backgroundColor: colors.surface,
          borderTopColor: colors.borderDefault,
          borderTopWidth: 1,
          height: 68 + insets.bottom,
          paddingBottom: 8 + insets.bottom,
          paddingTop: 6,
        },
        tabBarActiveTintColor: colors.accentText,
        tabBarInactiveTintColor: colors.textTertiary,
        tabBarLabelStyle: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
      }}>
        <Tabs.Screen name="timetable" options={{
          title: '시간표',
          tabBarIcon: ({ color }) => <TabIcon name="calendar" color={color} />,
        }} />
        <Tabs.Screen name="community" options={{
          title: '커뮤니티',
          tabBarIcon: ({ color }) => <TabIcon name="message-square" color={color} />,
        }} />
        <Tabs.Screen name="index" options={{
          title: 'AI홈',
          tabBarActiveTintColor: colors.aiText,
          tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        }} />
        <Tabs.Screen name="map" options={{
          title: '맛집',
          tabBarIcon: ({ color }) => <TabIcon name="map" color={color} />,
        }} />
        <Tabs.Screen name="chat" options={{
          title: '채팅',
          tabBarIcon: ({ color }) => <TabIcon name="message-circle" color={color} />,
        }} />
        <Tabs.Screen name="profile" options={{
          title: '프로필',
          tabBarIcon: ({ color }) => <TabIcon name="user" color={color} />,
        }} />
        <Tabs.Screen name="search" options={{ href: null }} />
        <Tabs.Screen name="explore" options={{ href: null }} />
      </Tabs>

      <Sidebar visible={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {schoolPopup && (
        <View style={[styles.popupOverlay, { backgroundColor: colors.overlay }]}>
          <View style={[styles.popup, { backgroundColor: colors.surface }]}>
            <View style={[styles.popupIcon, { backgroundColor: colors.accentSubtle }]}>
              <Feather name="map-pin" size={28} color={colors.accentText} />
            </View>
            <Text style={[type.titleMedium, styles.center, { color: colors.textPrimary }]}>학교를 등록해주세요</Text>
            <Text style={[type.bodyMedium, styles.center, { color: colors.textSecondary }]}>
              학교 정보를 등록하면{'\n'}커뮤니티 맞춤 서비스를 이용할 수 있어요
            </Text>
            <View style={styles.popupBtns}>
              <Button
                label="학교 등록하기"
                fullWidth
                onPress={() => { setSchoolPopup(false); router.push('/onboarding/school' as any); }}
              />
              <Button label="나중에 할게요" variant="ghost" size="M" fullWidth onPress={() => setSchoolPopup(false)} />
            </View>
          </View>
        </View>
      )}
    </View>
    </SidebarContext.Provider>
  );
}

const styles = StyleSheet.create({
  popupOverlay: {
    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
    justifyContent: 'center', alignItems: 'center', zIndex: 999,
  },
  popup: {
    borderRadius: radius.xl, padding: 24, marginHorizontal: 24,
    alignItems: 'center', gap: 8, alignSelf: 'stretch',
  },
  popupIcon: {
    width: 64, height: 64, borderRadius: 32,
    alignItems: 'center', justifyContent: 'center', marginBottom: 8,
  },
  center: { textAlign: 'center' },
  popupBtns: { alignSelf: 'stretch', gap: 4, marginTop: 16 },
});
