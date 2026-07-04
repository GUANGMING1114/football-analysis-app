import { type ReactNode } from 'react';
import { StyleSheet, Text, View } from 'react-native';

export type Segment = {
  value: number;
  color: string;
  label: string;
};

type Props = {
  segments: Segment[];
  size?: number;
  stroke?: number;
  children?: ReactNode;
};

export function DonutChart({ segments, size = 160, stroke = 24, children }: Props) {
  const total = segments.reduce((sum, segment) => sum + segment.value, 0) || 1;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <View style={styles.center}>{segments.map((segment, index) => {
        const dash = (segment.value / total) * circumference;
        const gap = circumference - dash;
        const circle = (
          <View
            key={index}
            style={[
              styles.circle,
              {
                width: size,
                height: size,
                borderRadius: size / 2,
                borderWidth: stroke,
                borderColor: segment.color,
                transform: [{ rotate: `${(offset / total) * 360}deg` }],
              },
            ]}
          />
        );
        offset += segment.value;
        return circle;
      })}
      <View style={[styles.inner, { width: size - stroke * 2, height: size - stroke * 2 }]}>
        {children}
      </View>
      </View>
    </View>
  );
}

export function DonutLegend({ segments, total }: { segments: Segment[]; total?: number }) {
  return (
    <View style={styles.legend}>
      {segments.map((segment, index) => (
        <View key={index} style={styles.legendItem}>
          <View style={[styles.dot, { backgroundColor: segment.color }]} />
          <Text style={styles.legendText}>{segment.label}</Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { justifyContent: 'center', alignItems: 'center' },
  center: { justifyContent: 'center', alignItems: 'center' },
  circle: {
    position: 'absolute',
    borderStyle: 'solid',
    backgroundColor: 'transparent',
  },
  inner: {
    position: 'absolute',
    backgroundColor: '#0f172a',
    borderRadius: 999,
    justifyContent: 'center',
    alignItems: 'center',
  },
  legend: { marginTop: 18 },
  legendItem: { flexDirection: 'row', alignItems: 'center', marginVertical: 4 },
  dot: { width: 10, height: 10, borderRadius: 5, marginRight: 8 },
  legendText: { color: '#dbeafe' },
});
