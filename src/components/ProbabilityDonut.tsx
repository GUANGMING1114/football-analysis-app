import { StyleSheet, Text, View } from 'react-native';
import { DonutChart, DonutLegend } from './DonutChart';

type Props = {
  homeWin: number;
  draw: number;
  awayWin: number;
};

export function ProbabilityDonut({ homeWin, draw, awayWin }: Props) {
  const segments = [
    { value: homeWin, color: '#22c55e', label: `主胜 ${Math.round(homeWin * 100)}%` },
    { value: draw, color: '#f59e0b', label: `平局 ${Math.round(draw * 100)}%` },
    { value: awayWin, color: '#38bdf8', label: `客胜 ${Math.round(awayWin * 100)}%` },
  ];

  return (
    <View style={styles.wrap}>
      <DonutChart segments={segments} size={180} stroke={22}>
        <Text style={styles.center}>胜平负</Text>
      </DonutChart>
      <DonutLegend segments={segments} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { alignItems: 'center', paddingVertical: 12 },
  center: { color: '#f8fafc', fontWeight: '800', fontSize: 13 },
});
