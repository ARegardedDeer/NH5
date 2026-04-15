import React, { useEffect } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { ScrollView, View, Text, RefreshControl, StyleSheet } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { AppNavigationProp } from "../../../types/navigation";
import { navigateToAnimeDetail } from "../../../utils/navigationHelpers";
import useProfileData from "../hooks/useProfileData";
import { useProfileStats } from "../../../hooks/useProfileStats";
import HeroBanner from "../components/HeroBanner";
import GridNine from "../components/GridNine";
import ProfileHeader from "../components/ProfileHeader";
import StatsSection from "../components/StatsSection";
import XpProgressBar from "../components/XpProgressBar";
import MostRewatchedSection from "../components/MostRewatchedSection";

const C = {
  bg: "#0F0D1A",
  text: "#FFFFFF",
};

export default function ProfileScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const { data, isLoading, refetch, error } = useProfileData();
  const { data: profileStats } = useProfileStats();

  useEffect(() => {
    if (__DEV__) {
      import('../../../dev/schemaGuard').then(m => m.runSchemaGuard());
    }
  }, []);

  const onRefresh = React.useCallback(() => { refetch(); }, [refetch]);

  const topList = Array.isArray(data?.topList) ? data!.topList : [];
  const featured = data?.banner ?? topList[0] ?? data?.eleven ?? null;
  const featuredId = featured?.id ?? null;
  const featuredTitle = featured?.title ?? '';
  const featuredThumbnail = featured?.thumbnail_url ?? undefined;
  const gridItems = topList.filter(a => a?.id !== featuredId).slice(0, 9);

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

        {Array.isArray(data?.badges) && data.badges.length > 0 && (
          <View style={styles.badgesRow}>
            {data.badges.slice(0, 3).map((badge, idx) => (
              <View key={badge.badge_id ?? badge.id ?? idx} style={styles.badgePill}>
                <Text style={styles.badgeText}>
                  {badge.badge_label ?? badge.label ?? badge.name ?? 'badge'}
                </Text>
              </View>
            ))}
          </View>
        )}

        {featuredThumbnail ? (
          <HeroBanner title={featuredTitle} imageUri={featuredThumbnail} />
        ) : null}

        <GridNine
          items={gridItems}
          elevenId={data?.eleven?.id}
          onPressItem={(id) => navigateToAnimeDetail(navigation, id)}
        />

        {profileStats && (
          <View style={styles.section}>
            <XpProgressBar
              xpCurrent={profileStats.xpCurrent}
              xpToNext={profileStats.xpToNext}
            />
          </View>
        )}

        {profileStats && (
          <View style={styles.section}>
            <StatsSection stats={profileStats} />
          </View>
        )}

        {profileStats && profileStats.mostRewatched.length > 0 && (
          <View style={styles.section}>
            <MostRewatchedSection data={profileStats.mostRewatched} />
          </View>
        )}

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
  root: {
    flex: 1,
    backgroundColor: C.bg,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 32,
  },
  scrollContent: { flexGrow: 1 },
  section: { marginTop: 16, marginBottom: 16 },
  badgesRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  badgePill: {
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 16,
    backgroundColor: "rgba(201,196,255,0.12)",
  },
  badgeText: {
    color: "#C9C4FF",
    fontSize: 13,
    fontWeight: "500",
  },
  errBox: { backgroundColor: "rgba(239,68,68,0.15)", borderColor: "#7F1D1D", borderWidth: 1, borderRadius: 12, padding: 8, marginTop: 16 },
  errText: { color: "#fecaca", fontSize: 12 },
});
