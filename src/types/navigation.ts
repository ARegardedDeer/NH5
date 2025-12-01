/**
 * Navigation Type Definitions
 * Enforce correct parameter names across the app.
 */
import { NavigationProp, RouteProp } from '@react-navigation/native';

export type RootStackParamList = {
  MainTabs: undefined;
  AnimeDetail: { animeId: string; title?: string };
};

export type MainTabParamList = {
  Home: undefined;
  Discover: { screen?: 'DiscoverList' } | undefined;
  MyList: undefined;
  Community: undefined;
  Profile: undefined;
};

export type DiscoverStackParamList = {
  DiscoverList: undefined;
};

// Generic root navigation prop type
export type AppNavigationProp = NavigationProp<RootStackParamList>;

// Screen-specific navigation props
export type AnimeDetailNavigationProp = NavigationProp<RootStackParamList, 'AnimeDetail'>;

// Screen-specific route props
export type AnimeDetailRouteProp = RouteProp<RootStackParamList, 'AnimeDetail'>;
