export type Team = {
  id: string;
  name: string;
  shortName?: string;
  country?: string;
  logoUrl?: string;
};

export type Match = {
  id: string;
  league: string;
  season: string;
  kickoffAt: string;
  homeTeam: Team;
  awayTeam: Team;
  status: 'scheduled' | 'live' | 'finished';
  score?: {
    home: number;
    away: number;
  };
};

export type TeamForm = {
  teamId: string;
  lastMatches: number;
  wins: number;
  draws: number;
  losses: number;
  goalsFor: number;
  goalsAgainst: number;
  xgFor?: number;
  xgAgainst?: number;
  homeAwaySplit?: 'home' | 'away' | 'overall';
};

export type MatchContext = {
  matchId: string;
  homeForm: TeamForm;
  awayForm: TeamForm;
  injuries?: string[];
  suspensions?: string[];
  restDaysHome?: number;
  restDaysAway?: number;
  travelPressureAway?: number;
  odds?: {
    homeWin?: number;
    draw?: number;
    awayWin?: number;
    over25?: number;
    under25?: number;
  };
};

export type AnalysisFactor = {
  label: string;
  impact: 'positive' | 'negative' | 'neutral';
  weight: number;
  description: string;
};

export type AnalysisResult = {
  matchId: string;
  probabilities: {
    homeWin: number;
    draw: number;
    awayWin: number;
    over25: number;
    under25: number;
  };
  expectedGoals: {
    home: number;
    away: number;
  };
  scorelineRange: string[];
  recommendation: 'home' | 'draw' | 'away' | 'over25' | 'under25' | 'watch';
  confidence: number;
  riskLevel: 'low' | 'medium' | 'high';
  factors: AnalysisFactor[];
};
