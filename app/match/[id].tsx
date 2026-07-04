import { useLocalSearchParams } from 'expo-router';
import { useEffect, useMemo, useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { ProbabilityBar } from '@/components/ProbabilityBar';
import { ProbabilityDonut } from '@/components/ProbabilityDonut';
import { analyzeMatch } from '@/model/football-analysis';
import { apiFootballDataProvider } from '@/services/data-providers/api-provider';
import { mockFootballDataProvider } from '@/services/data-providers/mock-provider';
import { savePrediction } from '@/stores/prediction-store';
import type { AnalysisResult, Match, MatchContext, TeamForm } from '@/types/football';

const recommendationLabel: Record<AnalysisResult['recommendation'], string> = {
  home: '主胜方向',
  draw: '平局方向',
  away: '客胜方向',
  over25: '大 2.5 球方向',
  under25: '小 2.5 球方向',
  watch: '建议观望',
};

const riskLabel: Record<AnalysisResult['riskLevel'], string> = {
  low: '低风险',
  medium: '中风险',
  high: '高风险',
};

function renderForm(form: TeamForm, label: string) {
  return (
    <View style={styles.formCard}>
      <Text style={styles.formTitle}>{label}</Text>
      <Text style={styles.formBody}>
        近 {form.lastMatches} 场：{form.wins} 胜 {form.draws} 平 {form.losses} 负
      </Text>
      <Text style={styles.formBody}>
        进 {form.goalsFor} 球 / 失 {form.goalsAgainst} 球
      </Text>
      {form.xgFor !== undefined && form.xgAgainst !== undefined && (
        <Text style={styles.formBody}>
          xG：{form.xgFor.toFixed(2)} / xGA：{form.xgAgainst.toFixed(2)}
        </Text>
      )}
    </View>
  );
}

export default function MatchAnalysisScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const [match, setMatch] = useState<Match | null>(null);
  const [context, setContext] = useState<MatchContext | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      const provider = apiFootballDataProvider;
      const matches = await provider.getUpcomingMatches().catch(() => mockFootballDataProvider.getUpcomingMatches());
      setMatch(matches.find((item) => item.id === id) ?? null);
      if (id) {
        const contextResult = await provider.getMatchContext(id).catch(() => mockFootballDataProvider.getMatchContext(id));
        setContext(contextResult);
      }
    }
    load().catch(console.error);
  }, [id]);

  const analysis = useMemo(() => (context ? analyzeMatch(context) : null), [context]);

  async function handleSave() {
    if (!match || !analysis) return;
    setSaving(true);
    try {
      await savePrediction(match, analysis);
      setSaved(true);
    } catch (error) {
      console.error(error);
      Alert.alert('保存失败');
    } finally {
      setSaving(false);
    }
  }

  if (!match || !analysis || !context) {
    return (
      <View style={styles.center}>
        <Text style={styles.loading}>加载比赛数据...</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentInsetAdjustmentBehavior="automatic">
      <View style={styles.headerCard}>
        <Text style={styles.league}>{match.league}</Text>
        <Text style={styles.matchTitle}>{match.homeTeam.name} vs {match.awayTeam.name}</Text>
        <Text style={styles.time}>{new Date(match.kickoffAt).toLocaleString('zh-CN')}</Text>
      </View>

      <View style={styles.resultCard}>
        <Text style={styles.cardTitle}>模型结论</Text>
        <Text style={styles.recommendation}>{recommendationLabel[analysis.recommendation]}</Text>
        <Text style={styles.summary}>置信度 {Math.round(analysis.confidence * 100)}% · {riskLabel[analysis.riskLevel]} · 参考比分 {analysis.scorelineRange.join(' / ')}</Text>
      </View>

      <ProbabilityDonut homeWin={analysis.probabilities.homeWin} draw={analysis.probabilities.draw} awayWin={analysis.probabilities.awayWin} />

      <View style={styles.card}>
        <Text style={styles.cardTitle}>胜平负概率</Text>
        <ProbabilityBar label="主胜" value={analysis.probabilities.homeWin} color="#22c55e" />
        <ProbabilityBar label="平局" value={analysis.probabilities.draw} color="#f59e0b" />
        <ProbabilityBar label="客胜" value={analysis.probabilities.awayWin} color="#38bdf8" />
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>大小球与进球期望</Text>
        <ProbabilityBar label="大 2.5" value={analysis.probabilities.over25} color="#fb7185" />
        <ProbabilityBar label="小 2.5" value={analysis.probabilities.under25} color="#a78bfa" />
        <Text style={styles.body}>预期进球：主队 {analysis.expectedGoals.home} / 客队 {analysis.expectedGoals.away}</Text>
      </View>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>近期状态</Text>
        {renderForm(context.homeForm, `主队：${match.homeTeam.name}`)}
        {renderForm(context.awayForm, `客队：${match.awayTeam.name}`)}
      </View>

      {context.injuries && context.injuries.length > 0 && (
        <View style={styles.card}>
          <Text style={styles.cardTitle}>伤停与缺阵</Text>
          {context.injuries.map((injury, index) => (
            <Text key={index} style={styles.injuryItem}>• {injury}</Text>
          ))}
        </View>
      )}

      <Pressable style={[styles.saveButton, saved && styles.savedButton]} onPress={handleSave} disabled={saving || saved}>
        <Text style={styles.saveButtonText}>{saved ? '已保存' : saving ? '保存中...' : '保存预测'}</Text>
      </Pressable>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>关键影响因素</Text>
        {analysis.factors.map((factor) => (
          <View key={factor.label} style={styles.factor}>
            <Text style={styles.factorTitle}>{factor.label} · 权重 {Math.round(factor.weight * 100)}%</Text>
            <Text style={styles.factorBody}>{factor.description}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111f', padding: 18 },
  center: { flex: 1, backgroundColor: '#07111f', justifyContent: 'center', alignItems: 'center' },
  loading: { color: '#f8fafc' },
  headerCard: { backgroundColor: '#102033', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1e3654' },
  league: { color: '#7dd3fc', fontWeight: '800', marginBottom: 8 },
  matchTitle: { color: '#f8fafc', fontSize: 26, fontWeight: '900', marginBottom: 8 },
  time: { color: '#94a3b8' },
  resultCard: { backgroundColor: '#12351f', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#166534' },
  recommendation: { color: '#bbf7d0', fontSize: 28, fontWeight: '900', marginVertical: 8 },
  summary: { color: '#dcfce7', lineHeight: 22 },
  card: { backgroundColor: '#102033', borderRadius: 22, padding: 18, marginBottom: 14, borderWidth: 1, borderColor: '#1e3654' },
  cardTitle: { color: '#f8fafc', fontSize: 18, fontWeight: '900', marginBottom: 14 },
  body: { color: '#dbeafe', marginTop: 8 },
  formCard: { backgroundColor: '#1e293b', borderRadius: 14, padding: 12, marginBottom: 10 },
  formTitle: { color: '#7dd3fc', fontWeight: '800', marginBottom: 6 },
  formBody: { color: '#dbeafe', marginBottom: 4 },
  injuryItem: { color: '#f87171', marginBottom: 6 },
  factor: { paddingVertical: 10, borderTopWidth: 1, borderTopColor: '#1e3654' },
  factorTitle: { color: '#bfdbfe', fontWeight: '800', marginBottom: 4 },
  factorBody: { color: '#cbd5e1', lineHeight: 21 },
  saveButton: { backgroundColor: '#2563eb', borderRadius: 18, padding: 16, alignItems: 'center', marginBottom: 14 },
  savedButton: { backgroundColor: '#16a34a' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '800' },
});
