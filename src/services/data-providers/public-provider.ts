import type { Match, MatchContext } from '@/types/football';
import type { FootballDataProvider } from './provider';

/**
 * 公开数据源适配器占位。
 *
 * 后续建议：
 * 1. 若公开 API 支持移动端直连，可在这里 fetch。
 * 2. 若遇到 CORS、限流、反爬或密钥限制，改为后端缓存 API。
 * 3. 所有外部数据必须转换成 src/types/football.ts 的统一结构。
 */
export class PublicFootballDataProvider implements FootballDataProvider {
  async getUpcomingMatches(): Promise<Match[]> {
    throw new Error('PublicFootballDataProvider 尚未配置公开数据源');
  }

  async getMatchContext(_matchId: string): Promise<MatchContext> {
    throw new Error('PublicFootballDataProvider 尚未配置公开数据源');
  }
}
