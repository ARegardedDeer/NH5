import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, StyleSheet, Pressable, FlatList } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { useNavigation } from '@react-navigation/native';
import { supabase, whenAuthed } from '../../db/supabaseClient';
import { useAnimeSearch } from '../../hooks/useAnimeSearch';
import { useAddToList } from '../../hooks/useAddToList';
import { useInvalidateSearchCache } from '../../hooks/useInvalidateSearchCache';
import { useToast } from '../../contexts/ToastContext';
import { InlineSuggestion } from './InlineSuggestion';
import { SearchResultRow } from './SearchResultRow';
import { AnimeDetailDrawer } from './AnimeDetailDrawer';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';
import type { AnimeSearchResult } from '../../hooks/useAnimeSearch';

type SearchMode = 'suggestions' | 'full-results';

interface AddAnimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAnimeSheet = React.forwardRef<BottomSheet, AddAnimeSheetProps>(
  ({ isOpen, onClose }, ref) => {
    const navigation = useNavigation<AppNavigationProp>();
    const [userId, setUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [searchMode, setSearchMode] = useState<SearchMode>('suggestions');
    const [selectedAnime, setSelectedAnime] = useState<AnimeSearchResult | null>(null);
    const inputRef = useRef<TextInput>(null);
    const detailDrawerRef = useRef<BottomSheet>(null);

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
    const { showToast } = useToast();

    // Show 4 suggestions or all results based on mode
    const displayResults = searchMode === 'suggestions'
      ? searchResults?.slice(0, 4)
      : searchResults;

    const handleSheetChange = useCallback((index: number) => {
      if (index === -1) {
        // Sheet closed
        onClose();
        setSearchQuery('');
        setSearchMode('suggestions');
      } else if (index >= 0) {
        // Sheet opened - focus input
        setTimeout(() => {
          inputRef.current?.focus();
        }, 100);
      }
    }, [onClose]);

    const handleSubmitSearch = useCallback(() => {
      // User pressed "Go" on keyboard - show full results
      if (searchQuery.length >= 2) {
        setSearchMode('full-results');
        inputRef.current?.blur(); // Hide keyboard
        // Snap points will update automatically to 95%
      }
    }, [searchQuery]);

  const handleSuggestionPress = useCallback((anime: AnimeSearchResult) => {
    // User tapped a suggestion - close search drawer first
    const searchSheet = (ref as any)?.current;
    if (searchSheet) {
      searchSheet.close();
    }

    setSelectedAnime(anime);

    // Wait for search drawer to close, then open detail drawer to 90%
    setTimeout(() => {
      const detailSheet = detailDrawerRef.current;
      console.log('[AddAnimeSheet] Opening detail drawer, ref exists:', !!detailSheet);
      if (detailSheet) {
        console.log('[AddAnimeSheet] Calling snapToIndex(0) for 90% height');
        detailSheet.snapToIndex(0); // Open to index 0 = 90%
      }
    }, 300);
  }, [ref]);

  const handleResultPress = useCallback((anime: AnimeSearchResult) => {
    // User tapped a result row - close search drawer first
    const searchSheet = (ref as any)?.current;
    if (searchSheet) {
      searchSheet.close();
    }

    setSelectedAnime(anime);

    // Wait for search drawer to close, then open detail drawer to 90%
    setTimeout(() => {
      const detailSheet = detailDrawerRef.current;
      if (detailSheet) {
        detailSheet.snapToIndex(0); // Open to index 0 = 90%
      }
    }, 300);
  }, [ref]);

    const handleCloseDetailDrawer = useCallback(() => {
      detailDrawerRef.current?.close();
      setSelectedAnime(null);
    }, []);

    const handleBackToSuggestions = useCallback(() => {
      setSearchMode('suggestions');
      inputRef.current?.focus();
    }, []);

    const handleAddToList = useCallback(
      async (anime: AnimeSearchResult) => {
        if (!userId) return;

        return new Promise<void>((resolve, reject) => {
          addToListMutation.mutate(
            {
              userId,
              animeId: anime.id,
              status: 'Plan to Watch', // Default to Plan to Watch
              episodesCount: anime.episodes_count,
            },
            {
              onSuccess: () => {
                resolve();
              },
              onError: (error) => {
                showToast({
                  message: 'Failed to add. Try again.',
                  type: 'error',
                  duration: 3000,
                });
                console.error('[AddAnimeSheet] Error:', error);
                reject(error);
              },
            }
          );
        });
      },
      [userId, addToListMutation, showToast]
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

  const renderContent = () => {
      // Empty state (no search yet)
      if (searchQuery.length < 2) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Search for anime</Text>
            <Text style={styles.emptySubtitle}>
              Type at least 2 characters
            </Text>
          </View>
        );
      }

      // Loading state
      if (isLoading) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptySubtitle}>Searching...</Text>
          </View>
        );
      }

      // No results
      if (!searchResults || searchResults.length === 0) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>😕</Text>
            <Text style={styles.emptyTitle}>No results</Text>
            <Text style={styles.emptySubtitle}>
              Try a different search term
            </Text>
          </View>
        );
      }

      // Suggestion mode - inline suggestions
      if (searchMode === 'suggestions') {
        return (
          <View style={styles.suggestionsContainer}>
            {displayResults?.map((anime) => (
              <InlineSuggestion
                key={anime.id}
                title={anime.title}
                query={searchQuery}
                onPress={() => handleSuggestionPress(anime)}
              />
            ))}

            {/* Show "See all X results" if more than 4 */}
            {searchResults.length > 4 && (
              <Pressable
                style={styles.seeAllButton}
                onPress={() => {
                  HapticFeedback.trigger('impactLight');
                  setSearchMode('full-results');
                  // Snap points will update automatically to 95%
                }}
              >
                <Text style={styles.seeAllText}>
                  See all {searchResults.length} results →
                </Text>
              </Pressable>
            )}
          </View>
        );
      }

      // Full results mode - scrollable list with details
      return (
        <FlatList
          data={displayResults}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <SearchResultRow
              anime={item}
              onPress={() => handleResultPress(item)}
              onQuickAdd={() => handleAddToList(item)}
            />
          )}
          contentContainerStyle={styles.resultsList}
          showsVerticalScrollIndicator={false}
        />
      );
    };

    return (
      <>
        <BottomSheet
          ref={ref}
          index={-1}
          snapPoints={searchMode === 'suggestions' ? ['90%'] : ['95%']}
          enablePanDownToClose
          onChange={handleSheetChange}
          backdropComponent={renderBackdrop}
          backgroundStyle={styles.background}
          handleIndicatorStyle={styles.indicator}
        >
        <BottomSheetView style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            {searchMode === 'full-results' && (
              <Pressable
                onPress={handleBackToSuggestions}
                style={styles.backButton}
              >
                <Text style={styles.backButtonText}>←</Text>
              </Pressable>
            )}

            <Text style={styles.title}>
              {searchMode === 'suggestions' ? 'Add Anime' : 'Search Results'}
            </Text>

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

          {/* Search Input */}
          <View
            style={[
              styles.searchContainer,
              searchMode === 'suggestions' &&
                displayResults &&
                displayResults.length > 0 &&
                styles.searchContainerWithSuggestions,
            ]}
          >
            <Text style={styles.searchIcon}>🔍</Text>
            <TextInput
              ref={inputRef}
              style={styles.searchInput}
              placeholder="Search anime..."
              placeholderTextColor="#86868B"
              value={searchQuery}
              onChangeText={(text) => {
                setSearchQuery(text);
                if (searchMode === 'full-results' && text.length < 2) {
                  setSearchMode('suggestions');
                }
              }}
              onSubmitEditing={handleSubmitSearch}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
            />
            {searchQuery.length > 0 && (
              <Pressable
                onPress={() => {
                  setSearchQuery('');
                  setSearchMode('suggestions');
                }}
                style={styles.clearButton}
              >
                <Text style={styles.clearButtonText}>✕</Text>
              </Pressable>
            )}
          </View>

          {/* Results */}
          {renderContent()}
        </BottomSheetView>
      </BottomSheet>

      {/* Detail Drawer */}
      <AnimeDetailDrawer
        ref={detailDrawerRef}
        anime={selectedAnime}
        isOpen={!!selectedAnime}
        onClose={handleCloseDetailDrawer}
        onAddToBacklog={() => {
          if (selectedAnime) {
            handleAddToList(selectedAnime);
          }
        }}
      />
    </>
    );
  }
);

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
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
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  backButtonText: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
  },
  searchContainerWithSuggestions: {
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
    marginBottom: 0,
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
  suggestionsContainer: {
    backgroundColor: '#1A1A2E',
  },
  seeAllButton: {
    paddingVertical: 14,
    paddingHorizontal: 16,
    backgroundColor: '#2A2A3E',
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    marginBottom: 20,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#007AFF',
    textAlign: 'center',
  },
  resultsList: {
    paddingBottom: 40,
    paddingTop: 20,
  },
});
