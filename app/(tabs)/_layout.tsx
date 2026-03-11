import { Tabs } from 'expo-router';
import { Text } from 'react-native';

function Icon({ label }: { label: string }) {
  return <Text style={{ fontSize: 20 }}>{label}</Text>;
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: '#0f0f18',
          borderTopColor: '#2a2a40',
          height: 60,
          paddingBottom: 8,
        },
        tabBarActiveTintColor: '#7c6fff',
        tabBarInactiveTintColor: '#555',
        tabBarLabelStyle: { fontSize: 10, fontWeight: '600' },
      }}>
      <Tabs.Screen name="search"
        options={{ title: '검색', tabBarIcon: () => <Icon label="🔍" /> }} />
      <Tabs.Screen name="map"
        options={{ title: '맛집', tabBarIcon: () => <Icon label="🗺️" /> }} />
      <Tabs.Screen name="index"
        options={{ title: 'AI홈', tabBarIcon: () => <Icon label="✦" /> }} />
      <Tabs.Screen name="community"
        options={{ title: '커뮤니티', tabBarIcon: () => <Icon label="💬" /> }} />
      <Tabs.Screen name="timetable"
        options={{ title: '시간표', tabBarIcon: () => <Icon label="📅" /> }} />
    </Tabs>
  );
}
