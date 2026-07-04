import type { Match, MatchContext } from '@/types/football';
import type { FootballDataProvider } from './provider';

const now = Date.now();
const oneHour = 60 * 60 * 1000;
const oneDay = 24 * oneHour;

const matches: Match[] = [
  { id: 'epl-001', league: '英超', season: '2026/27', kickoffAt: new Date(now + 2 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'ars', name: '阿森纳', shortName: 'ARS', country: 'England' }, awayTeam: { id: 'che', name: '切尔西', shortName: 'CHE', country: 'England' } },
  { id: 'laliga-001', league: '西甲', season: '2026/27', kickoffAt: new Date(now + 5 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'rma', name: '皇家马德里', shortName: 'RMA', country: 'Spain' }, awayTeam: { id: 'sev', name: '塞维利亚', shortName: 'SEV', country: 'Spain' } },
  { id: 'seriea-001', league: '意甲', season: '2026/27', kickoffAt: new Date(now + oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'int', name: '国际米兰', shortName: 'INT', country: 'Italy' }, awayTeam: { id: 'mil', name: 'AC 米兰', shortName: 'MIL', country: 'Italy' } },
  { id: 'epl-002', league: '英超', season: '2026/27', kickoffAt: new Date(now + oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'mci', name: '曼城', shortName: 'MCI', country: 'England' }, awayTeam: { id: 'liv', name: '利物浦', shortName: 'LIV', country: 'England' } },
  { id: 'epl-003', league: '英超', season: '2026/27', kickoffAt: new Date(now + oneDay + 6 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'mun', name: '曼联', shortName: 'MUN', country: 'England' }, awayTeam: { id: 'tot', name: '热刺', shortName: 'TOT', country: 'England' } },
  { id: 'epl-004', league: '英超', season: '2026/27', kickoffAt: new Date(now + 2 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'new', name: '纽卡斯尔', shortName: 'NEW', country: 'England' }, awayTeam: { id: 'whu', name: '西汉姆联', shortName: 'WHU', country: 'England' } },
  { id: 'laliga-002', league: '西甲', season: '2026/27', kickoffAt: new Date(now + 2 * oneDay + 2 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'bar', name: '巴塞罗那', shortName: 'BAR', country: 'Spain' }, awayTeam: { id: 'atm', name: '马德里竞技', shortName: 'ATM', country: 'Spain' } },
  { id: 'laliga-003', league: '西甲', season: '2026/27', kickoffAt: new Date(now + 2 * oneDay + 5 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'val', name: '瓦伦西亚', shortName: 'VAL', country: 'Spain' }, awayTeam: { id: 'bil', name: '毕尔巴鄂竞技', shortName: 'BIL', country: 'Spain' } },
  { id: 'seriea-002', league: '意甲', season: '2026/27', kickoffAt: new Date(now + 3 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'juv', name: '尤文图斯', shortName: 'JUV', country: 'Italy' }, awayTeam: { id: 'rom', name: '罗马', shortName: 'ROM', country: 'Italy' } },
  { id: 'seriea-003', league: '意甲', season: '2026/27', kickoffAt: new Date(now + 3 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'nap', name: '那不勒斯', shortName: 'NAP', country: 'Italy' }, awayTeam: { id: 'laz', name: '拉齐奥', shortName: 'LAZ', country: 'Italy' } },
  { id: 'bundesliga-001', league: '德甲', season: '2026/27', kickoffAt: new Date(now + 4 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'bay', name: '拜仁慕尼黑', shortName: 'BAY', country: 'Germany' }, awayTeam: { id: 'bvb', name: '多特蒙德', shortName: 'BVB', country: 'Germany' } },
  { id: 'bundesliga-002', league: '德甲', season: '2026/27', kickoffAt: new Date(now + 4 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'lev', name: '勒沃库森', shortName: 'LEV', country: 'Germany' }, awayTeam: { id: 'rbl', name: 'RB 莱比锡', shortName: 'RBL', country: 'Germany' } },
  { id: 'ligue1-001', league: '法甲', season: '2026/27', kickoffAt: new Date(now + 5 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'psg', name: '巴黎圣日耳曼', shortName: 'PSG', country: 'France' }, awayTeam: { id: 'mar', name: '马赛', shortName: 'MAR', country: 'France' } },
  { id: 'ligue1-002', league: '法甲', season: '2026/27', kickoffAt: new Date(now + 5 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'lil', name: '里尔', shortName: 'LIL', country: 'France' }, awayTeam: { id: 'lyo', name: '里昂', shortName: 'LYO', country: 'France' } },
  { id: 'csl-001', league: '中超', season: '2026', kickoffAt: new Date(now + 6 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'shg', name: '上海申花', shortName: 'SHG', country: 'China' }, awayTeam: { id: 'gdg', name: '成都蓉城', shortName: 'GDG', country: 'China' } },
  { id: 'csl-002', league: '中超', season: '2026', kickoffAt: new Date(now + 6 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'bjg', name: '北京国安', shortName: 'BJG', country: 'China' }, awayTeam: { id: 'shh', name: '上海海港', shortName: 'SHH', country: 'China' } },
  { id: 'ucl-001', league: '欧冠', season: '2026/27', kickoffAt: new Date(now + 7 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'rma', name: '皇家马德里', shortName: 'RMA', country: 'Spain' }, awayTeam: { id: 'mci', name: '曼城', shortName: 'MCI', country: 'England' } },
  { id: 'ucl-002', league: '欧冠', season: '2026/27', kickoffAt: new Date(now + 7 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'int', name: '国际米兰', shortName: 'INT', country: 'Italy' }, awayTeam: { id: 'ars', name: '阿森纳', shortName: 'ARS', country: 'England' } },
  { id: 'worldcup-001', league: '世界杯', season: '2026', kickoffAt: new Date(now + 8 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'arg', name: '阿根廷', shortName: 'ARG', country: 'Argentina' }, awayTeam: { id: 'bra', name: '巴西', shortName: 'BRA', country: 'Brazil' } },
  { id: 'worldcup-002', league: '世界杯', season: '2026', kickoffAt: new Date(now + 8 * oneDay + 3 * oneHour).toISOString(), status: 'scheduled', homeTeam: { id: 'ger', name: '德国', shortName: 'GER', country: 'Germany' }, awayTeam: { id: 'fra', name: '法国', shortName: 'FRA', country: 'France' } },
  { id: 'worldcup-003', league: '世界杯', season: '2026', kickoffAt: new Date(now + 9 * oneDay).toISOString(), status: 'scheduled', homeTeam: { id: 'esp', name: '西班牙', shortName: 'ESP', country: 'Spain' }, awayTeam: { id: 'por', name: '葡萄牙', shortName: 'POR', country: 'Portugal' } },
];

