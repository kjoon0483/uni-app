import { router } from 'expo-router';
import { useState } from 'react';
import {
    KeyboardAvoidingView, Platform,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

export default function RegisterScreen() {
  const [tab, setTab] = useState<'login' | 'register'>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [nickname, setNickname] = useState('');

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

      {/* 탭 */}
      <View style={styles.tabs}>
        <TouchableOpacity
          style={[styles.tab, tab === 'register' && styles.tabActive]}
          onPress={() => setTab('register')}>
          <Text style={[styles.tabText, tab === 'register' && styles.tabTextActive]}>
            회원가입
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, tab === 'login' && styles.tabActive]}
          onPress={() => setTab('login')}>
          <Text style={[styles.tabText, tab === 'login' && styles.tabTextActive]}>
            로그인
          </Text>
        </TouchableOpacity>
      </View>

      <Text style={styles.title}>
        {tab === 'register' ? '계정을 만들어요' : '다시 만나서 반가워요'}
      </Text>
      <Text style={styles.sub}>학교 이메일로 가입하면 인증이 쉬워요</Text>

      {/* 입력 폼 */}
      <View style={styles.form}>
        {tab === 'register' && (
          <View style={styles.inputWrap}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="사용할 닉네임 입력"
              placeholderTextColor="#555"
              value={nickname}
              onChangeText={setNickname}
            />
          </View>
        )}

        <View style={styles.inputWrap}>
          <Text style={styles.label}>이메일</Text>
          <TextInput
            style={styles.input}
            placeholder="이메일 주소 입력"
            placeholderTextColor="#555"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>

        <View style={styles.inputWrap}>
          <Text style={styles.label}>비밀번호</Text>
          <TextInput
            style={styles.input}
            placeholder="비밀번호 입력 (6자 이상)"
            placeholderTextColor="#555"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />
        </View>
      </View>

      <TouchableOpacity
        style={styles.submitBtn}
        onPress={() => router.replace('/onboarding/profile')}>
        <Text style={styles.submitText}>
          {tab === 'register' ? '가입하기 →' : '로그인 →'}
        </Text>
      </TouchableOpacity>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1, backgroundColor: '#07070d',
    paddingHorizontal: 24, paddingTop: 60,
  },
  tabs: {
    flexDirection: 'row', backgroundColor: '#13131a',
    borderRadius: 14, padding: 4, marginBottom: 32,
  },
  tab: { flex: 1, paddingVertical: 10, alignItems: 'center', borderRadius: 11 },
  tabActive: { backgroundColor: '#7c6fff' },
  tabText: { fontSize: 14, fontWeight: '700', color: '#555' },
  tabTextActive: { color: '#fff' },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', marginBottom: 32 },
  form: { gap: 16, marginBottom: 32 },
  inputWrap: { gap: 8 },
  label: { fontSize: 13, color: '#888', fontWeight: '600' },
  input: {
    backgroundColor: '#13131a', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a40',
  },
  submitBtn: {
    backgroundColor: '#7c6fff', borderRadius: 28,
    height: 56, alignItems: 'center', justifyContent: 'center',
  },
  submitText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});