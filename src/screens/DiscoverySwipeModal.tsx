import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  Pressable,
  ActivityIndicator,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
// @ts-ignore - Icon library type definitions
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useNavigation } from '@react-navigation/native';
import { supabase } from '../db/supabaseClient';
import { useDiscoveryQueue } from '../hooks/useDiscoveryQueue';
import { SwipeCard } from '../components/discovery-swipe/SwipeCard';
import { ActionButtons } from '../components/discovery-swipe/ActionButtons';
import { RatingModal } from '../components/discovery-swipe/RatingModal';
import { currentTheme } from '../styles/discoverySwipeStyles';

interface DiscoverySwipeModalProps {
  visible: boolean;
  onClose: () => void;
}

export function DiscoverySwipeModal({ visible, onClose }: DiscoverySwipeModalProps) {
  const navigation = useNavigation<any>();
  const [userId, setUserId] = useState<string | null>(null);
  const [showRatingModal, setShowRatingModal] = useState(false);
  const [expandedCard, setExpandedCard] = useState(false);
  const preloadedImages = useRef(new Set<string>());

  // Fetch current user
  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        setUserId(session.user.id);
      }
    };
    if (visible) {
      fetchUser();
    }
  }, [visible]);

  const {
    currentCard,
    queue,
    currentIndex,
    queueLength,
    isLoading,
    error,
    handleSwipe,
    refetch,
  } = useDiscoveryQueue(userId || '');

  // Single stable pre-load effect with deduplication
  useEffect(() => {
    if (!queue || queue.length === 0) return;

    // Pre-load current + next 2 cards
    const cardsToPreload = [
      queue[currentIndex],
      queue[currentIndex + 1],
      queue[currentIndex + 2],
    ].filter(Boolean);

    cardsToPreload.forEach((anime) => {
      if (!anime?.thumbnail_url) return;

      // Skip if already pre-loaded
      if (preloadedImages.current.has(anime.thumbnail_url)) return;

      Image.prefetch(anime.thumbnail_url)
        .then(() => {
          preloadedImages.current.add(anime.thumbnail_url);
          console.log('[discovery-swipe] ✓ Pre-loaded:', anime.title);
        })
        .catch((err) => {
          console.log('[discovery-swipe] ✗ Pre-load failed:', anime.title, err);
        });
    });
  }, [currentIndex, queue?.length]); // Only re-run when index or queue length changes

  const handleSkip = async () => {
    await handleSwipe('skip');
  };

  const handleRate = async () => {
    if (!currentCard) return;
    // Open rating modal instead of navigating
    setShowRatingModal(true);
  };

  const handleAdd = async () => {
    await handleSwipe('add');
  };

  const handleCardPress = () => {
    if (!currentCard) return;
    // Toggle card expansion instead of navigating
    setExpandedCard(!expandedCard);
  };

  const handleRatingSubmit = async (rating: number) => {
    if (!currentCard || !userId) return;

    console.log('[discovery-swipe] Submitting rating:', currentCard.title, rating);

    // Save rating to database
    const { error } = await supabase
      .from('ratings')
      .upsert({
        user_id: userId,
        anime_id: currentCard.id,
        score_overall: rating,
      });

    if (error) {
      console.error('[discovery-swipe] Rating error:', error);
    } else {
      console.log('[discovery-swipe] Rating saved successfully');
    }

    // Close rating modal
    setShowRatingModal(false);

    // Record swipe action and move to next card
    await handleSwipe('rate');
  };

  // Reset expansion when card changes
  useEffect(() => {
    setExpandedCard(false);
  }, [currentCard?.id]);

  // Render states
  if (!userId) {
    return (
      <Modal
        visible={visible}
        animationType="slide"
        presentationStyle="fullScreen"
        onRequestClose={onClose}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>Please sign in to use Discovery Swipe</Text>
            <Pressable style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>Close</Text>
            </Pressable>
          </View>
        </SafeAreaView>
      </Modal>
    );
  }

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="fullScreen"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeIcon}>
            <Ionicons name="close" size={28} color={currentTheme.foreground} />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Discovery Swipe</Text>
            <Text style={styles.headerSubtitle}>
              {queueLength} card{queueLength !== 1 ? 's' : ''} remaining
            </Text>
          </View>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <View style={styles.content}>
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color={currentTheme.primary} />
              <Text style={styles.loadingText}>Loading anime...</Text>
            </View>
          )}

          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>Failed to load anime</Text>
              <Pressable style={styles.retryButton} onPress={refetch}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </Pressable>
            </View>
          )}

          {!isLoading && !error && currentCard && (
            <>
              <View style={styles.cardViewport}>
                <SwipeCard
                  anime={currentCard}
                  expanded={expandedCard}
                  onSwipe={async (action) => {
                    if (action === 'skip') await handleSkip();
                    else if (action === 'rate') await handleRate();
                    else if (action === 'add') await handleAdd();
                  }}
                  onPress={handleCardPress}
                  onNavigateToDetail={() => {
                    onClose();
                    navigation.navigate('AnimeDetail', { id: currentCard.id });
                  }}
                />
              </View>
              <View style={styles.actionsContainer}>
                <ActionButtons
                  onSkip={handleSkip}
                  onRate={handleRate}
                  onAdd={handleAdd}
                  disabled={isLoading}
                />
              </View>
            </>
          )}

          {!isLoading && !error && !currentCard && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>🎉</Text>
              <Text style={styles.emptyTitle}>All caught up!</Text>
              <Text style={styles.emptyText}>
                You've seen all available anime. Check back later for more!
              </Text>
              <Pressable style={styles.closeButton} onPress={onClose}>
                <Text style={styles.closeButtonText}>Close</Text>
              </Pressable>
            </View>
          )}
        </View>

        {/* Dev Controls and footer hints temporarily removed */}
      </SafeAreaView>

      {/* Rating Modal */}
      {currentCard && (
        <RatingModal
          anime={currentCard}
          visible={showRatingModal}
          onClose={() => setShowRatingModal(false)}
          onSubmit={handleRatingSubmit}
        />
      )}
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F7',
  },
  cardViewport: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  actionsContainer: {
    paddingBottom: 32,
    paddingTop: 12,
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: currentTheme.border,
  },
  closeIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: currentTheme.foreground,
    letterSpacing: -0.3,
  },
  headerSubtitle: {
    fontSize: 13,
    color: currentTheme.mutedForeground,
    marginTop: 2,
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
  },
  loadingText: {
    fontSize: 16,
    color: currentTheme.mutedForeground,
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 16,
    paddingHorizontal: 40,
  },
  errorText: {
    fontSize: 16,
    color: currentTheme.mutedForeground,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: currentTheme.primary,
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.primaryForeground,
  },
  emptyContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 40,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: currentTheme.foreground,
    letterSpacing: -0.5,
  },
  emptyText: {
    fontSize: 16,
    color: currentTheme.mutedForeground,
    textAlign: 'center',
    lineHeight: 24,
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: currentTheme.primary,
    paddingHorizontal: 32,
    paddingVertical: 12,
    borderRadius: 12,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: currentTheme.primaryForeground,
  },
});
