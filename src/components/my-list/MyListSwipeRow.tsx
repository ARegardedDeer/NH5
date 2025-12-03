import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, I18nManager } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';

type Direction = 'left' | 'right'; // Swipeable open direction

export interface MyListSwipeRowProps {
  status: string;
  currentEpisode?: number | null;
  lastWatchedAt?: string | null;
  completedAt?: string | null;
  originalCompletedAt?: string | null;
  startedAt?: string | null;
  tab: 'active' | 'backlog' | 'archive';
  children: React.ReactNode;
  onCommit: (payload: {
    nextStatus: string | null;
    dir: Direction;
    reason?: string;
    forceLastWatchedNow?: boolean;
    ensureStartedNow?: boolean;
    ensureCurrentEpisodeMin1?: boolean;
  }) => void;
}

const revealFraction = 0.15;
const commitFraction = 0.55;

export const MyListSwipeRow: React.FC<MyListSwipeRowProps> = ({
  status,
  currentEpisode,
  lastWatchedAt,
  completedAt,
  originalCompletedAt,
  startedAt,
  tab,
  children,
  onCommit,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const [rowWidth, setRowWidth] = useState(320);
  const isRTL = I18nManager.isRTL;
  const [debugPanel, setDebugPanel] = useState<'left' | 'right' | 'closed'>('closed');
  const [debugWillCommit, setDebugWillCommit] = useState<string>('NONE');
  const [debugLastCommit, setDebugLastCommit] = useState<string>('');

  const thresholds = useMemo(() => {
    const reveal = rowWidth * revealFraction;
    const commit = rowWidth * commitFraction;
    return { reveal, commit };
  }, [rowWidth]);

  const effectiveDir = (dir: Direction): Direction => (isRTL ? (dir === 'left' ? 'right' : 'left') : dir);

  const computeAction = (dir: Direction) => {
    const eff = effectiveDir(dir);

    if (tab === 'backlog') {
      if (eff === 'left') return { label: 'Move to Active', color: '#10B981', nextStatus: 'Watching' };
      return { label: 'Drop', color: '#EF4444', nextStatus: 'Dropped' };
    }

    if (tab === 'active') {
      if (eff === 'left') {
        const toPlan = !currentEpisode || currentEpisode <= 1;
        const noWatch = !lastWatchedAt;
        const next = toPlan && noWatch ? 'Plan to Watch' : 'On Hold';
        return { label: next === 'Plan to Watch' ? 'Plan' : 'Pause', color: '#F59E0B', nextStatus: next };
      }
      return { label: 'Complete', color: '#3B82F6', nextStatus: 'Completed' };
    }

    // archive
    if (eff === 'right') {
      // Use Watching to avoid status constraint issues (Rewatching may not be allowed in DB)
      return { label: 'Move Active', color: '#10B981', nextStatus: 'Watching' };
    }
    return { label: 'Drop', color: '#EF4444', nextStatus: 'Dropped' };
  };

  const renderAction = (dir: Direction) => {
    const action = computeAction(dir);
    const alignStyle = dir === 'left' ? styles.actionRight : styles.actionLeft;
    if (__DEV__) {
      console.log(
        dir === 'left'
          ? '[MyListSwipeUI] renderRightActions (revealed when finger swipes RIGHT->LEFT)'
          : '[MyListSwipeUI] renderLeftActions (revealed when finger swipes LEFT->RIGHT)'
      );
    }
    return (
      <View style={[styles.actionContainer, { backgroundColor: action.color }]}>
        <View style={[styles.actionContent, alignStyle]}>
          <Text style={styles.actionLabel}>{action.label}</Text>
          {__DEV__ && (
            <Text style={styles.debugTiny}>
              {dir === 'left' ? 'DEBUG: RIGHT ACTIONS (R→L)' : 'DEBUG: LEFT ACTIONS (L→R)'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const handleOpen = (dir: Direction) => {
    const action = computeAction(dir);
    setDebugOpen(dir, action);
    if (__DEV__) {
      console.log('[MyListSwipe] open direction=', dir);
    }

    // Archive special logic
    if (tab === 'archive') {
      if (dir === 'left') {
        // left swipe (open left) = drop (unless completed)
        if (completedAt || originalCompletedAt) {
          onCommit({ nextStatus: null, dir, reason: 'NOOP_COMPLETED' });
          swipeableRef.current?.close();
          return;
        }
        HapticFeedback.trigger('impactLight');
        onCommit({ nextStatus: 'Dropped', dir });
        swipeableRef.current?.close();
        return;
      }
      if (dir === 'right' && action.nextStatus) {
        // right swipe (open right) = move active
        const nextStatus = action.nextStatus;
        HapticFeedback.trigger('impactLight');
        onCommit({
          nextStatus,
          dir,
          forceLastWatchedNow: true,
          ensureStartedNow: !startedAt,
          ensureCurrentEpisodeMin1: !currentEpisode || currentEpisode < 1,
        });
        swipeableRef.current?.close();
        return;
      }
    }

    if (!action.nextStatus) {
      swipeableRef.current?.close();
      onCommit({ nextStatus: null, dir, reason: 'NO_ACTION' });
      return;
    }

    HapticFeedback.trigger('impactLight');
    onCommit({ nextStatus: action.nextStatus, dir });
    swipeableRef.current?.close();
  };

  const setDebugOpen = (dir: Direction, action: { nextStatus: string | null }) => {
    setDebugPanel(dir === 'left' ? 'left' : 'right');
    setDebugWillCommit(action.nextStatus ?? 'NONE');
    if (__DEV__) {
      console.log('[MyListSwipe] commit', {
        tab,
        physicalGesture: dir === 'left' ? 'R→L' : 'L→R',
        openDirection: dir,
        action: action.nextStatus,
        isRTL,
      });
    }
    setDebugLastCommit(`${dir}:${action.nextStatus ?? 'NONE'}`);
    setTimeout(() => {
      setDebugPanel('closed');
    }, 1200);
  };

  const onLayout = (e: LayoutChangeEvent) => {
    setRowWidth(e.nativeEvent.layout.width || 320);
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderLeftActions={() => renderAction('left')}
      renderRightActions={() => renderAction('right')}
      leftThreshold={thresholds.commit}
      rightThreshold={thresholds.commit}
      onSwipeableOpen={(direction) => {
        if (direction === 'left' || direction === 'right') {
          handleOpen(direction === 'left' ? 'left' : 'right');
        }
      }}
      overshootLeft={false}
      overshootRight={false}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={styles.childrenContainer}
    >
      <View onLayout={onLayout}>
        {children}
        {__DEV__ && (
          <View style={styles.debugOverlay} pointerEvents="none">
            <Text style={styles.debugText}>
              RTL:{String(isRTL)} panel:{debugPanel} will:{debugWillCommit}
            </Text>
            {debugLastCommit ? (
              <Text style={styles.debugText}>last:{debugLastCommit}</Text>
            ) : null}
          </View>
        )}
      </View>
    </Swipeable>
  );
};

const styles = StyleSheet.create({
  swipeContainer: {
    backgroundColor: '#0F1628',
  },
  childrenContainer: {
    backgroundColor: '#1A1A2E',
  },
  actionContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  actionContent: {
    paddingHorizontal: 16,
    flex: 1,
  },
  actionLabel: {
    color: '#FFFFFF',
    fontWeight: '700',
    fontSize: 15,
  },
  actionLeft: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingLeft: 16,
  },
  actionRight: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 16,
  },
  debugTiny: {
    color: '#E5E7EB',
    fontSize: 11,
    marginTop: 2,
  },
  debugOverlay: {
    position: 'absolute',
    top: 6,
    left: 6,
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 8,
  },
  debugText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default MyListSwipeRow;
