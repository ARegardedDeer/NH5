import React from 'react';
import { View, Text, Pressable, Image, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import HapticFeedback from 'react-native-haptic-feedback';
import { AppNavigationProp } from '../../types/navigation';

interface ListRowProps {
  anime: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
  subtitle?: string;
  onMenuPress?: () => void;
}

export const ListRow: React.FC<ListRowProps> = ({ anime, subtitle, onMenuPress }) => {
  const navigation = useNavigation<AppNavigationProp>();

  const handlePress = () => {
    HapticFeedback.trigger('impactLight');
    navigation.navigate('AnimeDetail', { animeId: anime.id, title: anime.title });
  };

  const handleMenuPress = () => {
    HapticFeedback.trigger('impactLight');
    onMenuPress?.();
  };

  return (
    <Pressable style={styles.row} onPress={handlePress}>
      <Image
        source={{ uri: anime.thumbnail_url || 'https://via.placeholder.com/50x70?text=No' }}
        style={styles.poster}
        resizeMode="cover"
      />
      <View style={styles.info}>
        <Text style={styles.title} numberOfLines={1}>
          {anime.title}
        </Text>
        {!!subtitle && (
          <Text style={styles.subtitle} numberOfLines={1}>
            {subtitle}
          </Text>
        )}
      </View>
      {onMenuPress && (
        <Pressable
          style={styles.menuButton}
          onPress={handleMenuPress}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Text style={styles.menuButtonText}>⋮</Text>
        </Pressable>
      )}
    </Pressable>
  );
};

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: '#1A1A2E',
  },
  poster: {
    width: 50,
    height: 70,
    borderRadius: 8,
    backgroundColor: '#2A2A3E',
  },
  info: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#86868B',
  },
  menuButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  menuButtonText: {
    fontSize: 20,
    color: '#86868B',
  },
});

export default ListRow;
