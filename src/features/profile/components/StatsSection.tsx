import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import GenreChartBars from './GenreChartBars';
import type { ProfileStats } from '../../../hooks/useProfileStats';

interface StatsSectionProps {
  stats: ProfileStats;
}

interface StatTileProps {
  value: string;
  label: string;
}

function StatTile({ value, label }: StatTileProps) {
  return (
    <View style={styles.tile}>
      <Text style={styles.tileValue} numberOfLines={1} adjustsFontSizeToFit>{value}</Text>
      <Text style={styles.tileLabel}>{label}</Text>
    </View>
  );
}

export default function StatsSection({ stats }: StatsSectionProps) {
  const avgScoreDisplay = stats.avgScore !== null ? `${stats.avgScore}/10` : '—';

  return (
    <View style={styles.container}>
      <Text style={styles.h2}>My Stats</Text>

      {/* 2×2 grid */}
      <View style={styles.grid}>
        <StatTile value={String(stats.completedCount)} label="Anime Completed" />
        <StatTile value={String(stats.episodesWatched)} label="Episodes Watched" />
        <StatTile value={`${stats.hoursWatched}h`} label="Hours Watched" />
        <StatTile value={avgScoreDisplay} label="Avg Score" />
      </View>

      <GenreChartBars data={stats.genreBreakdown} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 8,
    gap: 12,
  },
  h2: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  tile: {
    width: '47.5%',
    backgroundColor: '#1A1330',
    borderRadius: 14,
    paddingVertical: 20,
    paddingHorizontal: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  tileValue: {
    fontSize: 36,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 42,
  },
  tileLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#A78BFA',
    letterSpacing: 0.5,
    marginTop: 4,
    textAlign: 'center',
  },
});
