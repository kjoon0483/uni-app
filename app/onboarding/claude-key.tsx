import { useTheme } from '@/lib/ThemeContext';
import { makeStyles } from '@/lib/makeStyles';
import { router } from 'expo-router';
import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';

export default function ClaudeKeyScreen() {
  const styles = useStyles();
  const { colors } = useTheme();
  const [apiKey, setApiKey] = useState('');
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState(false);

  const isValidKey = apiKey.startsWith('sk-ant-') && apiKey.length > 20;

  const handleSave = () => {
    if (!isValidKey) return;
    // TODO: AsyncStorage 또는 SecureStore에 저장
    setSaved(true);
  };

  const handleComplete = () => {
    router.replace('/(tabs)');
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* 뒤로가기 */}
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <Text style={styles.backText}>← 뒤로</Text>
        </TouchableOpacity>

        {/* 단계 표시 */}
        <View style={styles.stepRow}>
          {[1, 2, 3, 4].map((s) => (
            <View key={s} style={[styles.stepDot, styles.stepDotActive]} />
          ))}
        </View>

        {/* 아이콘 */}
        <View style={styles.iconWrap}>
          <View style={styles.iconOrb}>
            <Text style={styles.iconText}>✦</Text>
          </View>
        </View>

        <Text style={styles.title}>Claude AI 연결하기</Text>
        <Text style={styles.sub}>
          Anthropic의 Claude API를 연결하면{'\n'}
          AI 채팅, 시간표 분석, 맛집 추천 등 모든 AI 기능을 사용할 수 있어요
        </Text>

        {/* 안내 카드 */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>🔑 API Key 발급 방법</Text>
          <View style={styles.infoSteps}>
            {[
              'Anthropic Console 접속',
              '로그인 또는 회원가입',
              'API Keys 메뉴 → Create Key',
              '생성된 키를 아래에 붙여넣기',
            ].map((step, i) => (
              <View key={i} style={styles.infoStep}>
                <View style={styles.infoStepNum}>
                  <Text style={styles.infoStepNumText}>{i + 1}</Text>
                </View>
                <Text style={styles.infoStepText}>{step}</Text>
              </View>
            ))}
          </View>
          <TouchableOpacity
            style={styles.consoleBtn}
            onPress={() => Linking.openURL('https://console.anthropic.com')}
          >
            <Text style={styles.consoleBtnText}>🌐 Anthropic Console 열기</Text>
          </TouchableOpacity>
        </View>

        {/* API Key 입력 */}
        <View style={styles.inputSection}>
          <Text style={styles.label}>Claude API Key</Text>
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              placeholder="sk-ant-api03-..."
              placeholderTextColor={colors.textTertiary}
              value={apiKey}
              onChangeText={(v) => { setApiKey(v); setSaved(false); }}
              secureTextEntry={!showKey}
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity style={styles.eyeBtn} onPress={() => setShowKey(!showKey)}>
              <Text style={styles.eyeText}>{showKey ? '🙈' : '👁️'}</Text>
            </TouchableOpacity>
          </View>

          {apiKey.length > 0 && !isValidKey && (
            <Text style={styles.errorText}>
              올바른 API Key 형식이 아니에요 (sk-ant-로 시작해야 해요)
            </Text>
          )}
          {isValidKey && !saved && (
            <Text style={styles.validText}>✓ 올바른 형식이에요</Text>
          )}
        </View>

        {/* 보안 안내 */}
        <View style={styles.securityCard}>
          <Text style={styles.securityTitle}>🔒 보안 안내</Text>
          <Text style={styles.securityText}>
            API Key는 기기 내에만 안전하게 저장되며, 외부 서버로 전송되지 않아요.
            언제든지 설정에서 변경하거나 삭제할 수 있어요.
          </Text>
        </View>

        {/* 버튼 */}
        {!saved ? (
          <TouchableOpacity
            style={[styles.saveBtn, !isValidKey && styles.saveBtnDisabled]}
            onPress={handleSave}
            disabled={!isValidKey}
          >
            <Text style={styles.saveBtnText}>API Key 저장하기</Text>
          </TouchableOpacity>
        ) : (
          <View>
            <View style={styles.savedBadge}>
              <Text style={styles.savedText}>✦ Claude AI 연결 완료!</Text>
            </View>
            <TouchableOpacity style={styles.startBtn} onPress={handleComplete}>
              <Text style={styles.startBtnText}>Uni 시작하기 🚀</Text>
            </TouchableOpacity>
          </View>
        )}

        <TouchableOpacity
          style={styles.skipBtn}
          onPress={handleComplete}
        >
          <Text style={styles.skipBtnText}>
            {saved ? '' : '나중에 연결하기 (일부 기능 제한)'}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const useStyles = makeStyles((c) => ({
  container: { flex: 1, backgroundColor: c.base },
  content: { paddingHorizontal: 24, paddingTop: 55, paddingBottom: 40 },

  backBtn: { marginBottom: 20 },
  backText: { color: c.textTertiary, fontSize: 14 },

  stepRow: { flexDirection: 'row', gap: 8, marginBottom: 28 },
  stepDot: { flex: 1, height: 4, borderRadius: 2, backgroundColor: c.raised },
  stepDotActive: { backgroundColor: c.accentFill },

  iconWrap: { alignItems: 'center', marginBottom: 20 },
  iconOrb: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: c.accentFill,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.7, shadowRadius: 20, elevation: 15,
  },
  iconText: { fontSize: 30, color: c.textPrimary },

  title: { fontSize: 24, fontWeight: '700', color: c.textPrimary, marginBottom: 8, textAlign: 'center' },
  sub: { fontSize: 14, color: c.textSecondary, lineHeight: 22, marginBottom: 24, textAlign: 'center' },

  infoCard: {
    backgroundColor: c.surface, borderRadius: 16,
    borderWidth: 1, borderColor: c.borderDefault,
    padding: 18, marginBottom: 20,
  },
  infoTitle: { fontSize: 14, fontWeight: '700', color: c.textPrimary, marginBottom: 14 },
  infoSteps: { gap: 10, marginBottom: 14 },
  infoStep: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  infoStepNum: {
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: c.accentFill,
    alignItems: 'center', justifyContent: 'center',
  },
  infoStepNumText: { fontSize: 12, color: c.onAccent, fontWeight: '700' },
  infoStepText: { fontSize: 13, color: c.textSecondary },
  consoleBtn: {
    backgroundColor: c.surface, borderRadius: 10,
    borderWidth: 1, borderColor: c.borderDefault,
    paddingVertical: 10, alignItems: 'center',
  },
  consoleBtnText: { fontSize: 13, color: c.accentText, fontWeight: '500' },

  inputSection: { marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '700', color: c.textSecondary, marginBottom: 8 },
  inputRow: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: c.surface, borderRadius: 14,
    borderWidth: 1, borderColor: c.borderDefault,
    paddingHorizontal: 16,
  },
  input: { flex: 1, color: c.textPrimary, fontSize: 13, paddingVertical: 14 },
  eyeBtn: { padding: 4 },
  eyeText: { fontSize: 18 },
  errorText: { fontSize: 12, color: c.danger, marginTop: 6 },
  validText: { fontSize: 12, color: c.success, marginTop: 6 },

  securityCard: {
    backgroundColor: 'rgba(62,238,160,0.05)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(62,238,160,0.15)',
    padding: 14, marginBottom: 24,
  },
  securityTitle: { fontSize: 12, fontWeight: '700', color: c.success, marginBottom: 6 },
  securityText: { fontSize: 12, color: c.textTertiary, lineHeight: 18 },

  saveBtn: {
    backgroundColor: c.accentFill, borderRadius: 16,
    height: 54, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginBottom: 12,
  },
  saveBtnDisabled: { backgroundColor: c.raised, shadowOpacity: 0 },
  saveBtnText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },

  savedBadge: {
    backgroundColor: 'rgba(62,238,160,0.1)', borderRadius: 12,
    borderWidth: 1, borderColor: 'rgba(62,238,160,0.3)',
    paddingVertical: 12, alignItems: 'center', marginBottom: 12,
  },
  savedText: { fontSize: 15, fontWeight: '700', color: c.success },

  startBtn: {
    backgroundColor: c.accentFill, borderRadius: 16,
    height: 54, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4, shadowRadius: 12, elevation: 8,
    marginBottom: 12,
  },
  startBtnText: { color: c.onAccent, fontSize: 15, fontWeight: '700' },

  skipBtn: { alignItems: 'center', paddingVertical: 8 },
  skipBtnText: { color: c.textTertiary, fontSize: 13 },
}));
