import React, { useEffect, useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import useProfileData from "../hooks/useProfileData";
import Section from "../../../ui/components/Section";
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
  const { data, isLoading, refetch, error } = useProfileData();
  const [showOverlay, setShowOverlay] = useState(true);

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

  const featuredThumbnail = data?.banner?.thumbnail_url ?? data?.eleven?.thumbnail_url ?? null;

  const hasLoggedUiMount = React.useRef(false);

  useEffect(() => {
    if (!hasLoggedUiMount.current) {
      console.log("[profile] ui mounted: gridNine len", data?.gridNine?.length ?? 0);
      hasLoggedUiMount.current = true;
    }
  }, [data?.gridNine?.length]);

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
        <ProfileHeader
          displayName={data?.profile?.handle ?? "NH Explorer"}
          handle={data?.profile?.handle ?? null}
          level={null}
          bio={data?.profile?.bio ?? null}
          showSocials={data?.profile?.showSocials}
          socials={data?.profile?.socials}
        />

        {/* Badges directly UNDER the identity section (no title text) */}
        {data?.badges?.length > 0 && (
          <View style={styles.badgesRow}>
            {data.badges.slice(0, 3).map((b: any, i: number) => (
              <View key={b.badgeId ?? b.id ?? i} style={styles.badgePill}>
                <Text style={styles.badgeText}>{b.name ?? "Badge"}</Text>
              </View>
            ))}
            {data.badges.length > 3 && (
              <View style={styles.badgePill}>
                <Text style={styles.badgeText}>+{data.badges.length - 3}</Text>
              </View>
            )}
          </View>
        )}

        {/* Progress */}
        <Section style={styles.section}>
          <Text style={styles.h2}>Next Level Progress</Text>
          <View style={{ marginTop: 12 }}>
            <ProgressBar value={data?.exp?.current ?? 0} total={data?.exp?.toNext ?? 2000} />
            <Text style={styles.caption}>
              {(data?.exp?.current ?? 0)}/{(data?.exp?.toNext ?? 2000)} XP
            </Text>
          </View>
        </Section>

        {/* Stats */}
        <Section style={styles.section}>
          <Text style={styles.h2}>My Stats</Text>
          <View style={styles.statsRow}>
            <Stat label="Animes Watched"  value={data?.stats?.watched ?? 0} />
            <Stat label="Animes Reviewed" value={data?.stats?.reviewed ?? 0} />
            <Stat label="Account Score"   value={data?.score ?? 0} />
          </View>
        </Section>

        {/* --- 11/10 section REPLACED by Hero --- */}
        {(data?.banner || data?.eleven) ? (
          <HeroBanner
            title={(data?.banner?.title ?? data?.eleven?.title) || ''}
            thumbnailUrl={featuredThumbnail}
            subtitle={data?.profile?.handle ? `@${data.profile.handle}` : undefined}
          />
        ) : null}
        {/* --- end replacement --- */}

        {/* Top List */}
        <GridNine data={data?.gridNine ?? []} elevenId={data?.eleven?.id ?? undefined} />

        {!!error && __DEV__ && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{String(error)}</Text>
          </View>
        )}
      </ScrollView>

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
  badgesRow: { marginTop: 12, flexDirection: "row", flexWrap: "wrap", gap: 8, alignItems: "center" },
  badgePill: { paddingHorizontal: 10, paddingVertical: 6, backgroundColor: "rgba(201,196,255,0.12)", borderRadius: 999 },
  badgeText: { color: "#C9C4FF", fontSize: 13, fontWeight: "500" },
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
