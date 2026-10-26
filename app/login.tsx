import { router } from 'expo-router';
import { useRef, useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import TextField from '@/components/ui/TextField';
import { type } from '@/constants/design';
import { makeStyles } from '@/lib/makeStyles';
import { supabase } from '@/lib/supabase';
import { useTheme } from '@/lib/ThemeContext';

export default function LoginScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [loginError, setLoginError] = useState('');

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const passwordRef = useRef<TextInput>(null);

  const toEmail = (raw: string) => raw.includes('@') ? raw.trim() : `${raw.trim()}@uni.app`;

  const handleLogin = async () => {
    if (!loginEmail || !loginPassword) {
      setLoginError('이메일과 비밀번호를 입력해주세요.');
      return;
    }
    try {
      setLoading(true);
      setLoginError('');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: toEmail(loginEmail),
        password: loginPassword,
      });
      if (error) throw error;
      const { data: profile } = await supabase
        .from('profiles').select('is_banned').eq('id', data.user!.id).single();
      if (profile?.is_banned) {
        await supabase.auth.signOut();
        setLoginError('이 계정은 관리자에 의해 정지되었습니다.');
        return;
      }
      router.replace('/(tabs)');
    } catch {
      setLoginError('아이디 또는 비밀번호가 틀렸습니다.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.base }]}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingTop: insets.top + 56, paddingBottom: insets.bottom + 24 }]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <View style={styles.body}>
          <Text style={[styles.logo, { color: colors.accentText }]}>Uni ✦</Text>
          <Text style={[type.titleMedium, styles.headline, { color: colors.textPrimary }]}>
            우리 학교 AI 커뮤니티에{'\n'}로그인하세요
          </Text>

          <View style={styles.form}>
            <TextField
              label="이메일 또는 아이디"
              value={loginEmail}
              onChangeText={v => { setLoginEmail(v); setLoginError(''); }}
              placeholder="example@shingu.ac.kr"
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType="next"
              onSubmitEditing={() => passwordRef.current?.focus()}
            />
            <TextField
              ref={passwordRef}
              label="비밀번호"
              value={loginPassword}
              onChangeText={v => { setLoginPassword(v); setLoginError(''); }}
              placeholder="비밀번호를 입력하세요"
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={handleLogin}
              error={loginError || undefined}
            />
          </View>

          <View style={styles.forgotRow}>
            <Button label="비밀번호를 잊으셨나요?" variant="ghost" size="M"
              onPress={() => router.push({ pathname: '/onboarding/register', params: { mode: 'forgot' } })} />
          </View>

          <Button label="로그인" fullWidth loading={loading} onPress={handleLogin} />

          <View style={styles.dividerRow}>
            <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
            <Text style={[type.caption, { color: colors.textTertiary }]}>또는</Text>
            <View style={[styles.divider, { backgroundColor: colors.borderDefault }]} />
          </View>

          <Button label="학교 계정으로 로그인" variant="secondary" fullWidth disabled />
        </View>

        <View style={styles.footer}>
          <Text style={[type.bodyMedium, { color: colors.textSecondary }]}>아직 계정이 없나요?</Text>
          <Pressable onPress={() => router.push({ pathname: '/onboarding/register', params: { mode: 'register' } })} hitSlop={8} accessibilityRole="link">
            <Text style={[type.labelMedium, styles.link, { color: colors.accentText }]}>회원가입</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  scrollContent: { flexGrow: 1, paddingHorizontal: 20 },
  body: { flex: 1 },
  logo: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
  headline: { marginTop: 8, marginBottom: 32 },
  form: { gap: 16 },
  forgotRow: { alignItems: 'flex-end', marginVertical: 4 },
  dividerRow: { flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 20 },
  divider: { flex: 1, height: 1 },
  footer: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4, paddingTop: 24 },
  link: { fontWeight: '700' },
}));
