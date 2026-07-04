import { StyleSheet, Text, View } from 'react-native';

type Props = {
  label: string;
  value: number;
  color?: string;
};

export function ProbabilityBar({ label, value, color = '#38bdf8' }: Props) {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.value}>{Math.round(value * 100)}%</Text>
      </View>
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(value * 100)}%`, backgroundColor: color }]} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { marginBottom: 12 },
  header: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  label: { color: '#dbeafe', fontWeight: '700' },
  value: { color: '#f8fafc', fontWeight: '800' },
  track: { height: 10, backgroundColor: '#1e293b', borderRadius: 999, overflow: 'hidden' },
  fill: { height: 10, borderRadius: 999 },
});
