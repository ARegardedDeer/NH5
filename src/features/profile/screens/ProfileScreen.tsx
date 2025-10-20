import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import useProfileData from "../hooks/useProfileData";
import Avatar from "../../../ui/components/Avatar";
import Section from "../../../ui/components/Section";
import ProgressBar from "../../../ui/components/ProgressBar";
import PosterImage from "../../../ui/components/PosterImage";

const C = {
  bg: "#0F0D1A",
  text: "#FFFFFF",
  sub: "#D4D4D8",    // zinc-300
  sub2: "#A1A1AA",   // zinc-400
  accent: "#A78BFA"  // indigo-300/400 vibe
};

export default function ProfileScreen() {
  const { data, isLoading, refetch, error } = useProfileData();

  const onRefresh = React.useCallback(() => { refetch(); }, [refetch]);

  const Stat = ({ label, value }: {label:string; value:number|string}) => (
    <View style={styles.statItem}>
      <Text style={styles.statValue}>{String(value)}</Text>
      <Text style={styles.statLabel}>{label}</Text>
    </View>
  );

  return (
    <SafeAreaView edges={["top"]} style={styles.root}>
      <ScrollView
        stickyHeaderIndices={[0]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl tintColor={C.text} refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        {/* Header */}
        <View style={styles.headerSticky}>
          <View style={styles.headerRow}>
            <Avatar size={72} />
            <View style={{ flex: 1 }}>
              <Text style={styles.title} numberOfLines={1}>
                {data?.profile?.handle ?? "NH Explorer"}
              </Text>
              {!!data?.profile?.handle && (
                <Text style={styles.handle}>@{data.profile.handle}</Text>
              )}
              {!!data?.profile?.bio && (
                <Text style={styles.body} numberOfLines={2}>{data.profile.bio}</Text>
              )}
            </View>
            <Text style={styles.edit}>Edit</Text>
          </View>
        </View>

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

        {/* Badges */}
        <Section style={styles.section}>
          <Text style={styles.h2}>My Badges</Text>
          <View style={styles.badgesRow}>
            {(data?.badges?.length ? data.badges : ["Isekai Addict","Horror Connoisseur","Slice-of-Life Sage"]).map((b: any, i: number) => (
              <Text key={i} style={styles.badge}>
                {typeof b === "string" ? b : (b.name ?? "Badge")}
              </Text>
            ))}
          </View>
        </Section>

        {/* 11/10 */}
        <Section style={styles.section}>
          <Text style={styles.h2}>Your 11/10</Text>
          {data?.eleven ? (
            <View style={styles.elevenRow}>
              <PosterImage uri={data.eleven.thumbnail_url ?? null} width={140} />
            </View>
          ) : (
            <Text style={styles.caption}>
              Set an 11/10 from any anime page via "Set as 11/10".
            </Text>
          )}
        </Section>

        {/* Top List */}
        <Section style={styles.section}>
          <Text style={styles.h2}>My Top List</Text>
          <View style={styles.topRow}>
            {(data?.topList ?? []).slice(0, 10).map((a: any, i: number) => (
              <PosterImage key={i} uri={a?.thumbnail_url ?? null} width={112} />
            ))}
            {(!data?.topList || data.topList.length === 0) && (
              <Text style={styles.body}>Add your Top List later.</Text>
            )}
          </View>
        </Section>

        {/* Socials */}
        <Section style={styles.bottomSpace}>
          <Text style={styles.h2}>Socials</Text>
          {data?.profile?.showSocials && data?.profile?.socials ? (
            <View style={{ marginTop: 8 }}>
              {data.profile.socials.twitch   && <Text style={styles.body}>Twitch  ·  {data.profile.socials.twitch}</Text>}
              {data.profile.socials.x        && <Text style={styles.body}>X       ·  {data.profile.socials.x}</Text>}
              {data.profile.socials.youtube  && <Text style={styles.body}>YouTube ·  {data.profile.socials.youtube}</Text>}
            </View>
          ) : (
            <Text style={styles.body}>No socials added yet.</Text>
          )}
        </Section>

        {!!error && __DEV__ && (
          <View style={styles.errBox}>
            <Text style={styles.errText}>{String(error)}</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.bg },
  scrollContent: { flexGrow: 1, paddingTop: 16, paddingBottom: 32, paddingHorizontal: 16 },
  headerSticky: { backgroundColor: C.bg, paddingTop: 8, paddingBottom: 12 },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 12 },
  title: { color: C.text, fontSize: 20, fontWeight: "700" },
  handle: { color: C.sub2, marginTop: 2 },
  body: { color: C.sub, fontSize: 14 },
  h2: { color: C.text, fontSize: 16, fontWeight: "700" },
  caption: { color: C.sub2, fontSize: 12, marginTop: 6 },
  edit: { color: C.accent, fontWeight: "600" },
  section: { marginBottom: 24 },
  statsRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 12 },
  statItem: { alignItems: "center", minWidth: 90 },
  statValue: { color: C.text, fontSize: 20, fontWeight: "700" },
  statLabel: { color: C.sub2, fontSize: 12, marginTop: 4, textAlign: "center" },
  badgesRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 12 },
  badge: { color: "#C7D2FE", fontSize: 12, backgroundColor: "rgba(99,102,241,0.15)", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 999 },
  elevenRow: { flexDirection: "row", alignItems: "center", marginTop: 12 },
  itemTitle: { color: C.text, fontWeight: "600", fontSize: 16 },
  link: { color: C.accent, fontWeight: "600", marginTop: 8 },
  topRow: { flexDirection: "row", gap: 12, marginTop: 12, flexWrap: "wrap" },
  bottomSpace: { marginBottom: 64 },
  errBox: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#7F1D1D", borderWidth: 1, borderRadius: 12, padding: 8, marginTop: 16 },
  errText: { color: "#fecaca", fontSize: 12 }
});
