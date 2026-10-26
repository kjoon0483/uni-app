import type { TextStyle } from 'react-native';
import type { InfoColorKey, ThemeColors } from '@/lib/ThemeContext';

/** 간격 (Figma Dimension › space/*) */
export const space = { 4: 4, 8: 8, 12: 12, 16: 16, 20: 20, 24: 24, 32: 32 } as const;

/** 모서리 (Figma Dimension › radius/*) */
export const radius = { sm: 8, md: 12, lg: 16, xl: 24, full: 999 } as const;

/** 컨트롤 높이 */
export const size = { control: 52, controlSm: 40, touch: 40 } as const;

/** 텍스트 스타일 (Figma Text styles 와 1:1) */
export const type = {
  titleLarge: { fontSize: 24, lineHeight: 32, fontWeight: '700' },
  titleMedium: { fontSize: 20, lineHeight: 28, fontWeight: '700' },
  titleSmall: { fontSize: 17, lineHeight: 24, fontWeight: '700' },
  bodyLarge: { fontSize: 16, lineHeight: 24, fontWeight: '400' },
  bodyMedium: { fontSize: 14, lineHeight: 20, fontWeight: '400' },
  labelLarge: { fontSize: 16, lineHeight: 22, fontWeight: '700' },
  labelMedium: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  labelSmall: { fontSize: 12, lineHeight: 16, fontWeight: '500' },
  caption: { fontSize: 12, lineHeight: 16, fontWeight: '400' },
} satisfies Record<string, TextStyle>;

/** 시간표 수업 색 순서 (Figma class/1~8) */
export const CLASS_COLOR_KEYS: InfoColorKey[] = ['sky', 'indigo', 'teal', 'lime', 'sand', 'peach', 'rose', 'lavender'];

/** 예전 버전에서 저장된 수업 색(hex) → 새 분류색 */
const LEGACY_CLASS_COLOR: Record<string, InfoColorKey> = {
  '#7c6fff': 'sky', '#ff6b6b': 'rose', '#3eeea0': 'teal', '#f59e0b': 'sand',
  '#06b6d4': 'indigo', '#ff6b8a': 'peach', '#a78bfa': 'lavender', '#34d399': 'lime',
};

/** 저장된 수업 색 값(분류색 이름 또는 예전 hex)을 현재 테마의 실제 색으로 */
export function resolveClassColor(stored: string | undefined, colors: ThemeColors): string {
  if (!stored) return colors.info.sky;
  if (stored in colors.info) return colors.info[stored as InfoColorKey];
  const legacy = LEGACY_CLASS_COLOR[stored.toLowerCase()];
  return legacy ? colors.info[legacy] : stored;
}

/** 맛집 카테고리 → 분류색 (Figma category/*) */
export const CATEGORY_COLOR_KEY: Record<string, InfoColorKey> = {
  한식: 'peach', 중식: 'rose', 일식: 'sky', 양식: 'lime', 카페: 'sand', 술집: 'lavender', 분식: 'teal',
};

export function categoryColor(cat: string | undefined, colors: ThemeColors): string {
  const key = cat ? CATEGORY_COLOR_KEY[cat] : undefined;
  return key ? colors.info[key] : colors.textTertiary;
}

/** hex 색에 투명도(0~1)를 붙인 #RRGGBBAA */
export function withAlpha(hex: string, alpha: number): string {
  if (!/^#[0-9a-fA-F]{6}$/.test(hex)) return hex;
  return hex + Math.round(alpha * 255).toString(16).padStart(2, '0');
}
