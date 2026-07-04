import * as Notifications from 'expo-notifications';
import type { Match } from '@/types/football';

export async function requestNotificationPermissions(): Promise<boolean> {
  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  if (existingStatus === 'granted') return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === 'granted';
}

export function scheduleMatchReminder(match: Match) {
  const kickoff = new Date(match.kickoffAt);
  const now = new Date();
  const triggerAt = new Date(kickoff.getTime() - 10 * 60 * 1000);
  if (triggerAt <= now) return null;

  return Notifications.scheduleNotificationAsync({
    content: {
      title: `比赛即将开始 · ${match.league}`,
      body: `${match.homeTeam.name} vs ${match.awayTeam.name} 将在 10 分钟后开赛，点击查看模型分析。`,
      data: { matchId: match.id },
    },
    trigger: triggerAt,
  });
}

export async function cancelAllReminders() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}
