import React from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Dimensions,
} from 'react-native';

type Item = { id: string; title: string; thumbnail_url?: string | null };
type Props = {
  items: Item[];
  elevenId?: string | null;
  onPressItem?: (id: string) => void;
  title?: string;
};

const GAP = 8;
const COLS = 3;
const W = Dimensions.get('window').width;
const TILE = Math.floor((W - (GAP * (COLS + 1))) / COLS);
const H = Math.round(TILE * 1.33);

export default function GridNine({ items, elevenId, onPressItem, title = 'Top Picks' }: Props) {
  return (
    <View style={styles.section}>
      <Text style={styles.header}>{title}</Text>
      <FlatList
        data={items.slice(0, 9)}
        keyExtractor={(x) => x.id}
        numColumns={COLS}
        columnWrapperStyle={{ gap: GAP, paddingHorizontal: GAP }}
        contentContainerStyle={{ gap: GAP, paddingBottom: 12 }}
        renderItem={({ item }) => {
          const isEleven = !!elevenId && item.id === elevenId;
          return (
            <TouchableOpacity onPress={() => onPressItem?.(item.id)} activeOpacity={0.8}>
              <ImageBackground
                source={item.thumbnail_url ? { uri: item.thumbnail_url } : undefined}
                resizeMode="cover"
                style={[styles.tile, { width: TILE, height: H }]}
                imageStyle={{ borderRadius: 8 }}
              >
                {!item.thumbnail_url && <View style={[styles.tile, styles.fallback]} />}
                {isEleven && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>11/10</Text>
                  </View>
                )}
              </ImageBackground>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 12 },
  header: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '700',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  tile: { borderRadius: 8, backgroundColor: '#1b1626', overflow: 'hidden' },
  fallback: { alignItems: 'center', justifyContent: 'center' },
  badge: {
    position: 'absolute',
    top: 6,
    right: 6,
    backgroundColor: 'rgba(91,19,236,0.95)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  badgeText: { color: '#fff', fontSize: 10, fontWeight: '800' },
});
