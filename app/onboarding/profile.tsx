import { router } from 'expo-router';
import { useState } from 'react';
import {
    ScrollView,
    StyleSheet,
    Text,
    TextInput,
    TouchableOpacity,
    View
} from 'react-native';

const GRADES = ['1학년', '2학년', '3학년', '4학년'];

export default function ProfileScreen() {
  const [studentId, setStudentId] = useState('');
  const [department, setDepartment] = useState('');
  const [grade, setGrade] = useState('');

  const isReady = studentId && department && grade;

  return (
    <ScrollView style={styles.container}
      contentContainerStyle={{ paddingBottom: 40 }}>

      <Text style={styles.title}>기본 정보를 입력해요</Text>
      <Text style={styles.sub}>커뮤니티에서 학교 인증에 사용돼요</Text>

      {/* 학번 */}
      <View style={styles.section}>
        <Text style={styles.label}>학번</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 20240001"
          placeholderTextColor="#555"
          value={studentId}
          onChangeText={setStudentId}
          keyboardType="number-pad"
        />
      </View>

      {/* 학과 */}
      <View style={styles.section}>
        <Text style={styles.label}>학과</Text>
        <TextInput
          style={styles.input}
          placeholder="예: 컴퓨터공학과"
          placeholderTextColor="#555"
          value={department}
          onChangeText={setDepartment}
        />
      </View>

      {/* 학년 */}
      <View style={styles.section}>
        <Text style={styles.label}>학년</Text>
        <View style={styles.gradeRow}>
          {GRADES.map((g) => (
            <TouchableOpacity
              key={g}
              style={[styles.gradeBtn, grade === g && styles.gradeBtnActive]}
              onPress={() => setGrade(g)}>
              <Text style={[styles.gradeText, grade === g && styles.gradeTextActive]}>
                {g}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* 완료 버튼 */}
      <TouchableOpacity
        style={[styles.doneBtn, !isReady && styles.doneBtnDisabled]}
        onPress={() => isReady && router.replace('/(tabs)')}
        disabled={!isReady}>
        <Text style={styles.doneText}>
          {isReady ? 'Uni 시작하기 🚀' : '모두 입력해주세요'}
        </Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#07070d', paddingHorizontal: 24, paddingTop: 60 },
  title: { fontSize: 26, fontWeight: '900', color: '#fff', marginBottom: 8 },
  sub: { fontSize: 14, color: '#888', marginBottom: 36 },
  section: { marginBottom: 24 },
  label: { fontSize: 13, color: '#888', fontWeight: '600', marginBottom: 8 },
  input: {
    backgroundColor: '#13131a', borderRadius: 14,
    paddingHorizontal: 16, paddingVertical: 14,
    color: '#fff', fontSize: 15,
    borderWidth: 1, borderColor: '#2a2a40',
  },
  gradeRow: { flexDirection: 'row', gap: 10 },
  gradeBtn: {
    flex: 1, paddingVertical: 12, borderRadius: 12,
    backgroundColor: '#13131a', alignItems: 'center',
    borderWidth: 1, borderColor: '#2a2a40',
  },
  gradeBtnActive: { backgroundColor: 'rgba(124,111,255,0.15)', borderColor: '#7c6fff' },
  gradeText: { fontSize: 14, fontWeight: '700', color: '#555' },
  gradeTextActive: { color: '#7c6fff' },
  doneBtn: {
    backgroundColor: '#7c6fff', borderRadius: 28,
    height: 56, alignItems: 'center', justifyContent: 'center', marginTop: 16,
  },
  doneBtnDisabled: { backgroundColor: '#2a2a40' },
  doneText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
