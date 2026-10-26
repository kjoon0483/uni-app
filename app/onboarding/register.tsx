import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import { router, useLocalSearchParams } from 'expo-router';
import { useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Button from '@/components/ui/Button';
import OnboardingNav from '@/components/ui/OnboardingNav';
import TextField from '@/components/ui/TextField';
import { type } from '@/constants/design';
import { supabase } from '@/lib/supabase';

export default function RegisterScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ mode?: string }>();
  const [mode, setMode] = useState<'select' | 'register' | 'login' | 'forgot' | 'otp'>(
    params.mode === 'login' || params.mode === 'forgot' || params.mode === 'register' ? params.mode : 'select',
  );
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');
  const emailRef = useRef<TextInput>(null);
  const passwordRef = useRef<TextInput>(null);
  const [otpCode, setOtpCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  const clearMessages = () => { setErrorMsg(''); setSuccessMsg(''); };

  const toEmail = (raw: string) => raw.includes('@') ? raw : `${raw}@uni.app`;

  const handleRegister = async () => {
    clearMessages();
    if (!email || !password || !nickname) {
      setErrorMsg('모든 항목을 입력해주세요');
      return;
    }
    setLoading(true);
    const resolvedEmail = toEmail(email.trim());
    try {
      const { data, error } = await supabase.auth.signUp({
        email: resolvedEmail, password,
        options: { data: { nickname } },
      });
      if (error) {
        setErrorMsg(
          error.message.includes('already registered') ? '이미 가입된 이메일이에요. 로그인해주세요'
          : error.message.includes('Password should be at least') ? '비밀번호는 6자 이상이어야 해요'
          : error.message.includes('Invalid email') ? '올바른 이메일 형식으로 입력해주세요'
          : error.message || '회원가입 중 오류가 발생했어요'
        );
      } else if (data?.user?.identities?.length === 0) {
        setErrorMsg('이미 가입된 이메일이에요. 로그인해주세요');
      } else {
        setSuccessMsg(`${nickname}님, 환영해요!`);
        setTimeout(() => router.replace('/onboarding/school'), 1500);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || '네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = async () => {
    Keyboard.dismiss();
    clearMessages();
    if (!email || !password) {
      setErrorMsg('이메일과 비밀번호를 입력해주세요');
      return;
    }
    setLoading(true);
    const resolvedEmail = toEmail(email.trim());
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email: resolvedEmail, password });
      if (error) {
        setErrorMsg(
          error.message.includes('Invalid login credentials') ? '이메일 또는 비밀번호가 틀렸어요'
          : error.message.includes('Email not confirmed') ? '이메일 인증이 필요해요. 메일함을 확인해주세요'
          : error.message || '로그인 중 오류가 발생했어요'
        );
      } else {
        const { data: profile } = await supabase
          .from('profiles').select('is_banned').eq('id', data.user!.id).single();
        if (profile?.is_banned) {
          await supabase.auth.signOut();
          setErrorMsg('이 계정은 관리자에 의해 정지되었습니다.');
          return;
        }
        const name = data.user?.user_metadata?.nickname ?? '';
        setSuccessMsg(name ? `${name}님, 돌아오셨군요!` : '환영해요!');
        setTimeout(() => router.replace('/(tabs)'), 800);
      }
    } catch (e: any) {
      setErrorMsg(e?.message || '네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    clearMessages();
    if (!email) { setErrorMsg('이메일을 입력해주세요'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email,
        options: { shouldCreateUser: false },
      });
      if (error) {
        setErrorMsg(error.message || '인증코드 발송에 실패했어요');
      } else {
        setOtpCode('');
        setMode('otp');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || '네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    clearMessages();
    if (otpCode.length !== 6) { setErrorMsg('6자리 코드를 입력해주세요'); return; }
    setLoading(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email, token: otpCode, type: 'email',
      });
      if (error) {
        setErrorMsg('코드가 틀렸거나 만료됐어요. 다시 시도해주세요');
      } else {
        router.replace('/reset-password');
      }
    } catch (e: any) {
      setErrorMsg(e?.message || '네트워크 오류가 발생했어요');
    } finally {
      setLoading(false);
    }
  };

  const back = () => {
    clearMessages();
    if (mode === 'otp') setMode('forgot');
    else if (mode === 'forgot') setMode('login');
    else if (mode === 'select' && router.canGoBack()) router.back();
    else setMode('select');
  };

  // 첫 화면
  if (mode === 'select') {
    return (
      <View style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}>
        <View style={styles.selectBody}>
          <Text style={[styles.logo, { color: colors.accentText }]}>Uni ✦</Text>
          <Text style={[styles.title, { color: colors.textPrimary }]}>시작해볼까요?</Text>
          <Text style={[type.bodyLarge, { color: colors.textSecondary }]}>신구대학교 학생 전용 AI 커뮤니티</Text>
        </View>
        <View style={styles.btnGroup}>
          <Button label="회원가입하기" fullWidth onPress={() => { setMode('register'); clearMessages(); }} />
          <Button label="로그인하기" variant="secondary" fullWidth onPress={() => { setMode('login'); clearMessages(); }} />
        </View>
      </View>
    );
  }

  const content = {
    register: { title: '계정을 만들어요', sub: '이메일로 1분이면 가입할 수 있어요', cta: '가입하기', onSubmit: handleRegister },
    login: { title: '다시 만나서 반가워요', sub: '이메일로 로그인해주세요', cta: '로그인', onSubmit: handleLogin },
    forgot: { title: '비밀번호 찾기', sub: '가입한 이메일로 6자리 인증코드를 보내드려요', cta: '인증코드 받기', onSubmit: handleForgotPassword },
    otp: { title: '인증코드 입력', sub: `${email}으로 보낸 6자리 코드를 입력해주세요`, cta: '확인', onSubmit: handleVerifyOtp },
  }[mode];

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.base, paddingTop: insets.top, paddingBottom: insets.bottom + 24 }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <OnboardingNav step={mode === 'register' ? 1 : undefined} onBack={back} />

      <ScrollView style={styles.flex} contentContainerStyle={styles.body} keyboardShouldPersistTaps="handled">
        <Text style={[styles.title, { color: colors.textPrimary }]}>{content.title}</Text>
        <Text style={[type.bodyLarge, styles.sub, { color: colors.textSecondary }]}>{content.sub}</Text>

        <View style={styles.form}>
          {mode === 'register' && (
            <TextField
              label="닉네임"
              placeholder="커뮤니티에서 쓸 이름"
              value={nickname}
              onChangeText={v => { setNickname(v); clearMessages(); }}
              returnKeyType="next"
              onSubmitEditing={() => emailRef.current?.focus()}
            />
          )}
          {mode !== 'otp' && (
            <TextField
              ref={emailRef}
              label={mode === 'forgot' ? '이메일' : '이메일 또는 아이디'}
              placeholder={mode === 'forgot' ? '가입한 이메일' : 'example@shingu.ac.kr'}
              value={email}
              onChangeText={v => { setEmail(v); clearMessages(); }}
              autoCapitalize="none"
              keyboardType="email-address"
              returnKeyType={mode === 'forgot' ? 'done' : 'next'}
              onSubmitEditing={mode === 'forgot' ? handleForgotPassword : () => passwordRef.current?.focus()}
            />
          )}
          {(mode === 'register' || mode === 'login') && (
            <TextField
              ref={passwordRef}
              label="비밀번호"
              placeholder="6자 이상"
              helper={mode === 'register' ? '6자 이상 입력해주세요' : undefined}
              value={password}
              onChangeText={v => { setPassword(v); clearMessages(); }}
              secureTextEntry
              returnKeyType="done"
              onSubmitEditing={content.onSubmit}
            />
          )}
          {mode === 'otp' && (
            <TextField
              label="인증코드"
              placeholder="000000"
              value={otpCode}
              onChangeText={v => { setOtpCode(v.replace(/\D/g, '').slice(0, 6)); clearMessages(); }}
              keyboardType="number-pad"
              maxLength={6}
              style={styles.otp}
            />
          )}
        </View>

        {errorMsg ? <Text style={[type.bodyMedium, { color: colors.danger }]}>{errorMsg}</Text> : null}
        {successMsg ? <Text style={[type.labelLarge, { color: colors.success }]}>{successMsg}</Text> : null}

        {mode === 'login' && (
          <View style={styles.linkRow}>
            <Button label="비밀번호를 잊으셨나요?" variant="ghost" size="M" onPress={() => { setMode('forgot'); clearMessages(); }} />
          </View>
        )}
        {mode === 'otp' && (
          <View style={styles.linkRow}>
            <Button label="코드 다시 보내기" variant="ghost" size="M" onPress={handleForgotPassword} />
          </View>
        )}
      </ScrollView>

      <View style={styles.bottom}>
        <Button label={content.cta} fullWidth loading={loading} onPress={content.onSubmit} />
      </View>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles(() => ({
  container: { flex: 1 },
  flex: { flex: 1 },
  selectBody: { flex: 1, justifyContent: 'center', paddingHorizontal: 20, gap: 8 },
  logo: { fontSize: 32, lineHeight: 40, fontWeight: '700', marginBottom: 8 },
  title: { fontSize: 28, lineHeight: 36, fontWeight: '700' },
  sub: { marginTop: 8, marginBottom: 32 },
  body: { paddingHorizontal: 20, paddingTop: 24, paddingBottom: 24, gap: 0 },
  form: { gap: 16, marginBottom: 12 },
  otp: { letterSpacing: 8, fontSize: 24, textAlign: 'center' },
  linkRow: { alignItems: 'flex-start', marginLeft: -16 },
  btnGroup: { paddingHorizontal: 20, gap: 12 },
  bottom: { paddingHorizontal: 20, paddingTop: 8 },
}));
