import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import type { GenreStat } from '../../../hooks/useProfileStats';

interface GenreChartBarsProps {
  data: GenreStat[];
}

export default function GenreChartBars({ data }: GenreChartBarsProps) {
  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Top Genres</Text>
        <Text style={styles.empty}>Complete anime to see your genre breakdown</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Top Genres</Text>
      <View style={styles.pills}>
        {data.map((item, index) => {
          const opacity = Math.max(1.0 - index * 0.15, 0.4);
          return (
            <View key={item.genre} style={[styles.pill, { opacity }]}>
              <Text style={styles.pillText}>{item.genre}</Text>
              <Text style={styles.pillCount}>{item.count}</Text>
            </View>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#1A1330',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 14,
  },
  empty: {
    fontSize: 14,
    color: '#A1A1AA',
    textAlign: 'center',
    paddingVertical: 16,
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#5b13ec',
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  pillText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  pillCount: {
    fontSize: 12,
    fontWeight: '700',
    color: 'rgba(255,255,255,0.7)',
  },
});
