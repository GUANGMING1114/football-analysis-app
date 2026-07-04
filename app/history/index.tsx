import { useRouter } from 'expo-router';
import { useCallback, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { deletePrediction, getPredictions, updateResult } from '@/stores/prediction-store';
import type { SavedPrediction } from '@/types/history';

const recommendationMap: Record<string, string> = {
  home: '主胜方向',
  draw: '平局方向',
  away: '客胜方向',
  over25: '大 2.5 球',
  under25: '小 2.5 球',
  watch: '观望',
};

const riskMap: Record<string, string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

function PredictionCard({ item, onUpdate }: { item: SavedPrediction; onUpdate: () => void }) {
  const [homeScore, setHomeScore] = useState('');
  const [awayScore, setAwayScore] = useState('');

  async function handleSettle() {
    const h = parseInt(homeScore, 10);
    const a = parseInt(awayScore, 10);
    if (Number.isNaN(h) || Number.isNaN(a)) {
      Alert.alert('请输入完整比分');
      return;
    }
    await updateResult(item.id, h, a);
    onUpdate();
  }

  return (
    <View style={styles.card}>
      <Text style={styles.league}>{item.match.league}</Text>
      <Text style={styles.matchTitle}>{item.match.homeTeam.name} vs {item.match.awayTeam.name}</Text>
      <Text style={styles.meta}>预测时间：{new Date(item.savedAt).toLocaleString('zh-CN')}</Text>
      <Text style={styles.meta}>推荐：{recommendationMap[item.analysis.recommendation]}</Text>
      <Text style={styles.meta}>置信度：{Math.round(item.analysis.confidence * 100)}% · {riskMap[item.analysis.riskLevel]}</Text>
      {item.result ? (
        <Text style={item.result.outcome === 'hit' ? styles.hit : styles.miss}>
          赛果 {item.result.homeScore}-{item.result.awayScore} · {item.result.outcome === 'hit' ? '命中' : '未命中'}
        </Text>
      ) : (
        <View>
          <View style={styles.inputRow}>
            <TextInput style={styles.input} keyboardType="number-pad" placeholder="主" placeholderTextColor="#64748b" value={homeScore} onChangeText={setHomeScore} />
            <TextInput style={styles.input} keyboardType="number-pad" placeholder="客" placeholderTextColor="#64748b" value={awayScore} onChangeText={setAwayScore} />
            <Pressable style={styles.button} onPress={handleSettle}>
              <Text style={styles.buttonText}>录入赛果</Text>
            </Pressable>
          </View>
        </View>
      )}
      <Pressable onPress={async () => { await deletePrediction(item.id); onUpdate(); }} style={styles.delete}>
        <Text style={styles.deleteText}>删除记录</Text>
      </Pressable>
    </View>
  );
}

export default function HistoryScreen() {
  const [predictions, setPredictions] = useState<SavedPrediction[]>([]);
  const [refresh, setRefresh] = useState(0);
  const router = useRouter();

  useFocusEffect(
    useCallback(() => {
      getPredictions().then(setPredictions).catch(console.error);
    }, [refresh])
  );

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.hero}>
        <Text style={styles.heroTitle}>历史预测</Text>
        <Text style={styles.heroSubtitle}>保存的预测会在这里列出，赛后录入比分即可自动统计命中和盈亏。</Text>
        <Pressable style={styles.linkButton} onPress={() => router.push('/history/stats')}>
          <Text style={styles.linkButtonText}>查看统计</Text>
        </Pressable>
      </View>

      {predictions.length === 0 ? (
        <Text style={styles.empty}>暂无历史预测。去分析一场比赛并保存吧。</Text>
      ) : (
        predictions.map((item) => <PredictionCard key={item.id} item={item} onUpdate={() => setRefresh((r) => r + 1)} />)
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111f', padding: 18 },
  hero: { padding: 20, backgroundColor: '#0f2742', borderRadius: 24, marginBottom: 22, borderWidth: 1, borderColor: '#1d4ed8' },
  heroTitle: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginBottom: 10 },
  heroSubtitle: { color: '#bfdbfe', lineHeight: 22, marginBottom: 14 },
  linkButton: { backgroundColor: '#2563eb', alignSelf: 'flex-start', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 12 },
  linkButtonText: { color: '#fff', fontWeight: '800' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 30 },
  card: { backgroundColor: '#102033', borderRadius: 18, padding: 16, marginBottom: 14, borderWidth: 1, borderColor: '#1e3654' },
  league: { color: '#7dd3fc', fontWeight: '800', marginBottom: 6 },
  matchTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '800', marginBottom: 10 },
  meta: { color: '#cbd5e1', marginBottom: 4 },
  hit: { color: '#4ade80', fontWeight: '800', marginTop: 10 },
  miss: { color: '#f87171', fontWeight: '800', marginTop: 10 },
  inputRow: { flexDirection: 'row', alignItems: 'center', marginTop: 12, gap: 10 },
  input: { backgroundColor: '#1e293b', color: '#f8fafc', borderRadius: 10, padding: 10, width: 60, textAlign: 'center' },
  button: { backgroundColor: '#16a34a', paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  buttonText: { color: '#fff', fontWeight: '800' },
  delete: { marginTop: 12, alignSelf: 'flex-start' },
  deleteText: { color: '#f87171' },
});
