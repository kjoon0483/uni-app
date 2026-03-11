import { Text, View } from 'react-native';
export default function SearchScreen() {
  return (
    <View style={{ flex:1, backgroundColor:'#07070d', 
      alignItems:'center', justifyContent:'center' }}>
      <Text style={{ color:'#7c6fff', fontSize:24 }}>🔍 AI 검색</Text>
      <Text style={{ color:'#888', marginTop:8 }}>준비 중이에요!</Text>
    </View>
  );
}