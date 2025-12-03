import React, { useMemo, useRef, useState } from 'react';
import { View, Text, StyleSheet, LayoutChangeEvent, I18nManager } from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import HapticFeedback from 'react-native-haptic-feedback';

type Direction = 'left' | 'right'; // Swipeable open direction
type SwipeDir = 'leftward' | 'rightward'; // physical gesture

export interface MyListSwipeRowProps {
  tab: 'active' | 'backlog' | 'archive';
  status: string;
  currentEpisode?: number | null;
  lastWatchedAt?: string | null;
  completedAt?: string | null;
  originalCompletedAt?: string | null;
  startedAt?: string | null;
  rewatchCount?: number | null;
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
const commitFraction = 0.33; // ~33% snap
const DEBUG_FLAG = __DEV__;

const resolveAction = (
  tab: 'active' | 'backlog' | 'archive',
  status: string,
  swipeDir: SwipeDir,
  ctx: { completedAt?: string | null; originalCompletedAt?: string | null; rewatchCount?: number | null }
) => {
  const completedBefore =
    !!ctx.completedAt || !!ctx.originalCompletedAt || (ctx.rewatchCount ?? 0) > 0;

  if (tab === 'backlog') {
    if (swipeDir === 'leftward') {
      return { label: 'Move Active', color: '#10B981', nextStatus: 'Watching' };
    }
    return {
      label: completedBefore ? 'Archive (Completed)' : 'Archive (Drop)',
      color: '#EF4444',
      nextStatus: completedBefore ? 'Completed' : 'Dropped',
    };
  }

  if (tab === 'archive') {
    if (status === 'Dropped') {
      if (swipeDir === 'leftward') {
        return { label: 'Backlog', color: '#10B981', nextStatus: 'Plan to Watch' };
      }
      return { label: 'No Action', color: '#4B5563', nextStatus: null };
    }
    if (status === 'Completed') {
      if (swipeDir === 'rightward') {
        return { label: 'Rewatch', color: '#3B82F6', nextStatus: 'Rewatching' };
      }
      return { label: 'No Action', color: '#4B5563', nextStatus: null };
    }
    return { label: 'No Action', color: '#4B5563', nextStatus: null };
  }

  return { label: 'No Action', color: '#4B5563', nextStatus: null };
};

export const MyListSwipeRow: React.FC<MyListSwipeRowProps> = ({
  tab,
  status,
  currentEpisode,
  lastWatchedAt,
  completedAt,
  originalCompletedAt,
  startedAt,
  rewatchCount,
  children,
  onCommit,
}) => {
  const swipeableRef = useRef<Swipeable>(null);
  const [rowWidth, setRowWidth] = useState(320);
  const isRTL = I18nManager.isRTL;
  const [debugVisible, setDebugVisible] = useState(false);
  const [debugState, setDebugState] = useState({
    panel: 'closed',
    will: 'NONE',
    dx: 0,
    thresholdPx: Math.round(rowWidth * commitFraction),
    last: '',
    dir: 'none',
  });

  const thresholds = useMemo(() => {
    const reveal = rowWidth * revealFraction;
    const commit = rowWidth * commitFraction;
    return { reveal, commit };
  }, [rowWidth]);

  const physicalDir = (openDir: Direction): SwipeDir => {
    const base: SwipeDir = openDir === 'left' ? 'rightward' : 'leftward';
    return isRTL ? (base === 'rightward' ? 'leftward' : 'rightward') : base;
  };

  const actionForOpen = (openDir: Direction) => {
    const phys = physicalDir(openDir);
    return resolveAction(tab, status, phys, { completedAt, originalCompletedAt, rewatchCount });
  };

  const renderAction = (openDir: Direction) => {
    const action = actionForOpen(openDir);
    const alignStyle = openDir === 'left' ? styles.actionLeft : styles.actionRight;
    const textAlign = openDir === 'left' ? styles.textLeft : styles.textRight;
    if (DEBUG_FLAG) {
      console.log(
        openDir === 'left'
          ? '[MyListSwipeUI] renderLeftActions (finger L->R)'
          : '[MyListSwipeUI] renderRightActions (finger R->L)'
      );
    }
    return (
      <View style={[styles.actionContainer, { backgroundColor: action.color }]}>
        <View style={[styles.actionContent, alignStyle]}>
          <Text style={[styles.actionLabel, textAlign]}>{action.label}</Text>
          {DEBUG_FLAG && (
            <Text style={[styles.debugTiny, textAlign]}>
              {openDir === 'left' ? 'DEBUG: LEFT ACTIONS (L→R)' : 'DEBUG: RIGHT ACTIONS (R→L)'}
            </Text>
          )}
        </View>
      </View>
    );
  };

  const handleOpen = (openDir: Direction) => {
    const phys = physicalDir(openDir);
    const action = actionForOpen(openDir);
    const will = action.nextStatus ?? 'NONE';
    if (DEBUG_FLAG) {
      console.log('[MyListSwipe] open direction=', openDir, 'phys=', phys, 'action=', will, 'RTL=', isRTL);
    }
    setDebugState((d) => ({
      ...d,
      panel: openDir === 'left' ? 'left' : 'right',
      will,
      dir: phys,
      last: `${openDir}:${will}`,
      thresholdPx: Math.round(rowWidth * commitFraction),
    }));

    if (!action.nextStatus) {
      swipeableRef.current?.close();
      onCommit({ nextStatus: null, dir: openDir, reason: 'NO_ACTION' });
      return;
    }

    HapticFeedback.trigger('impactLight');

    const payload: Parameters<typeof onCommit>[0] = {
      nextStatus: action.nextStatus,
      dir: openDir,
    };

    if (tab === 'archive' && action.nextStatus === 'Rewatching') {
      payload.forceLastWatchedNow = true;
      payload.ensureStartedNow = !startedAt;
      payload.ensureCurrentEpisodeMin1 = !currentEpisode || currentEpisode < 1;
    }

    onCommit(payload);
    swipeableRef.current?.close();
    setTimeout(() => setDebugState((d) => ({ ...d, panel: 'closed' })), 1200);
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
          handleOpen(direction);
        }
      }}
      overshootLeft={false}
      overshootRight={false}
      containerStyle={styles.swipeContainer}
      childrenContainerStyle={styles.childrenContainer}
      onSwipeableWillOpen={() => setDebugVisible(true)}
      onSwipeableClose={() => setDebugVisible(false)}
    >
      <View onLayout={onLayout}>
        {children}
        {DEBUG_FLAG && debugVisible && (
          <View style={styles.debugOverlay} pointerEvents="none">
            <Text style={styles.debugText}>
              tab:{tab} status:{status}
            </Text>
            <Text style={styles.debugText}>
              dir:{debugState.dir} will:{debugState.will} thrPx:{debugState.thresholdPx}
            </Text>
            {debugState.last ? <Text style={styles.debugText}>last:{debugState.last}</Text> : null}
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
  textLeft: {
    textAlign: 'left',
  },
  textRight: {
    textAlign: 'right',
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
    right: 6,
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
