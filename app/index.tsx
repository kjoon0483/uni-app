import { makeStyles } from '@/lib/makeStyles';
import { router } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Animated, StyleSheet, Text, View } from 'react-native';

export default function SplashScreen() {
  const styles = useStyles();
  const opacity = useRef(new Animated.Value(0)).current;
  const scale = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1, duration: 1000, useNativeDriver: true,
      }),
      Animated.spring(scale, {
        toValue: 1, tension: 50, friction: 7, useNativeDriver: true,
      }),
    ]).start();

    const timer = setTimeout(() => {
      router.replace('/onboarding/register');
    }, 2500);

    return () => clearTimeout(timer);
  }, []);

  return (
    <View style={styles.container}>
      <View style={styles.glow} />
      <Animated.View style={[styles.center, { opacity, transform: [{ scale }] }]}>
        <View style={styles.orb}>
          <Text style={styles.orbSymbol}>✦</Text>
        </View>
        <Text style={styles.logo}>Uni</Text>
        <Text style={styles.logoStar}>✦</Text>
        <Text style={styles.tagline}>대학교 AI 커뮤니티</Text>
      </Animated.View>
      <Text style={styles.bottom}>powered by Claude AI</Text>
    </View>
  );
}

const useStyles = makeStyles((c) => ({
  container: {
    flex: 1, backgroundColor: c.base,
    alignItems: 'center', justifyContent: 'center',
  },
  glow: {
    position: 'absolute',
    width: 300, height: 300, borderRadius: 150,
    backgroundColor: c.accentSubtle,
    top: '30%',
  },
  center: { alignItems: 'center' },
  orb: {
    width: 100, height: 100, borderRadius: 50,
    backgroundColor: c.accentFill,
    alignItems: 'center', justifyContent: 'center',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.12, shadowRadius: 24, elevation: 8,
  },
  orbSymbol: { fontSize: 36, color: c.onAccent },
  logo: { fontSize: 52, fontWeight: '700', color: c.textPrimary, letterSpacing: 2 },
  logoStar: { fontSize: 20, color: c.accentText, marginTop: -8, marginBottom: 12 },
  tagline: { fontSize: 16, color: c.textSecondary, letterSpacing: 1 },
  bottom: { position: 'absolute', bottom: 40, fontSize: 12, color: c.textTertiary },
}));