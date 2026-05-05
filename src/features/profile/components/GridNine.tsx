import React from "react";
import { View, Text, Image, Pressable, StyleSheet, Dimensions } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

type Item = { id: string; title?: string | null; thumbnail_url?: string | null };
type Props = {
  title?: string;
  items?: Item[];
  elevenId?: string | null;
  onPressItem?: (id: string) => void;
};

const COLS = 3;
const GAP = 12;
const { width } = Dimensions.get("window");
const PAGE_PAD = 24;
const TILE_W = Math.floor((width - PAGE_PAD * 2 - GAP * (COLS - 1)) / COLS);
const TILE_H = Math.round(TILE_W * 4 / 3);

function GridTile({ item, isEleven, onPress }: { item: Item; isEleven: boolean; onPress: () => void }) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={[styles.tileOuter, animatedStyle]}>
      <Pressable
        style={styles.tile}
        onPress={onPress}
        onPressIn={() => { scale.value = withSpring(0.94, { damping: 15, stiffness: 300 }); }}
        onPressOut={() => { scale.value = withSpring(1.0, { damping: 12, stiffness: 250 }); }}
      >
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.img} />
        ) : (
          <View style={[styles.img, styles.placeholder]} />
        )}
        {isEleven ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>11/10</Text>
          </View>
        ) : null}
      </Pressable>
    </Animated.View>
  );
}

export default function GridNine({ title, items = [], elevenId, onPressItem }: Props) {
  const data = Array.isArray(items) ? items.slice(0, 9) : [];
  if (data.length === 0) return null;

  return (
    <View style={styles.section}>
      {title ? <Text style={styles.header}>{title}</Text> : null}
      <View style={styles.grid}>
        {data.map(x => (
          <GridTile
            key={x.id}
            item={x}
            isEleven={!!elevenId && x.id === elevenId}
            onPress={() => onPressItem?.(x.id)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: { marginTop: 16 },
  header: { fontSize: 20, fontWeight: "700", color: "white", marginBottom: 12 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: GAP },
  tileOuter: { width: TILE_W, height: TILE_H },
  tile: { flex: 1, borderRadius: 12, overflow: "hidden", backgroundColor: "rgba(255,255,255,0.04)" },
  img: { width: "100%", height: "100%" },
  placeholder: { backgroundColor: "rgba(201,196,255,0.08)" },
  badge: { position: "absolute", top: 6, left: 6, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4, backgroundColor: "rgba(201,196,255,0.9)" },
  badgeText: { fontSize: 12, fontWeight: "700", color: "#111" },
});
