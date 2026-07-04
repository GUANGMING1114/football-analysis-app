import type { AnalysisResult, Match } from './football';

export type PredictionOutcome = 'hit' | 'miss' | 'pending';

export type SavedPrediction = {
  id: string;
  savedAt: string;
  match: Match;
  analysis: AnalysisResult;
  result?: {
    homeScore: number;
    awayScore: number;
    outcome: PredictionOutcome;
    settledAt: string;
  };
};

export type PredictionStats = {
  total: number;
  settled: number;
  hits: number;
  misses: number;
  hitRate: number;
  averageConfidence: number;
  profitUnits: number;
};
