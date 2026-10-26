import { ImageStyle, StyleSheet, TextStyle, ViewStyle } from 'react-native';
import { ThemeColors, useTheme } from './ThemeContext';

type NamedStyles<T> = { [P in keyof T]: ViewStyle | TextStyle | ImageStyle };

/**
 * 테마 색을 쓰는 StyleSheet 를 만든다.
 *   const useStyles = makeStyles(c => ({ box: { backgroundColor: c.surface } }));
 *   function Screen() { const styles = useStyles(); ... }
 * 테마(라이트/다크)마다 한 번만 생성해서 캐시한다.
 */
export function makeStyles<T extends NamedStyles<T>>(factory: (c: ThemeColors) => T & NamedStyles<any>) {
  const cache = new WeakMap<ThemeColors, T>();
  return function useStyles(): T {
    const { colors } = useTheme();
    let s = cache.get(colors);
    if (!s) {
      s = StyleSheet.create(factory(colors)) as T;
      cache.set(colors, s);
    }
    return s;
  };
}
