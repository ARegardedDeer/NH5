import React, { useState, useEffect, useRef } from 'react';
import { View, Text, ScrollView, StyleSheet, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Animated, { FadeIn, FadeOut, Layout } from 'react-native-reanimated';
import { useNavigation } from '@react-navigation/native';
import BottomSheet from '@gorhom/bottom-sheet';
import { supabase, whenAuthed } from '../../../db/supabaseClient';
import { useActiveAnime } from '../../../hooks/useActiveAnime';
import { useMyListByStatus } from '../../../hooks/useMyListByStatus';
import { navigateToAnimeDetail } from '../../../utils/navigationHelpers';
import { EpisodePickerModal } from '../../../components/continue-watching/EpisodePickerModal';
import { TabBar } from '../../../components/my-list/TabBar';
import { ActiveCard } from '../../../components/my-list/ActiveCard';
import { ActiveRow } from '../../../components/my-list/ActiveRow';
import { ListRow } from '../../../components/my-list/ListRow';
import { MyListSwipeRow } from '../../../components/my-list/MyListSwipeRow';
import UndoToast from '../../../components/common/UndoToast';
import { FloatingActionButton } from '../../../components/shared/FloatingActionButton';
import { AddAnimeSheet } from '../../../components/add-anime/AddAnimeSheet';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../../types/navigation';
import { useUpdateListStatus } from '../../../hooks/useUpdateListStatus';

type Tab = 'active' | 'backlog' | 'archive';
type LayoutMode = 'cards' | 'rows';
type BacklogFilter = 'want' | 'paused';
type ArchiveFilter = 'completed' | 'dropped';
type ActiveItem = {
  anime_id: string;
  anime: any;
  current_episode: number | null;
  total_episodes: number | null;
  status: string;
  last_watched_at?: string | null;
  completed_at?: string | null;
  original_completed_at?: string | null;
  started_at?: string | null;
};

export const MyListScreen = () => {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [selectedTab, setSelectedTab] = useState<Tab>('active');
  const [layoutMode, setLayoutMode] = useState<LayoutMode>('cards');
  const [backlogFilter, setBacklogFilter] = useState<BacklogFilter>('want');
  const [archiveFilter, setArchiveFilter] = useState<ArchiveFilter>('completed');
  const [updatingItem, setUpdatingItem] = useState<ActiveItem | null>(null);
  const [isAddSheetOpen, setIsAddSheetOpen] = useState(false);
  const navigation = useNavigation<AppNavigationProp>();
  const updateStatusMutation = useUpdateListStatus();
  const addSheetRef = useRef<BottomSheet>(null);
  const [undoState, setUndoState] = useState<{
    visible: boolean;
    message: string;
    animeId: string;
    prevStatus: string;
    prevCompletedAt?: string | null;
    prevOriginalCompletedAt?: string | null;
    prevLastWatchedAt?: string | null;
    allowUndo?: boolean;
  } | null>(null);

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

  // Backlog queries
  const { data: backlogWant, isLoading: backlogWantLoading } = useMyListByStatus({
    userId: userId ?? undefined,
    statuses: ['Plan to Watch'],
    order: [{ column: 'created_at', ascending: false }],
    enabled: authReady,
  });

  const { data: backlogPaused, isLoading: backlogPausedLoading } = useMyListByStatus({
    userId: userId ?? undefined,
    statuses: ['On Hold'],
    order: [{ column: 'updated_at', ascending: false }],
    enabled: authReady,
  });

  // Archive queries
  const { data: archiveCompleted, isLoading: archiveCompletedLoading } = useMyListByStatus({
    userId: userId ?? undefined,
    statuses: ['Completed'],
    order: [
      { column: 'completed_at', ascending: false },
      { column: 'updated_at', ascending: false },
    ],
    enabled: authReady,
  });

  const { data: archiveDropped, isLoading: archiveDroppedLoading } = useMyListByStatus({
    userId: userId ?? undefined,
    statuses: ['Dropped'],
    order: [{ column: 'updated_at', ascending: false }],
    enabled: authReady,
  });

  const handleTabChange = (tab: Tab) => {
    setSelectedTab(tab);
  };

  const handleToggleLayout = () => {
    HapticFeedback.trigger('impactLight');
    setLayoutMode(prev => prev === 'cards' ? 'rows' : 'cards');
  };

  const handleUpdate = (item: ActiveItem) => {
    if (!item) return;
    setUpdatingItem(item);
  };

  const handleStatusChange = (
    item: ActiveItem,
    payload: {
      nextStatus: string | null;
      dir: 'left' | 'right';
      reason?: string;
      forceLastWatchedNow?: boolean;
      ensureStartedNow?: boolean;
      ensureCurrentEpisodeMin1?: boolean;
    }
  ) => {
    if (!userId) return;

    const { nextStatus, reason } = payload;

    if (!nextStatus) {
      if (reason === 'NOOP_COMPLETED') {
        setUndoState({
          visible: true,
          message: "Already completed — can’t drop",
          animeId: item.anime_id,
          prevStatus: item.status,
          allowUndo: false,
        });
      }
      return;
    }

    console.log('[MyListSwipe] commit', {
      tab: selectedTab,
      dir: payload.dir,
      from: item.status,
      to: nextStatus,
      animeId: item.anime_id,
    });

    setUndoState({
      visible: true,
      message: `Moved to ${nextStatus} — Undo`,
      animeId: item.anime_id,
      prevStatus: item.status,
      prevCompletedAt: item.completed_at,
      prevOriginalCompletedAt: item.original_completed_at,
      prevLastWatchedAt: item.last_watched_at,
    });

    updateStatusMutation.mutate({
      userId,
      animeId: item.anime_id,
      newStatus: nextStatus,
      forceLastWatchedNow: payload.forceLastWatchedNow,
      ensureStartedNow: payload.ensureStartedNow,
      ensureCurrentEpisodeMin1: payload.ensureCurrentEpisodeMin1,
    });
  };

  const handleUndo = () => {
    if (!undoState || !userId) return;
    console.log('[MyListSwipe] undo', undoState);

    if (undoState.allowUndo === false) {
      setUndoState(null);
      return;
    }

    updateStatusMutation.mutate({
      userId,
      animeId: undoState.animeId,
      newStatus: undoState.prevStatus,
      overrideCompletedAt: undoState.prevCompletedAt,
      overrideOriginalCompletedAt: undoState.prevOriginalCompletedAt,
      overrideLastWatchedAt: undoState.prevLastWatchedAt,
    });

    setUndoState(null);
  };

  const handleInfo = (animeId: string, title?: string) => {
    navigateToAnimeDetail(navigation, animeId, title);
  };

  const handleOpenAddSheet = () => {
    setIsAddSheetOpen(true);
    // Open to index 0 (90% - only snap point in suggestions mode)
    addSheetRef.current?.snapToIndex(0);
  };

  const handleCloseAddSheet = () => {
    setIsAddSheetOpen(false);
    addSheetRef.current?.close();
  };

  const renderBacklogContent = () => {
    const loading = backlogWantLoading || backlogPausedLoading;
    const items = backlogFilter === 'want' ? backlogWant : backlogPaused;
    const emptyTitle = backlogFilter === 'want' ? 'Nothing here yet' : 'Nothing paused';
    const emptySubtitle = backlogFilter === 'want'
      ? 'Add from Discover'
      : 'Resume or move shows here';

    if (loading || !authReady) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!items || items.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptySubtitle}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <MyListSwipeRow
            status={item.status}
            currentEpisode={item.current_episode}
            lastWatchedAt={item.last_watched_at}
            completedAt={item.completed_at}
            originalCompletedAt={item.original_completed_at}
            startedAt={item.started_at}
            tab="backlog"
            onCommit={(payload) => handleStatusChange(item as ActiveItem, payload)}
          >
            <ListRow
              anime={item.anime}
              subtitle={item.status}
              onMenuPress={() => handleInfo(item.anime_id, item.anime?.title)}
            />
          </MyListSwipeRow>
        )}
        keyExtractor={(item) => item.anime_id}
        contentContainerStyle={styles.rowList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    );
  };

  const renderArchiveContent = () => {
    const loading = archiveCompletedLoading || archiveDroppedLoading;
    const items = archiveFilter === 'completed' ? archiveCompleted : archiveDropped;
    const emptyTitle = archiveFilter === 'completed' ? 'Finish a show to see it here' : 'Nothing dropped';
    const emptySubtitle = archiveFilter === 'completed'
      ? 'Completed shows will appear here'
      : 'Shows you drop will appear here';

    if (loading || !authReady) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      );
    }

    if (!items || items.length === 0) {
      return (
        <View style={styles.centerContent}>
          <Text style={styles.emptyTitle}>{emptyTitle}</Text>
          <Text style={styles.emptyBody}>{emptySubtitle}</Text>
        </View>
      );
    }

    return (
      <FlatList
        data={items}
        renderItem={({ item }) => (
          <MyListSwipeRow
            status={item.status}
            currentEpisode={item.current_episode}
            lastWatchedAt={item.last_watched_at}
            completedAt={item.completed_at}
            originalCompletedAt={item.original_completed_at}
            startedAt={item.started_at}
            tab="archive"
            onCommit={(payload) => handleStatusChange(item as ActiveItem, payload)}
          >
            <ListRow
              anime={item.anime}
              subtitle={item.status}
              onMenuPress={() => handleInfo(item.anime_id, item.anime?.title)}
            />
          </MyListSwipeRow>
        )}
        keyExtractor={(item) => item.anime_id}
        contentContainerStyle={styles.rowList}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        scrollEnabled={false}
      />
    );
  };

  const renderSubFilter = () => {
    if (selectedTab === 'backlog') {
      return (
        <View style={styles.subTabContainer}>
          {(['want', 'paused'] as BacklogFilter[]).map((key) => {
            const label = key === 'want' ? 'Want' : 'Paused';
            const isSelected = backlogFilter === key;
            return (
              <Pressable
                key={key}
                style={[styles.subTab, isSelected && styles.subTabSelected]}
                onPress={() => {
                  if (backlogFilter !== key) {
                    HapticFeedback.trigger('impactLight');
                    setBacklogFilter(key);
                  }
                }}
              >
                <Text style={[styles.subTabLabel, isSelected && styles.subTabLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    if (selectedTab === 'archive') {
      return (
        <View style={styles.subTabContainer}>
          {(['completed', 'dropped'] as ArchiveFilter[]).map((key) => {
            const label = key === 'completed' ? 'Completed' : 'Dropped';
            const isSelected = archiveFilter === key;
            return (
              <Pressable
                key={key}
                style={[styles.subTab, isSelected && styles.subTabSelected]}
                onPress={() => {
                  if (archiveFilter !== key) {
                    HapticFeedback.trigger('impactLight');
                    setArchiveFilter(key);
                  }
                }}
              >
                <Text style={[styles.subTabLabel, isSelected && styles.subTabLabelSelected]}>
                  {label}
                </Text>
              </Pressable>
            );
          })}
        </View>
      );
    }

    return null;
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
                onUpdate={() => handleUpdate(item as ActiveItem)}
                onInfoPress={() => handleInfo(item.anime_id, item.anime?.title)}
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
            <MyListSwipeRow
              status={item.status}
              currentEpisode={item.current_episode}
              lastWatchedAt={item.last_watched_at}
              completedAt={item.completed_at}
              originalCompletedAt={item.original_completed_at}
              startedAt={item.started_at}
              tab="active"
              onCommit={(payload) => handleStatusChange(item as ActiveItem, payload)}
            >
              <ActiveRow
                anime={item.anime}
                currentEpisode={item.current_episode || 0}
                totalEpisodes={item.total_episodes}
                status={item.status}
                onUpdatePress={() => handleUpdate(item as ActiveItem)}
                onInfoPress={() => handleInfo(item.anime_id, item.anime?.title)}
              />
            </MyListSwipeRow>
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
          backlog: (backlogWant?.length || 0) + (backlogPaused?.length || 0),
          archive: (archiveCompleted?.length || 0) + (archiveDropped?.length || 0),
        }}
      />

      {renderSubFilter()}

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {selectedTab === 'active' && renderActiveContent()}

        {selectedTab === 'backlog' && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
          >
            {renderBacklogContent()}
          </Animated.View>
        )}

        {selectedTab === 'archive' && (
          <Animated.View
            entering={FadeIn.duration(200)}
            exiting={FadeOut.duration(200)}
            layout={Layout.springify()}
          >
            {renderArchiveContent()}
          </Animated.View>
        )}
      </ScrollView>

      {/* Episode Picker Modal for Active items */}
      {updatingItem && userId && (
        <EpisodePickerModal
          visible={!!updatingItem}
          onClose={() => setUpdatingItem(null)}
          animeId={updatingItem.anime_id}
          animeTitle={updatingItem.anime?.title || 'Anime'}
          currentEpisode={updatingItem.current_episode || 0}
          totalEpisodes={updatingItem.total_episodes}
          hasSpecials={updatingItem.anime?.has_specials || false}
          userId={userId}
        />
      )}

      <UndoToast
        visible={!!undoState?.visible}
        message={undoState?.message || ''}
        onUndo={handleUndo}
        onHide={() => setUndoState(null)}
      />

      {/* Floating Action Button */}
      <FloatingActionButton
        onPress={handleOpenAddSheet}
        isExpanded={isAddSheetOpen}
      />

      {/* Add Anime Bottom Sheet */}
      <AddAnimeSheet
        ref={addSheetRef}
        isOpen={isAddSheetOpen}
        onClose={handleCloseAddSheet}
      />
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

  subTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 10,
    gap: 8,
    backgroundColor: '#1A1A2E',
  },

  subTab: {
    flex: 1,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#2A2A3E',
    alignItems: 'center',
  },

  subTabSelected: {
    backgroundColor: '#2A2A3E',
    borderColor: '#7C3AED',
  },

  subTabLabel: {
    color: '#86868B',
    fontWeight: '600',
  },

  subTabLabelSelected: {
    color: '#FFFFFF',
  },
});

export default MyListScreen;
