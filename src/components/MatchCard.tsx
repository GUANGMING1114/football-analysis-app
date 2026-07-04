import { Link } from 'expo-router';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import type { Match } from '@/types/football';

type Props = {
  match: Match;
  onReminder?: () => void;
};

export function MatchCard({ match, onReminder }: Props) {
  const time = new Date(match.kickoffAt).toLocaleString('zh-CN', {
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <View style={styles.card}>
      <Link href={`/match/${match.id}`} asChild>
        <Pressable style={styles.linkArea}>
          <View style={styles.row}>
            <Text style={styles.league}>{match.league}</Text>
            <Text style={styles.time}>{time}</Text>
          </View>
          <View style={styles.teams}>
            <Text style={styles.team}>{match.homeTeam.name}</Text>
            <Text style={styles.vs}>vs</Text>
            <Text style={styles.team}>{match.awayTeam.name}</Text>
          </View>
        </Pressable>
      </Link>
      <View style={styles.footer}>
        <Text style={styles.hint}>点击查看综合模型分析</Text>
        {onReminder && (
          <Pressable onPress={onReminder} style={styles.reminderButton}>
            <Text style={styles.reminderText}>设置赛前提醒</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#102033',
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e3654',
  },
  linkArea: { paddingBottom: 10 },
  row: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 14 },
  league: { color: '#7dd3fc', fontWeight: '700' },
  time: { color: '#94a3b8' },
  teams: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  team: { color: '#f8fafc', fontSize: 20, fontWeight: '800', flex: 1 },
  vs: { color: '#64748b', paddingHorizontal: 10 },
  footer: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 },
  hint: { color: '#93c5fd' },
  reminderButton: { backgroundColor: '#2563eb', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  reminderText: { color: '#fff', fontSize: 12, fontWeight: '700' },
});