const contexts: Record<string, MatchContext> = {
  'epl-001': {
    matchId: 'epl-001',
    homeForm: { teamId: 'ars', lastMatches: 6, wins: 4, draws: 1, losses: 1, goalsFor: 13, goalsAgainst: 6, xgFor: 12.4, xgAgainst: 6.8, homeAwaySplit: 'home' },
    awayForm: { teamId: 'che', lastMatches: 6, wins: 2, draws: 2, losses: 2, goalsFor: 9, goalsAgainst: 8, xgFor: 8.7, xgAgainst: 8.2, homeAwaySplit: 'away' },
    injuries: ['客队中卫出战成疑'],
    restDaysHome: 6,
    restDaysAway: 4,
    travelPressureAway: 0.2,
    odds: { homeWin: 1.95, draw: 3.45, awayWin: 3.9, over25: 1.82, under25: 2.02 },
  },
  'laliga-001': {
    matchId: 'laliga-001',
    homeForm: { teamId: 'rma', lastMatches: 6, wins: 5, draws: 1, losses: 0, goalsFor: 15, goalsAgainst: 4, xgFor: 14.2, xgAgainst: 5.3, homeAwaySplit: 'home' },
    awayForm: { teamId: 'sev', lastMatches: 6, wins: 1, draws: 2, losses: 3, goalsFor: 6, goalsAgainst: 10, xgFor: 6.8, xgAgainst: 10.9, homeAwaySplit: 'away' },
    injuries: ['主队轮换风险'],
    restDaysHome: 5,
    restDaysAway: 5,
    travelPressureAway: 0.35,
    odds: { homeWin: 1.42, draw: 4.5, awayWin: 7.2, over25: 1.68, under25: 2.18 },
  },
  'seriea-001': {
    matchId: 'seriea-001',
    homeForm: { teamId: 'int', lastMatches: 6, wins: 3, draws: 2, losses: 1, goalsFor: 10, goalsAgainst: 5, xgFor: 10.8, xgAgainst: 6.1, homeAwaySplit: 'home' },
    awayForm: { teamId: 'mil', lastMatches: 6, wins: 3, draws: 1, losses: 2, goalsFor: 11, goalsAgainst: 9, xgFor: 10.1, xgAgainst: 8.9, homeAwaySplit: 'away' },
    injuries: ['德比战变量高'],
    restDaysHome: 4,
    restDaysAway: 4,
    travelPressureAway: 0.05,
    odds: { homeWin: 2.18, draw: 3.2, awayWin: 3.35, over25: 2.05, under25: 1.78 },
  },
};

export class MockFootballDataProvider implements FootballDataProvider {
  async getUpcomingMatches(): Promise<Match[]> {
    return matches;
  }

  async getMatchContext(matchId: string): Promise<MatchContext> {
    const context = contexts[matchId];
    if (!context) {
      // 自动生成通用上下文，避免详情页报错
      return {
        matchId,
        homeForm: { teamId: 'home', lastMatches: 6, wins: 3, draws: 2, losses: 1, goalsFor: 10, goalsAgainst: 8, xgFor: 9.5, xgAgainst: 8.2, homeAwaySplit: 'home' },
        awayForm: { teamId: 'away', lastMatches: 6, wins: 2, draws: 2, losses: 2, goalsFor: 8, goalsAgainst: 9, xgFor: 7.8, xgAgainst: 9.1, homeAwaySplit: 'away' },
        injuries: ['暂无伤病信息'],
        restDaysHome: 5,
        restDaysAway: 5,
        travelPressureAway: 0.2,
        odds: { homeWin: 2.5, draw: 3.2, awayWin: 2.8, over25: 1.9, under25: 1.9 },
      };
    }
    return context;
  }
}

export const mockFootballDataProvider = new MockFootballDataProvider();
