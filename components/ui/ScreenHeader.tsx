import { Feather } from '@expo/vector-icons';
import { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { type } from '@/constants/design';
import { useSidebar } from '@/lib/SidebarContext';
import { useTheme } from '@/lib/ThemeContext';
import IconButton from './IconButton';

interface ScreenHeaderProps {
  title: string;
  subtitle?: string;
  /** 제목 위 작은 위치 표시 (예: 학교 이름) */
  eyebrow?: string;
  onEyebrowPress?: () => void;
  actions?: ReactNode;
  showMenu?: boolean;
}

/** 탭 화면 공통 헤더: 제목(왼쪽) + 아이콘 버튼(오른쪽) */
export default function ScreenHeader({ title, subtitle, eyebrow, onEyebrowPress, actions, showMenu = true }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const sidebar = useSidebar();

  return (
    <View style={[styles.wrap, { paddingTop: Math.max(insets.top, 12) + 4 }]}>
      <View style={styles.left}>
        {eyebrow ? (
          <Pressable onPress={onEyebrowPress} disabled={!onEyebrowPress} hitSlop={6} style={styles.eyebrow}>
            <Feather name="map-pin" size={14} color={colors.accentText} />
            <Text style={[type.labelSmall, { color: colors.accentText }]} numberOfLines={1}>{eyebrow}</Text>
            {onEyebrowPress && <Feather name="chevron-right" size={14} color={colors.accentText} />}
          </Pressable>
        ) : null}
        <Text style={[type.titleLarge, { color: colors.textPrimary }]} numberOfLines={1}>{title}</Text>
        {subtitle ? <Text style={[type.caption, { color: colors.textTertiary }]}>{subtitle}</Text> : null}
      </View>
      <View style={styles.actions}>
        {actions}
        {showMenu && sidebar && (
          <IconButton icon="menu" accessibilityLabel="메뉴 열기" onPress={sidebar.open} />
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingLeft: 20, paddingRight: 12, paddingBottom: 12,
  },
  left: { flex: 1, gap: 2 },
  eyebrow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  actions: { flexDirection: 'row', alignItems: 'center', gap: 4 },
});
