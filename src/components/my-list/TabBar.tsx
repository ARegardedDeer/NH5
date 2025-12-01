import React from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';
import Animated from 'react-native-reanimated';
import HapticFeedback from 'react-native-haptic-feedback';

type Tab = 'active' | 'backlog' | 'archive';

interface TabBarProps {
  selectedTab: Tab;
  onTabChange: (tab: Tab) => void;
  counts?: {
    active: number;
    backlog: number;
    archive: number;
  };
}

export const TabBar: React.FC<TabBarProps> = ({
  selectedTab,
  onTabChange,
  counts,
}) => {
  const tabs: { key: Tab; label: string }[] = [
    { key: 'active', label: 'Active' },
    { key: 'backlog', label: 'Backlog' },
    { key: 'archive', label: 'Archive' },
  ];

  const handleTabPress = (tab: Tab) => {
    if (tab !== selectedTab) {
      HapticFeedback.trigger('impactLight');
      onTabChange(tab);
    }
  };

  return (
    <View style={styles.container}>
      {tabs.map((tab) => {
        const isSelected = selectedTab === tab.key;
        const count = counts?.[tab.key];

        return (
          <Pressable
            key={tab.key}
            style={styles.tab}
            onPress={() => handleTabPress(tab.key)}
          >
            <Text style={[styles.tabLabel, isSelected && styles.tabLabelSelected]}>
              {tab.label}
              {count !== undefined && count > 0 && ` (${count})`}
            </Text>

            {isSelected && (
              <Animated.View style={styles.tabIndicator} />
            )}
          </Pressable>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    backgroundColor: '#1A1A2E',
    borderBottomWidth: 1,
    borderBottomColor: '#2A2A3E',
  },

  tab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    position: 'relative',
  },

  tabLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#86868B',
  },

  tabLabelSelected: {
    color: '#FFFFFF',
  },

  tabIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 2,
    backgroundColor: '#7C3AED',
  },
});
