import { useState } from 'react';
import {
  ScrollView,
  StyleSheet, Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';

export default function HomeScreen() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState([
    { role: 'ai', text: '안녕하세요! 저는 Uni예요 🎓 맛집, 교수님, 여행 뭐든 물어보세요!' }
  ]);

  return (
    <View style={styles.container}>
      {/* 상단 로고 */}
      <View style={styles.header}>
        <Text style={styles.logo}>Uni ✦</Text>
        <Text style={styles.status}>🟢 커뮤니티 분석 중</Text>
      </View>

      {/* 날씨 바 */}
      <View style={styles.weatherBar}>
        <Text style={styles.weatherIcon}>🌤️</Text>
        <View style={{flex:1}}>
          <Text style={styles.weatherTemp}>18°C  광주 · 맑음</Text>
          <Text style={styles.weatherSub}>미세먼지 좋음</Text>
        </View>
        <Text style={styles.commute}>🚌 버스 14분</Text>
      </View>

      {/* 채팅 */}
      <ScrollView style={styles.chat}>
        {messages.map((m, i) => (
          <View key={i} style={[styles.bubble, 
            m.role === 'user' ? styles.userBubble : styles.aiBubble]}>
            {m.role === 'ai' && <Text style={styles.aiLabel}>✦ UNI</Text>}
            <Text style={styles.bubbleText}>{m.text}</Text>
          </View>
        ))}
      </ScrollView>

      {/* 빠른 질문 */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} 
        style={styles.quickScroll}>
        {['👨‍🏫 교수님 평가','🍜 혼밥 추천','✈️ 여행 계획','💼 취업 정보'].map((q,i) => (
          <TouchableOpacity key={i} style={styles.quickPill}
            onPress={() => setMessage(q)}>
            <Text style={styles.quickText}>{q}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* 입력창 */}
      <View style={styles.inputRow}>
        <TextInput
          style={styles.input}
          value={message}
          onChangeText={setMessage}
          placeholder="AI에게 무엇이든..."
          placeholderTextColor="#555"
          multiline
        />
        <TouchableOpacity style={styles.sendBtn}
          onPress={() => {
            if (!message.trim()) return;
            setMessages(prev => [...prev,
              { role: 'user', text: message },
              { role: 'ai', text: '(Claude API 연동 후 답변이 여기 표시돼요!)' }
            ]);
            setMessage('');
          }}>
          <Text style={{color:'#fff', fontSize:18}}>↑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex:1, backgroundColor:'#07070d' },
  header: { flexDirection:'row', justifyContent:'space-between', 
    alignItems:'center', paddingHorizontal:20, paddingTop:55, paddingBottom:10 },
  logo: { fontSize:22, fontWeight:'900', color:'#a78bfa' },
  status: { fontSize:11, color:'#888' },
  weatherBar: { flexDirection:'row', alignItems:'center', 
    marginHorizontal:14, backgroundColor:'#13131a', 
    borderRadius:14, padding:12, marginBottom:8,
    borderWidth:1, borderColor:'#2a2a40' },
  weatherIcon: { fontSize:22, marginRight:10 },
  weatherTemp: { fontSize:13, fontWeight:'700', color:'#eee' },
  weatherSub: { fontSize:10, color:'#888' },
  commute: { fontSize:12, color:'#3eeea0', fontWeight:'700' },
  chat: { flex:1, paddingHorizontal:14 },
  bubble: { maxWidth:'85%', padding:10, borderRadius:14, marginBottom:8 },
  userBubble: { alignSelf:'flex-end', backgroundColor:'#7c6fff' },
  aiBubble: { alignSelf:'flex-start', backgroundColor:'#171724', 
    borderWidth:1, borderColor:'#2a2a40' },
  aiLabel: { fontSize:9, color:'#7c6fff', fontWeight:'700', marginBottom:4 },
  bubbleText: { fontSize:13, color:'#eee', lineHeight:20 },
  quickScroll: { paddingHorizontal:14, marginBottom:8, flexGrow:0 },
  quickPill: { backgroundColor:'#171724', borderRadius:20, 
    paddingHorizontal:14, paddingVertical:7, marginRight:8,
    borderWidth:1, borderColor:'#2a2a40' },
  quickText: { fontSize:11, color:'#aaa' },
  inputRow: { flexDirection:'row', alignItems:'center', 
    marginHorizontal:14, marginBottom:20, backgroundColor:'#171724',
    borderRadius:24, paddingHorizontal:16, paddingVertical:8,
    borderWidth:1, borderColor:'#2a2a40' },
  input: { flex:1, color:'#eee', fontSize:13, maxHeight:80 },
  sendBtn: { width:36, height:36, borderRadius:18, 
    backgroundColor:'#7c6fff', alignItems:'center', 
    justifyContent:'center', marginLeft:8 },
});