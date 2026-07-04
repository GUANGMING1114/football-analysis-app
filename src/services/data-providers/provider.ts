import type { Match, MatchContext } from '@/types/football';

export interface FootballDataProvider {
  getUpcomingMatches(): Promise<Match[]>;
  getMatchContext(matchId: string): Promise<MatchContext>;
}
