import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { createContext, useContext, useEffect, useState } from 'react';

export type ThemeMode = 'dark' | 'light';

/**
 * Uni 색상 토큰 (Figma "Uni ✦ UI 개선" › 02 디자인 시스템 › Color 변수와 1:1 대응)
 * - 보라(accent)는 주요 행동과 선택 상태에만 사용
 * - AI 관련 요소(✦, Uni 라벨, AI 배지)는 ai* 색만 사용
 * - info.* 는 수업·카테고리 등 "분류" 전용. 성공/경고/위험 의미로 쓰지 않음
 * - 모든 글자 조합은 배경 대비 4.5:1 이상으로 검증됨
 */
const info = {
  light: {
    sky: '#1F7FC2', indigo: '#4A5BD8', teal: '#0F8C80', lime: '#5F8A10',
    sand: '#9A7A1A', peach: '#C25E28', rose: '#C23E7C', lavender: '#7A55D6',
  },
  dark: {
    sky: '#4FB0F2', indigo: '#7C8CFF', teal: '#2EC4B4', lime: '#A6CC45',
    sand: '#D9B860', peach: '#F39A68', rose: '#EE78AE', lavender: '#B08CF7',
  },
};

export type InfoColorKey = keyof typeof info.light;

function build(mode: ThemeMode) {
  const light = mode === 'light';
  const t = {
    // ── 면
    base: light ? '#F4F4F6' : '#1C1C1F',
    surface: light ? '#FFFFFF' : '#29292D',
    raised: light ? '#EAEAEE' : '#36363B',
    overlay: light ? 'rgba(20,20,28,0.45)' : 'rgba(0,0,0,0.6)',
    // ── 선
    borderDefault: light ? '#E0E0E6' : '#424248',
    borderStrong: light ? '#CFCFD7' : '#55555D',
    borderInput: light ? '#868691' : '#7C7C86',
    // ── 글자
    textPrimary: light ? '#17171C' : '#F5F5F7',
    textSecondary: light ? '#52525C' : '#C4C4CC',
    textTertiary: light ? '#65656F' : '#A6A6B0',
    onAccent: '#FFFFFF',
    // ── 주요 행동
    accentFill: light ? '#5A49E0' : '#6857EE',
    accentText: light ? '#5142D4' : '#AFA5FF',
    accentSubtle: light ? '#EEEBFF' : '#35305C',
    // ── AI 전용
    aiStart: light ? '#6C5CF5' : '#8C7DFF',
    aiEnd: light ? '#E5508F' : '#FF8DB8',
    aiText: light ? '#7A3FC4' : '#D4B3FF',
    aiSubtle: light ? '#F6EEFF' : '#3A2D52',
    // ── 상태
    danger: light ? '#C92A3B' : '#FF6B78',
    dangerSubtle: light ? '#FDECEE' : '#3D2226',
    success: light ? '#0E8350' : '#3DD68C',
    warning: light ? '#A86400' : '#F5B03D',
    // ── 정보 분류
    info: info[mode],
  };
  return {
    ...t,
    // ── 이전 이름 (기존 화면 호환용). 새 코드에서는 위 이름을 쓰세요.
    bg: t.base,
    card: t.surface,
    sidebarBg: t.surface,
    border: t.borderDefault,
    text: t.textPrimary,
    subText: t.textSecondary,
    accent: t.accentText,
    tabBar: t.surface,
    tabBorder: t.borderDefault,
    tabInactive: t.textTertiary,
    inputBg: t.surface,
    cardTitle: t.textTertiary,
    rowLabel: t.textSecondary,
    rowValue: t.textPrimary,
  };
}

export const themes = { light: build('light'), dark: build('dark') };
export type ThemeColors = typeof themes.light;

interface ThemeContextType {
  mode: ThemeMode;
  colors: ThemeColors;
  setMode: (mode: ThemeMode) => void;
}

const DEFAULT_MODE: ThemeMode = 'light';

const ThemeContext = createContext<ThemeContextType>({
  mode: DEFAULT_MODE,
  colors: themes[DEFAULT_MODE],
  setMode: () => {},
});

export function AppThemeProvider({ children }: { children: React.ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(DEFAULT_MODE);

  useEffect(() => {
    AsyncStorage.getItem('app_theme').then(v => {
      if (v === 'light' || v === 'dark') setModeState(v);
    });
  }, []);

  const setMode = (m: ThemeMode) => {
    setModeState(m);
    AsyncStorage.setItem('app_theme', m);
  };

  return (
    <ThemeContext.Provider value={{ mode, colors: themes[mode], setMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
