import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import useProfileData from "../hooks/useProfileData";
import ProgressBar from "../../../ui/components/ProgressBar";
import HeroBanner from "../components/HeroBanner";
import GridNine from "../components/GridNine";
import ProfileHeader from "../components/ProfileHeader";

const C = {
  bg: "#0F0D1A",
  text: "#FFFFFF",
  sub: "#D4D4D8",    // zinc-300
  sub2: "#A1A1AA",   // zinc-400
  accent: "#A78BFA"  // indigo-300/400 vibe
};

export default function ProfileScreen() {
  const navigation = useNavigation<any>();
  const { data, isLoading, refetch, error } = useProfileData();
  const [showOverlay, setShowOverlay] = useState(true);

  // Run the guard once on mount in dev
  useEffect(() => {
    if (__DEV__) {
      import('../../../dev/schemaGuard').then(m => m.runSchemaGuard());
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => setShowOverlay(false), 4000);
    return () => clearTimeout(timeout);
  }, []);

  const onRefresh = React.useCallback(() => { refetch(); }, [refetch]);

  const Stat = ({ label, value }: {label:string; value:number|string}) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  const hasLoggedUiMount = React.useRef(false);

  useEffect(() => {
    if (!hasLoggedUiMount.current) {
      console.log("[profile] ui mounted: gridNine len", data?.gridNine?.length ?? 0);
      hasLoggedUiMount.current = true;
    }
  }, [data?.gridNine?.length]);

  // Badge label sanity log
  if (__DEV__ && Array.isArray(data?.badges)) {
    const labels = data!.badges.map((b: any) =>
      b.badge_label ?? b.label ?? b.name ?? b.slug ?? b.badge_id ?? 'badge'
    );
    console.log('[profile] badges render labels:', labels);
  }

  // --- FEATURED + GRID (deduped) ---
  const topList = Array.isArray(data?.topList) ? data!.topList : [];

  // Prefer explicit banner if present; otherwise top1; otherwise eleven; otherwise null
  const featured = data?.banner ?? topList[0] ?? data?.eleven ?? null;
  const featuredId = featured?.id ?? null;

  const featuredTitle = featured?.title ?? '';
  const featuredThumbnail = featured?.thumbnail_url ?? undefined;

  // Grid = top list minus the featured, capped to 9 items
  const gridItems = topList.filter(a => a?.id !== featuredId).slice(0, 9);

  // Dev diagnostics (safe in prod since wrapped with __DEV__)
  if (__DEV__) {
    console.log('[profile] topList titles:', topList.map(a => a?.title));
    console.log('[profile] featuredId:', featuredId, 'title:', featuredTitle);
    console.log('[profile] grid items:', gridItems.map(a => a?.title));
  }
  // --- END FEATURED + GRID ---

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl tintColor={C.text} refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {console.log("[profile] render: Header")}
        <ProfileHeader
          displayName={data?.profile?.handle ?? "NH Explorer"}
          handle={data?.profile?.handle ?? null}
          level={null}
          bio={data?.profile?.bio ?? null}
          showSocials={data?.profile?.showSocials}
          socials={data?.profile?.socials}
        />

        {/* --- Badges (always render) --- */}
        {console.log('[profile] badges payload:', {
          isArray: Array.isArray(data?.badges),
          count: Array.isArray(data?.badges) ? data.badges.length : 'n/a',
        })}
        <View
          onLayout={(e) =>
            console.log('[profile] badges container height=', e.nativeEvent.layout.height)
          }
          style={[
            styles.badgesRow,
            // DEV-only loud chrome:
            __DEV__ && {
              borderWidth: 2,
              borderStyle: 'dashed',
              borderColor: '#ff00ff',
              backgroundColor: 'rgba(255,0,255,0.35)',
              minHeight: 48,
              paddingVertical: 8,
              marginTop: 8,
            },
          ]}
        >
          {Array.isArray(data?.badges) && data.badges.length > 0 ? (
            data.badges.slice(0, 3).map((badge, idx) => (
              <View
                key={badge.badge_id ?? badge.id ?? idx}
                style={[
                  styles.badgePill,
                  __DEV__ && { borderWidth: 1, borderColor: '#00ff7f' },
                ]}
              >
                <Text style={styles.badgeText}>
                  {badge.badge_label ?? badge.label ?? badge.name ?? 'badge'}
                </Text>
              </View>
            ))
          ) : (
            <>
              <View style={[styles.badgePill, __DEV__ && { borderWidth: 1, borderColor: '#00ff7f' }]}>
                <Text style={styles.badgeText}>dev: no badges</Text>
              </View>
              <View style={[styles.badgePill, __DEV__ && { borderWidth: 1, borderColor: '#00ff7f' }]}>
                <Text style={styles.badgeText}>placeholder</Text>
              </View>
            </>
          )}
        </View>

        {/* --- 11/10 section REPLACED by Hero --- */}
        {console.log("[profile] render: Banner")}
        {featuredThumbnail ? (
          <HeroBanner
            title={featuredTitle}
            imageUri={featuredThumbnail}
          />
        ) : null}
        {/* --- end replacement --- */}

        {/* Top List */}
        {console.log("[profile] render: GridNine")}
        <GridNine
          items={gridItems}
          elevenId={data?.eleven?.id}
          onPressItem={(id) => navigation.navigate("AnimeDetail", { id })}
        />

        {console.log("[profile] render: Progress")}
        {/* Progress */}
        <View style={styles.section}>
          <Text style={styles.h2}>Next Level Progress</Text>
          <View style={{ marginTop: 12 }}>
            <ProgressBar value={data?.exp?.current ?? 0} total={data?.exp?.toNext ?? 2000} />
            <Text style={styles.caption}>
              {(data?.exp?.current ?? 0)}/{(data?.exp?.toNext ?? 2000)} XP
            </Text>
          </View>
        </View>

        {console.log("[profile] render: Stats")}
        {/* Stats */}
        <View style={styles.section}>
          <Text style={styles.h2}>My Stats</Text>
          <View style={styles.statsRow}>
            <Stat label="Animes Watched"  value={data?.stats?.watched ?? 0} />
            <Stat label="Animes Reviewed" value={data?.stats?.reviewed ?? 0} />
            <Stat label="Account Score"   value={data?.score ?? 0} />
          </View>
        </View>

        {!!error && __DEV__ && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{String(error)}</Text>
          </View>
        )}
      </ScrollView>

      {console.log("[profile] render order OK (Header > Badges > Banner > Grid > Progress > Stats)")}
      {showOverlay ? (
        <View style={styles.overlay} pointerEvents="none">
          <Text style={styles.overlayLabel}>[profile] debug avatar overlay</Text>
          <ProfileHeader displayName="Debug Avatar" handle="overlay" level={null} bio={null} />
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollContent: { flexGrow: 1 },
  h2: { color: C.text, fontSize: 18, fontWeight: "700", marginTop: 16, marginBottom: 8 },
  caption: { color: "#C8C6D8", fontSize: 12, marginTop: 6 },
  section: { marginTop: 16, marginBottom: 16 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12, gap: 16 },
  statItem: { alignItems: "center", minWidth: 90 },
  statValue: { color: C.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: C.sub2, fontSize: 12, marginTop: 4, textAlign: "center" },
  badgesContainer: {
    marginTop: 8,
    marginBottom: 8,
  },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
  },
  badgePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(201,196,255,0.12)",
  },
  badgeMorePill: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 16,
    backgroundColor: "rgba(201,196,255,0.18)",
  },
  badgeText: {
    color: "#C9C4FF",
    fontSize: 13,
    fontWeight: "500",
  },
  errBox: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#7F1D1D", borderWidth: 1, borderRadius: 12, padding: 8, marginTop: 16 },
  errText: { color: "#fecaca", fontSize: 12 },
  overlay: {
    position: "absolute",
    top: 96,
    left: 12,
    right: 12,
    padding: 12,
    backgroundColor: "rgba(255,0,255,0.08)",
    zIndex: 9999,
    borderWidth: 1,
    borderColor: "#FF00FF",
    borderRadius: 12,
    gap: 8,
  },
  overlayLabel: {
    color: "#FF00FF",
    fontWeight: "700",
    textAlign: "center",
  },
});
