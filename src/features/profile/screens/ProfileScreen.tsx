import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import useProfileData from "../hooks/useProfileData";
import Section from "../../../ui/components/Section";
import ProgressBar from "../../../ui/components/ProgressBar";
import PosterImage from "../../../ui/components/PosterImage";
import HeroBanner from "../components/HeroBanner";
import GridNine from "../components/GridNine";
import ProfileAvatar from "../components/ProfileAvatar";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";

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
        stickyHeaderIndices={[1]}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={
          <RefreshControl tintColor={C.text} refreshing={isLoading} onRefresh={onRefresh} />
        }
      >
        <HeroBanner
          title={data?.banner?.title ?? data?.eleven?.title}
          imageUri={data?.banner?.thumbnail_url ?? data?.eleven?.thumbnail_url ?? null}
        />
        {/* Header */}
        <View style={styles.headerSticky}>
          <View style={styles.headerRow}>
            <ProfileAvatar
              userId={data?.profile?.user_id}
              demoUserId={data?.demoUserId}
              remoteUri={data?.profile?.avatar_url ?? null}
              size={84}
            />
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
        <GridNine items={data?.gridNine ?? []} elevenId={data?.eleven?.id ?? null} />

        {/* Socials */}
        <Section style={styles.bottomSpace}>
          <Text style={styles.h2}>Socials</Text>
          {data?.profile?.showSocials ? (
            <View style={styles.socialIcons}>
              {!!data?.profile?.socials?.youtube && <Icon name="youtube" size={22} color="#fff" />}
              {!!data?.profile?.socials?.twitch && <Icon name="twitch" size={22} color="#fff" />}
              {!!data?.profile?.socials?.x && <Icon name="twitter" size={22} color="#fff" />}
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
  bottomSpace: { marginBottom: 64 },
  socialIcons: { flexDirection: "row", alignItems: "center", gap: 16, paddingHorizontal: 16, marginTop: 8 },
  errBox: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#7F1D1D", borderWidth: 1, borderRadius: 12, padding: 8, marginTop: 16 },
  errText: { color: "#fecaca", fontSize: 12 }
});
