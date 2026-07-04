import type { Match, MatchContext } from '@/types/football';
import type { FootballDataProvider } from './provider';

import { API_URL } from '@/constants/env';

type ApiMatch = Match & {
  venue?: unknown;
  odds?: MatchContext['odds'];
};

async function request<T>(path: string): Promise<T> {
  const response = await fetch(`${API_URL}${path}`);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`API ${response.status}: ${body}`);
  }
  return response.json() as Promise<T>;
}

export class ApiFootballDataProvider implements FootballDataProvider {
  async getUpcomingMatches(): Promise<Match[]> {
    const payload = await request<{ matches: ApiMatch[] }>('/api/matches');
    return payload.matches.map((match) => ({
      id: match.id,
      league: match.league,
      season: match.season,
      kickoffAt: match.kickoffAt,
      homeTeam: match.homeTeam,
      awayTeam: match.awayTeam,
      status: match.status,
      score: match.score,
    }));
  }

  async getMatchContext(matchId: string): Promise<MatchContext> {
    const payload = await request<{ context: MatchContext }>(`/api/matches/${matchId}/context`);
    return payload.context;
  }
}

export const apiFootballDataProvider = new ApiFootballDataProvider();
