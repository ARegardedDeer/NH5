import React, { useState, useEffect } from 'react';
import {
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { useQuery } from '@tanstack/react-query';
import { supabase, whenAuthed } from '../db/supabaseClient';
import { currentTheme, spacing } from '../styles/discoverStyles';
import { SearchBar } from '../components/discover/SearchBar';
import { StaffPicksSection } from '../components/discover/StaffPicksSection';
import { TrendingSection } from '../components/discover/TrendingSection';
import { BecauseYouWatchedSection } from '../components/discover/BecauseYouWatchedSection';
import { RatingCTACard } from '../components/discover/RatingCTACard';
import { GenrePillsSection } from '../components/discover/GenrePillsSection';
import { DiscoverySwipeCTA } from '../components/discover/DiscoverySwipeCTA';
import { DiscoverySwipeModal } from './DiscoverySwipeModal';
import { AppNavigationProp } from '../types/navigation';
import { navigateToAnimeDetail } from '../utils/navigationHelpers';

export function DiscoverScreen() {
  const navigation = useNavigation<AppNavigationProp>();
  const [authReady, setAuthReady] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [swipeModalVisible, setSwipeModalVisible] = useState(false);

  // Wait for auth to be ready
  useEffect(() => {
    whenAuthed.then(async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      setAuthReady(true);
    });
  }, []);

  // Fetch user's rating count
  const { data: ratingsCount } = useQuery({
    queryKey: ['ratings-count', userId],
    enabled: authReady && !!userId,
    queryFn: async () => {
      const { count } = await supabase
        .from('ratings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId);
      return count || 0;
    },
  });

  // Fetch user's top rated anime (for "Because You Watched")
  // TODO: Use topRated to dynamically fetch recommendations
  const { data: _topRated } = useQuery({
    queryKey: ['top-rated', userId],
    enabled: authReady && !!userId,
    queryFn: async () => {
      const { data } = await supabase
        .from('ratings')
        .select('anime_id, score_overall')
        .eq('user_id', userId)
        .order('score_overall', { ascending: false })
        .limit(1);
      return data?.[0];
    },
  });

  const hasRatings = (ratingsCount ?? 0) > 0;
  const needsMoreRatings = (ratingsCount ?? 0) < 10;

  // Navigation handler for anime cards
  const handleAnimePress = (animeId: string) => {
    console.log('[discover] Navigating to AnimeDetail:', animeId);
    navigateToAnimeDetail(navigation, animeId);
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        {/* Sticky Search Bar */}
        <SearchBar />

        {/* Scrollable Content */}
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {/* Discovery Swipe CTA */}
          <DiscoverySwipeCTA onPress={() => setSwipeModalVisible(true)} />

          {/* Staff Picks */}
          <StaffPicksSection onAnimePress={handleAnimePress} />

          {/* Trending Now */}
          <TrendingSection onAnimePress={(anime) => handleAnimePress(anime.id)} />

          {/* Because You Watched (conditional) */}
          {hasRatings && userId && (
            <BecauseYouWatchedSection
              userId={userId}
              onAnimePress={handleAnimePress}
            />
          )}

          {/* Rating CTA (conditional) */}
          {needsMoreRatings && (
            <RatingCTACard ratingsCount={ratingsCount ?? 0} />
          )}

          {/* Genre Pills */}
          <GenrePillsSection />
        </ScrollView>
      </View>

      {/* Discovery Swipe Modal */}
      <DiscoverySwipeModal
        visible={swipeModalVisible}
        onClose={() => setSwipeModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: currentTheme.background,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.xxl,
  },
});
