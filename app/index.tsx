import { useEffect, useMemo, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import { MatchCard } from '@/components/MatchCard';

import { requestNotificationPermissions, scheduleMatchReminder } from '@/services/notifications';
import { getWorldCupMatches } from '@/services/world-cup';
import { apiFootballDataProvider } from '@/services/data-providers/api-provider';
import { mockFootballDataProvider } from '@/services/data-providers/mock-provider';
import type { Match } from '@/types/football';

export default function HomeScreen() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'league' | 'worldcup'>('league');
  const [selectedLeague, setSelectedLeague] = useState<string>('全部');
  const [searchQuery, setSearchQuery] = useState('');

  async function load() {
    setLoading(true);
    try {
      // 优先请求公网后端，失败后再使用 mock 数据
      const data = await apiFootballDataProvider.getUpcomingMatches().catch(async (err) => {
        console.warn('公网后端请求失败，使用 mock 数据:', err);
        return mockFootballDataProvider.getUpcomingMatches();
      });
      setMatches(data);
    } catch (error) {
      console.error(error);
      const fallback = await mockFootballDataProvider.getUpcomingMatches();
      setMatches(fallback);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
    requestNotificationPermissions().catch(console.error);
  }, []);

  useEffect(() => {
    if (activeTab === 'worldcup') {
      loadWorldCup();
    }
  }, [activeTab]);

  const loadWorldCup = async () => {
    setLoading(true);
    try {
      const data = await getWorldCupMatches();
      setMatches(data);
    } catch (e) {
      console.error('World Cup load failed', e);
    } finally {
      setLoading(false);
    }
  };

  const leagues = useMemo(() => {
    const all = new Set<string>();
    matches.forEach((match) => all.add(match.league));
    return ['全部', ...Array.from(all).sort()];
  }, [matches]);

  const filteredMatches = useMemo(() => {
    return matches.filter((match) => {
      const matchesLeague = selectedLeague === '全部' || match.league === selectedLeague;
      const query = searchQuery.trim().toLowerCase();
      const matchesSearch =
        !query ||
        match.homeTeam.name.toLowerCase().includes(query) ||
        match.awayTeam.name.toLowerCase().includes(query) ||
        match.league.toLowerCase().includes(query);
      return matchesLeague && matchesSearch;
    });
  }, [matches, selectedLeague, searchQuery]);

  return (
    <ScrollView
      style={styles.screen}
      contentInsetAdjustmentBehavior="automatic"
      refreshControl={<RefreshControl refreshing={loading} onRefresh={load} colors={['#7dd3fc']} tintColor="#7dd3fc" />}
    >
      <View style={styles.hero}>
        <Text style={styles.kicker}>综合足球分析平台</Text>
        <Text style={styles.title}>今日比赛模型看板</Text>
        <Text style={styles.subtitle}>自动抓取公开数据，结合近期战绩、xG 和伤停，输出可解释的比赛分析。</Text>
      </View>

      <TextInput
        style={styles.searchInput}
        placeholder="搜索球队或联赛..."
        placeholderTextColor="#64748b"
        value={searchQuery}
        onChangeText={setSearchQuery}
      />

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.leagueScroll}>
        {leagues.map((league) => (
          <Pressable
            key={league}
            style={[styles.leagueChip, selectedLeague === league && styles.leagueChipActive]}
            onPress={() => setSelectedLeague(league)}
          >
            <Text style={[styles.leagueChipText, selectedLeague === league && styles.leagueChipTextActive]}>{league}</Text>
          </Pressable>
        ))}
      </ScrollView>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>未来比赛</Text>
        <Text style={styles.sectionMeta}>{filteredMatches.length} 场</Text>
      </View>

      {filteredMatches.length === 0 && !loading && <Text style={styles.empty}>无匹配比赛，试试其他关键词。</Text>}

      <View style={styles.tabs}>
        <Pressable style={[styles.tab, activeTab === 'league' && styles.tabActive]} onPress={() => { setActiveTab('league'); load(); }}>
          <Text style={[styles.tabText, activeTab === 'league' && styles.tabTextActive]}>联赛</Text>
        </Pressable>
        <Pressable style={[styles.tab, activeTab === 'worldcup' && styles.tabActive]} onPress={() => setActiveTab('worldcup')}>
          <Text style={[styles.tabText, activeTab === 'worldcup' && styles.tabTextActive]}>世界杯</Text>
        </Pressable>
      </View>

      {filteredMatches.map((match) => (
        <MatchCard key={match.id} match={match} onReminder={() => scheduleMatchReminder(match)} />
      ))}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#07111f', padding: 18 },
  hero: {
    padding: 20,
    borderRadius: 24,
    backgroundColor: '#0f2742',
    borderWidth: 1,
    borderColor: '#1d4ed8',
    marginBottom: 22,
  },
  kicker: { color: '#7dd3fc', fontWeight: '800', marginBottom: 8 },
  title: { color: '#f8fafc', fontSize: 30, fontWeight: '900', marginBottom: 10 },
  subtitle: { color: '#bfdbfe', lineHeight: 22 },
  searchInput: {
    backgroundColor: '#102033',
    color: '#f8fafc',
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#1e3654',
  },
  leagueScroll: { marginBottom: 14 },
  leagueChip: {
    backgroundColor: '#102033',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#1e3654',
  },
  leagueChipActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  leagueChipText: { color: '#cbd5e1', fontWeight: '700' },
  leagueChipTextActive: { color: '#fff' },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { color: '#f8fafc', fontSize: 20, fontWeight: '800' },
  sectionMeta: { color: '#94a3b8' },
  empty: { color: '#94a3b8', textAlign: 'center', marginTop: 30 },
  tabs: { flexDirection: 'row', gap: 8, marginBottom: 14 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, backgroundColor: '#102033', borderWidth: 1, borderColor: '#1e3654' },
  tabActive: { backgroundColor: '#2563eb', borderColor: '#2563eb' },
  tabText: { color: '#cbd5e1', textAlign: 'center', fontWeight: '700' },
  tabTextActive: { color: '#fff' },
});
