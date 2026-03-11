import { Tabs } from 'expo-router';
import { Text, View } from 'react-native';

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 20, opacity: focused ? 1 : 0.5 }}>{emoji}</Text>
  );
}

function HomeTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={{
      width: 46, height: 46, borderRadius: 23,
      backgroundColor: focused ? '#7c6fff' : '#2a2a40',
      alignItems: 'center', justifyContent: 'center',
      marginBottom: 4,
      shadowColor: '#7c6fff',
      shadowOffset: { width: 0, height: 0 },
      shadowOpacity: focused ? 0.8 : 0,
      shadowRadius: 10,
      elevation: focused ? 8 : 0,
    }}>
      <Text style={{ fontSize: 18, color: '#fff' }}>✦</Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs screenOptions={{
      headerShown: false,
      tabBarStyle: {
        backgroundColor: '#0a0a12',
        borderTopColor: '#1a1a2e',
        borderTopWidth: 1,
        height: 65,
        paddingBottom: 10,
        paddingTop: 6,
      },
      tabBarActiveTintColor: '#7c6fff',
      tabBarInactiveTintColor: '#44445a',
      tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
    }}>
      <Tabs.Screen name="search" options={{
        title: '검색',
        tabBarIcon: ({ focused }) => <TabIcon emoji="🔍" focused={focused} />,
      }} />
      <Tabs.Screen name="map" options={{
        title: '맛집',
        tabBarIcon: ({ focused }) => <TabIcon emoji="🗺️" focused={focused} />,
      }} />
      <Tabs.Screen name="index" options={{
        title: 'AI홈',
        tabBarIcon: ({ focused }) => <HomeTabIcon focused={focused} />,
        tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginTop: -4 },
      }} />
      <Tabs.Screen name="community" options={{
        title: '커뮤니티',
        tabBarIcon: ({ focused }) => <TabIcon emoji="💬" focused={focused} />,
      }} />
      <Tabs.Screen name="timetable" options={{
        title: '시간표',
        tabBarIcon: ({ focused }) => <TabIcon emoji="📅" focused={focused} />,
      }} />
    </Tabs>
  );
}