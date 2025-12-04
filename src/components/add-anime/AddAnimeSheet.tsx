import React, { useRef, useState, useCallback, useEffect } from 'react';
import { View, Text, TextInput, FlatList, StyleSheet, Pressable } from 'react-native';
import BottomSheet, { BottomSheetBackdrop, BottomSheetView } from '@gorhom/bottom-sheet';
import type { BottomSheetBackdropProps } from '@gorhom/bottom-sheet';
import { supabase, whenAuthed } from '../../db/supabaseClient';
import { useAnimeSearch } from '../../hooks/useAnimeSearch';
import { useAddToList } from '../../hooks/useAddToList';
import { SearchResultRow } from './SearchResultRow';
import HapticFeedback from 'react-native-haptic-feedback';

interface AddAnimeSheetProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AddAnimeSheet = React.forwardRef<BottomSheet, AddAnimeSheetProps>(
  ({ isOpen, onClose }, ref) => {
    const [userId, setUserId] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState('');
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
      (animeId: string, status: 'Plan to Watch' | 'Watching') => {
        if (!userId) return;

        addToListMutation.mutate(
          { userId, animeId, status },
          {
            onSuccess: () => {
              // Show success toast (to be implemented)
              console.log(`Added to ${status}`);
            },
          }
        );
      },
      [userId, addToListMutation]
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

    const renderEmptyState = () => {
      if (searchQuery.length < 2) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptyIcon}>🔍</Text>
            <Text style={styles.emptyTitle}>Search for anime</Text>
            <Text style={styles.emptySubtitle}>
              Type at least 2 characters to search
            </Text>
          </View>
        );
      }

      if (isLoading) {
        return (
          <View style={styles.emptyState}>
            <Text style={styles.emptySubtitle}>Searching...</Text>
          </View>
        );
      }

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

      return null;
    };

    return (
      <BottomSheet
        ref={ref}
        index={-1}
        snapPoints={['50%', '90%']}
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

          {/* Search Input */}
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

          {/* Results */}
          {renderEmptyState() || (
            <FlatList
              data={searchResults}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <SearchResultRow
                  anime={item}
                  onSave={() => handleAddToList(item.id, 'Plan to Watch')}
                  onStart={() => handleAddToList(item.id, 'Watching')}
                  isAdding={addToListMutation.isPending}
                />
              )}
              contentContainerStyle={styles.resultsList}
              showsVerticalScrollIndicator={false}
            />
          )}
        </BottomSheetView>
      </BottomSheet>
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A3E',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 20,
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
  resultsList: {
    paddingBottom: 40,
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
