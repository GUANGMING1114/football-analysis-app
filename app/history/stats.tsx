import { useCallback, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useFocusEffect } from 'expo-router';
import { computeStats } from '@/stores/prediction-store';
import type { PredictionStats } from '@/types/history';

function StatCard({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <View style={styles.card}>
      <Text style={styles.cardLabel}>{label}</Text>
      <Text style={styles.cardValue}>{value}</Text>
      {sub ? <Text style={styles.cardSub}>{sub}</Text> : null}
    </View>
  );
}

export default function StatsScreen() {
  const [stats, setStats] = useState<PredictionStats>({ total: 0, settled: 0, hits: 0, misses: 0, hitRate: 0, averageConfidence: 0, profitUnits: 0 });

  useFocusEffect(
    useCallback(() => {
      computeStats().then(setStats).catch(console.error);
    }, [])
  );

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <Text style={styles.title}>复盘统计</Text>
      <View style={styles.grid}>
        <StatCard label="总预测数" value={String(stats.total)} />
        <StatCard label="已结算" value={String(stats.settled)} />
        <StatCard label="命中" value={String(stats.hits)} />
        <StatCard label="未命中" value={String(stats.misses)} />
        <StatCard label="命中率" value={`${Math.round(stats.hitRate * 100)}%`} sub={`${stats.hits}/${stats.settled}`} />
        <StatCard label="平均置信度" value={`${Math.round(stats.averageConfidence * 100)}%`} />
        <StatCard label="盈亏（均注 1U）" value={`${stats.profitUnits >= 0 ? '+' : ''}${stats.profitUnits.toFixed(2)}U`} sub="按平均水 0.9 模拟" />
      </View>
      <Text style={styles.hint}>提示：盈亏模拟仅供参考，不构成投注建议。</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111f', padding: 18 },
  title: { color: '#f8fafc', fontSize: 28, fontWeight: '900', marginBottom: 18 },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  card: { width: '47%', backgroundColor: '#102033', borderRadius: 18, padding: 16, borderWidth: 1, borderColor: '#1e3654', marginBottom: 12 },
  cardLabel: { color: '#94a3b8', marginBottom: 8 },
  cardValue: { color: '#f8fafc', fontSize: 26, fontWeight: '900' },
  cardSub: { color: '#7dd3fc', marginTop: 6 },
  hint: { color: '#64748b', textAlign: 'center', marginTop: 20 },
});
