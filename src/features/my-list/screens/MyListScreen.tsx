import React, { useState, useEffect } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { supabase, whenAuthed } from '../../../db/supabaseClient';
import { useActiveAnime } from '../../../hooks/useActiveAnime';
import { TabBar } from '../../../components/my-list/TabBar';
import { ActiveCard } from '../../../components/my-list/ActiveCard';
import { ActiveRow } from '../../../components/my-list/ActiveRow';
import HapticFeedback from 'react-native-haptic-feedback';

type Tab = 'active' | 'backlog' | 'archive';
type LayoutMode = 'cards' | 'rows';

export const MyListScreen = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>('active');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('cards');

  // Get user ID on mount
  useEffect(() => {
    whenAuthed.then(async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      setAuthReady(true);
    });
  }, []);

  // Active tab query
  const { data: activeAnime, isLoading, error } = useActiveAnime({
    userId: userId ?? undefined,
    enabled: selectedTab === 'active' && authReady,
  });

  const handleTabChange = (tab: Tab) => {
    setSelectedTab(tab);
  };

  const handleToggleLayout = () => {
    HapticFeedback.trigger('impactLight');
    setLayoutMode(prev => prev === 'cards' ? 'rows' : 'cards');
  };

  const handleUpdate = (animeId: string) => {
    console.log('[MyList] Update pressed for:', animeId);
    // TODO: Open Episode Picker Modal
  };

  const handleMenu = (animeId: string) => {
    console.log('[MyList] Menu pressed for:', animeId);
    // TODO: Open Status Change Menu
  };

  const renderActiveContent = () => {
    if (!authReady) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (isLoading) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (error) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.errorText}>Error loading anime</Text>
        </View>
      );
    }

    if (!activeAnime || activeAnime.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>Nothing in progress</Text>
          <Text style={styles.emptyBody}>
            Start a series and we'll track your episode.
          </Text>
        </View>
      );
    }

    // Cards Layout
    if (layoutMode === 'cards') {
      return (
        <Animated.View
          entering={FadeIn.duration(200)}
          exiting={FadeOut.duration(200)}
          layout={Layout.springify()}
        >
          <FlatList
            key="cards-layout"
            data={activeAnime}
            renderItem={({ item }) => (
              <ActiveCard
                anime={item.anime}
                currentEpisode={item.current_episode || 0}
                totalEpisodes={item.total_episodes}
                status={item.status}
                onUpdate={() => handleUpdate(item.anime_id)}
                onMenuPress={() => handleMenu(item.anime_id)}
              />
            )}
            keyExtractor={(item) => item.anime_id}
            numColumns={2}
            columnWrapperStyle={styles.cardRow}
            contentContainerStyle={styles.cardList}
            showsVerticalScrollIndicator={false}
            scrollEnabled={false}
          />
        </Animated.View>
      );
    }

    // Rows Layout
    return (
      <Animated.View
        entering={FadeIn.duration(200)}
        exiting={FadeOut.duration(200)}
        layout={Layout.springify()}
      >
        <FlatList
          key="rows-layout"
          data={activeAnime}
          renderItem={({ item }) => (
            <ActiveRow
              anime={item.anime}
              currentEpisode={item.current_episode || 0}
              totalEpisodes={item.total_episodes}
              status={item.status}
              onMenuPress={() => handleMenu(item.anime_id)}
            />
          )}
          keyExtractor={(item) => item.anime_id}
          contentContainerStyle={styles.rowList}
          showsVerticalScrollIndicator={false}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
        />
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>My List</Text>

        {/* Toggle Layout Button (for comparison) */}
        {selectedTab === 'active' && activeAnime && activeAnime.length > 0 && (
          <Pressable onPress={handleToggleLayout} style={styles.toggleButton}>
            <Text style={styles.toggleButtonText}>
              {layoutMode === 'cards' ? '☰ Rows' : '⊞ Cards'}
            </Text>
          </Pressable>
        )}
      </View>

      {/* Tab Bar */}
      <TabBar
        selectedTab={selectedTab}
        onTabChange={handleTabChange}
        counts={{
          active: activeAnime?.length || 0,
          backlog: 0, // TODO: Get from query
          archive: 0, // TODO: Get from query
        }}
      />

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'active' && renderActiveContent()}

        {selectedTab === 'backlog' && (
          <View style={styles.centerContent}>
            <Text style={styles.placeholderText}>Backlog (Coming Soon)</Text>
          </View>
        )}

        {selectedTab === 'archive' && (
          <View style={styles.centerContent}>
            <Text style={styles.placeholderText}>Archive (Coming Soon)</Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1A1A2E',
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
  },

  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
  },

  toggleButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },

  toggleButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7C3AED',
  },

  scrollView: {
    flex: 1,
  },

  scrollContent: {
    flexGrow: 1,
  },

  // Cards layout
  cardList: {
    paddingHorizontal: 12,
    paddingTop: 20,
    paddingBottom: 100,
  },

  cardRow: {
    justifyContent: 'space-between',
    paddingHorizontal: 8,
  },

  // Rows layout
  rowList: {
    paddingBottom: 100,
  },

  separator: {
    height: 1,
    backgroundColor: '#2A2A3E',
    marginLeft: 82, // Offset for poster width + margin
  },

  // Empty/loading states
  centerContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingTop: 100,
  },

  emptyTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 8,
    textAlign: 'center',
  },

  emptyBody: {
    fontSize: 15,
    color: '#86868B',
    textAlign: 'center',
    lineHeight: 22,
  },

  loadingText: {
    fontSize: 16,
    color: '#86868B',
  },

  errorText: {
    fontSize: 16,
    color: '#EF4444',
  },

  placeholderText: {
    fontSize: 16,
    color: '#86868B',
  },
});

export default MyListScreen;
