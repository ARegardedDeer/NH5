import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { supabase, whenAuthed } from '../../db/supabaseClient';
import { useAnimeSearch } from '../../hooks/useAnimeSearch';
import { useAddToList } from '../../hooks/useAddToList';
import { useInvalidateSearchCache } from '../../hooks/useInvalidateSearchCache';
import { SearchDropdown } from './SearchDropdown';
import { AnimeActionModal } from './AnimeActionModal';
import HapticFeedback from 'react-native-haptic-feedback';

interface AddAnimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAnimeSheet = React.forwardRef<BottomSheet, AddAnimeSheetProps>(
  ({ isOpen, onClose }, ref) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [selectedAnime, setSelectedAnime] = useState<any>(null);
    const [showActionModal, setShowActionModal] = useState(false);
    const inputRef = useRef<TextInput>(null);

    // Get user ID
    useEffect(() => {
      whenAuthed.then(async () => {
        const { data } = await supabase.auth.getUser();
        setUserId(data?.user?.id ?? null);
      });
    }, []);

    const { data: searchResults, isLoading } = useAnimeSearch(searchQuery, {
      enabled: isOpen,
    });

    const addToListMutation = useAddToList();
    const invalidateSearchCache = useInvalidateSearchCache();

    const handleSelectResult = useCallback((anime: any) => {
      setSelectedAnime(anime);
      setShowActionModal(true);
    }, []);

    const handleSheetChange = useCallback((index: number) => {
      if (index === -1) {
        // Sheet closed
        onClose();
        setSearchQuery('');
      } else if (index >= 0) {
        // Sheet opened - focus input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }, [onClose]);

    const handleAddToList = useCallback(
      (status: 'Plan to Watch' | 'Watching') => {
        if (!userId || !selectedAnime) return;

        addToListMutation.mutate(
          {
            userId,
            animeId: selectedAnime.id,
            status,
            episodesCount: selectedAnime.episodes_count,
          },
          {
            onSuccess: () => {
              const action = status === 'Watching' ? 'Started watching' : 'Added to backlog';
              console.log(`✅ ${action}: ${selectedAnime.title}`);
              // Close modal after successful add
              setShowActionModal(false);
              setSelectedAnime(null);
              // Clear search
              setSearchQuery('');
              // TODO: Show success toast
            },
          }
        );
      },
      [userId, selectedAnime, addToListMutation]
    );

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop
          {...props}
          disappearsOnIndex={-1}
          appearsOnIndex={0}
          opacity={0.5}
          onPress={() => {
            HapticFeedback.trigger('impactLight');
            onClose();
          }}
        />
      ),
      [onClose]
    );

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={['50%']}
          enablePanDownToClose
          onChange={handleSheetChange}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.background}
          handleIndicatorStyle={styles.indicator}
        >
          <BottomSheetView style={styles.content}>
            {/* Header */}
            <View style={styles.header}>
              <Text style={styles.title}>Add Anime</Text>
              <View style={styles.headerActions}>
                {/* Debug: Clear cache button (remove in production) */}
                <Pressable
                  onPress={() => {
                    HapticFeedback.trigger('impactMedium');
                    invalidateSearchCache();
                    console.log('[AddAnimeSheet] 🗑️ Cache cleared manually');
                  }}
                  style={styles.debugButton}
                >
                  <Text style={styles.debugButtonText}>🗑️</Text>
                </Pressable>
                <Pressable
                  onPress={() => {
                    HapticFeedback.trigger('impactLight');
                    onClose();
                  }}
                  style={styles.closeButton}
                >
                  <Text style={styles.closeButtonText}>✕</Text>
                </Pressable>
              </View>
            </View>

            {/* Search Input Container (relative positioning for dropdown) */}
            <View style={styles.searchWrapper}>
              <View style={styles.searchContainer}>
                <Text style={styles.searchIcon}>🔍</Text>
                <TextInput
                  ref={inputRef}
                  style={styles.searchInput}
                  placeholder="Search anime..."
                  placeholderTextColor="#86868B"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="search"
                />
                {searchQuery.length > 0 && (
                  <Pressable
                    onPress={() => setSearchQuery('')}
                    style={styles.clearButton}
                  >
                    <Text style={styles.clearButtonText}>✕</Text>
                  </Pressable>
                )}
              </View>

              {/* Dropdown appears below search bar */}
              {searchQuery.length >= 2 && (
                <SearchDropdown
                  results={searchResults || []}
                  isLoading={isLoading}
                  onSelectResult={handleSelectResult}
                  searchQuery={searchQuery}
                  maxResults={8}
                />
              )}
            </View>

            {/* Empty state when no search query */}
            {searchQuery.length < 2 && (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>🔍</Text>
                <Text style={styles.emptyTitle}>Search for anime</Text>
                <Text style={styles.emptySubtitle}>
                  Type at least 2 characters to see suggestions
                </Text>
              </View>
            )}
          </BottomSheetView>
        </BottomSheet>

        {/* Action modal */}
        <AnimeActionModal
          visible={showActionModal}
          anime={selectedAnime}
          onClose={() => {
            setShowActionModal(false);
            setSelectedAnime(null);
          }}
          onSave={() => handleAddToList('Plan to Watch')}
          onStart={() => handleAddToList('Watching')}
          isAdding={addToListMutation.isPending}
        />
      </>
    );
  }
);

const styles = StyleSheet.create({
  background: {
    backgroundColor: '#1A1A2E',
  },
  indicator: {
    backgroundColor: '#86868B',
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  debugButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#7C3AED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  debugButtonText: {
    fontSize: 14,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A3E',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 18,
    color: '#86868B',
  },
  searchWrapper: {
    position: 'relative',
    marginBottom: 20,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  searchIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#FFFFFF',
  },
  clearButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearButtonText: {
    fontSize: 16,
    color: '#86868B',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 15,
    color: '#86868B',
    textAlign: 'center',
  },
});
