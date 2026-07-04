import AsyncStorage from '@react-native-async-storage/async-storage';
import type { AnalysisResult, Match } from '@/types/football';
import type { PredictionStats, SavedPrediction } from '@/types/history';

const STORAGE_KEY = 'football_predictions_v1';

function createId(matchId: string, savedAt: string): string {
  return `${matchId}__${savedAt}`;
}

export async function savePrediction(match: Match, analysis: AnalysisResult): Promise<SavedPrediction> {
  const savedAt = new Date().toISOString();
  const prediction: SavedPrediction = {
    id: createId(match.id, savedAt),
    savedAt,
    match,
    analysis,
  };

  const existing = await AsyncStorage.getItem(STORAGE_KEY);
  const list: SavedPrediction[] = existing ? JSON.parse(existing) : [];
  list.unshift(prediction);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return prediction;
}

export async function getPredictions(): Promise<SavedPrediction[]> {
  const raw = await AsyncStorage.getItem(STORAGE_KEY);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as SavedPrediction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export async function updateResult(
  id: string,
  homeScore: number,
  awayScore: number
): Promise<SavedPrediction | null> {
  const list = await getPredictions();
  const index = list.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const item = list[index];
  let outcome: 'hit' | 'miss' = 'miss';
  const pick = item.analysis.recommendation;
  if (pick === 'home' && homeScore > awayScore) outcome = 'hit';
  if (pick === 'draw' && homeScore === awayScore) outcome = 'hit';
  if (pick === 'away' && homeScore < awayScore) outcome = 'hit';
  if (pick === 'over25' && homeScore + awayScore > 2) outcome = 'hit';
  if (pick === 'under25' && homeScore + awayScore < 3) outcome = 'hit';

  item.result = {
    homeScore,
    awayScore,
    outcome,
    settledAt: new Date().toISOString(),
  };

  list[index] = item;
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  return item;
}

export async function deletePrediction(id: string): Promise<void> {
  const list = await getPredictions();
  const filtered = list.filter((item) => item.id !== id);
  await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(filtered));
}

export async function clearPredictions(): Promise<void> {
  await AsyncStorage.removeItem(STORAGE_KEY);
}

export async function computeStats(): Promise<PredictionStats> {
  const list = await getPredictions();
  const settled = list.filter((item) => item.result);
  const hits = settled.filter((item) => item.result?.outcome === 'hit');
  const misses = settled.filter((item) => item.result?.outcome === 'miss');
  const totalConfidence = list.reduce((sum, item) => sum + item.analysis.confidence, 0);

  // 均注 1 单位盈亏模拟
  const profitUnits = hits.length * 0.9 - misses.length * 1;

  return {
    total: list.length,
    settled: settled.length,
    hits: hits.length,
    misses: misses.length,
    hitRate: settled.length ? hits.length / settled.length : 0,
    averageConfidence: list.length ? totalConfidence / list.length : 0,
    profitUnits,
  };
}
