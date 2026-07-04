import type { AnalysisFactor, AnalysisResult, MatchContext, TeamForm } from '@/types/football';

const clamp = (value: number, min: number, max: number) => Math.max(min, Math.min(max, value));
const round = (value: number) => Math.round(value * 100) / 100;

function formScore(form: TeamForm): number {
  const points = (form.wins * 3 + form.draws) / (form.lastMatches * 3);
  const goalDiff = (form.goalsFor - form.goalsAgainst) / Math.max(1, form.lastMatches);
  const xgDiff = ((form.xgFor ?? form.goalsFor) - (form.xgAgainst ?? form.goalsAgainst)) / Math.max(1, form.lastMatches);
  return points * 0.5 + clamp((goalDiff + 2) / 4, 0, 1) * 0.25 + clamp((xgDiff + 2) / 4, 0, 1) * 0.25;
}

function expectedGoals(form: TeamForm, opponent: TeamForm, homeAdvantage: number): number {
  const attack = (form.xgFor ?? form.goalsFor) / Math.max(1, form.lastMatches);
  const defenseLeak = (opponent.xgAgainst ?? opponent.goalsAgainst) / Math.max(1, opponent.lastMatches);
  return clamp((attack * 0.58 + defenseLeak * 0.42) + homeAdvantage, 0.2, 3.8);
}

function oddsSignal(context: MatchContext): number {
  const odds = context.odds;
  if (!odds?.homeWin || !odds.awayWin) return 0;
  const homeImplied = 1 / odds.homeWin;
  const awayImplied = 1 / odds.awayWin;
  return clamp((homeImplied - awayImplied) * 0.35, -0.12, 0.12);
}

function normalize(home: number, draw: number, away: number) {
  const total = home + draw + away;
  return {
    homeWin: home / total,
    draw: draw / total,
    awayWin: away / total,
  };
}

function buildFactors(context: MatchContext, strengthDelta: number, totalXg: number): AnalysisFactor[] {
  const factors: AnalysisFactor[] = [];
  factors.push({
    label: '近期综合状态',
    impact: strengthDelta > 0.05 ? 'positive' : strengthDelta < -0.05 ? 'negative' : 'neutral',
    weight: 0.22,
    description: strengthDelta > 0 ? '主队近期状态和攻防效率整体占优。' : '客队近期状态不落下风，主队优势有限。',
  });
  factors.push({
    label: '进球期望',
    impact: totalXg > 2.75 ? 'positive' : totalXg < 2.25 ? 'negative' : 'neutral',
    weight: 0.16,
    description: `本场总期望进球约 ${round(totalXg)}，${totalXg > 2.75 ? '节奏偏开放。' : totalXg < 2.25 ? '节奏可能偏谨慎。' : '处于中性区间。'}`,
  });
  if ((context.restDaysHome ?? 0) !== (context.restDaysAway ?? 0)) {
    factors.push({
      label: '赛程体能',
      impact: (context.restDaysHome ?? 0) > (context.restDaysAway ?? 0) ? 'positive' : 'negative',
      weight: 0.1,
      description: `主队休息 ${context.restDaysHome ?? '未知'} 天，客队休息 ${context.restDaysAway ?? '未知'} 天。`,
    });
  }
  if (context.injuries?.length) {
    factors.push({
      label: '伤停与不确定性',
      impact: 'negative',
      weight: 0.1,
      description: context.injuries.join('；'),
    });
  }
  if (context.odds) {
    factors.push({
      label: '市场赔率校准',
      impact: 'neutral',
      weight: 0.08,
      description: '赔率仅作为校准信号，模型不会完全跟随市场。',
    });
  }
  return factors;
}

export function analyzeMatch(context: MatchContext): AnalysisResult {
  const homeFormScore = formScore(context.homeForm);
  const awayFormScore = formScore(context.awayForm);
  const restDelta = clamp(((context.restDaysHome ?? 5) - (context.restDaysAway ?? 5)) / 10, -0.08, 0.08);
  const travelPenalty = clamp(context.travelPressureAway ?? 0, 0, 1) * 0.05;
  const strengthDelta = (homeFormScore - awayFormScore) * 0.42 + 0.08 + restDelta + travelPenalty + oddsSignal(context);

  const homeXg = expectedGoals(context.homeForm, context.awayForm, 0.18 + restDelta);
  const awayXg = expectedGoals(context.awayForm, context.homeForm, -0.04 - travelPenalty);
  const totalXg = homeXg + awayXg;

  const baseHome = 0.45 + strengthDelta;
  const baseAway = 0.28 - strengthDelta * 0.82;
  const closeness = 1 - clamp(Math.abs(strengthDelta) / 0.38, 0, 1);
  const baseDraw = 0.22 + closeness * 0.1 + (totalXg < 2.4 ? 0.04 : 0);
  const probabilities = normalize(clamp(baseHome, 0.12, 0.78), clamp(baseDraw, 0.12, 0.38), clamp(baseAway, 0.1, 0.72));

  const over25 = clamp((totalXg - 1.5) / 2.4, 0.18, 0.78);
  const under25 = 1 - over25;
  const maxProb = Math.max(probabilities.homeWin, probabilities.draw, probabilities.awayWin, over25, under25);
  const winPick = probabilities.homeWin > probabilities.awayWin && probabilities.homeWin > probabilities.draw
    ? 'home'
    : probabilities.awayWin > probabilities.draw
      ? 'away'
      : 'draw';
  const recommendation = maxProb < 0.48 ? 'watch' : over25 > 0.6 ? 'over25' : under25 > 0.6 ? 'under25' : winPick;
  const confidence = clamp(maxProb, 0.35, 0.82);
  const riskLevel = confidence >= 0.62 && Math.abs(probabilities.homeWin - probabilities.awayWin) > 0.14
    ? 'low'
    : confidence >= 0.52
      ? 'medium'
      : 'high';

  return {
    matchId: context.matchId,
    probabilities: {
      homeWin: round(probabilities.homeWin),
      draw: round(probabilities.draw),
      awayWin: round(probabilities.awayWin),
      over25: round(over25),
      under25: round(under25),
    },
    expectedGoals: { home: round(homeXg), away: round(awayXg) },
    scorelineRange: [`${Math.round(homeXg)}-${Math.max(0, Math.round(awayXg))}`, `${Math.ceil(homeXg)}-${Math.floor(awayXg)}`, `${Math.floor(homeXg)}-${Math.ceil(awayXg)}`],
    recommendation,
    confidence: round(confidence),
    riskLevel,
    factors: buildFactors(context, strengthDelta, totalXg),
  };
}
