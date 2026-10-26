import { createContext, useContext } from 'react';

/** 탭 화면 헤더의 ☰ 버튼이 사이드바를 열 수 있게 해 주는 컨텍스트 */
export const SidebarContext = createContext<{ open: () => void } | null>(null);
export const useSidebar = () => useContext(SidebarContext);
