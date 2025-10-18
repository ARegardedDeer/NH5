import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/HomeScreen';
import AnimeListScreen from '../features/anime/screens/AnimeListScreen';
import AnimeDetailScreen from '../features/anime/screens/AnimeDetailScreen';
import PlaceholderScreen from '../features/misc/PlaceholderScreen';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

type DiscoverStackParamList = {
  DiscoverList: undefined;
  AnimeDetail: { id: string; title?: string };
};
const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator>
      <DiscoverStack.Screen name="DiscoverList" component={AnimeListScreen} options={{ title: 'Discover' }}/>
      <DiscoverStack.Screen name="AnimeDetail" component={AnimeDetailScreen} options={({ route }) => ({ title: route.params?.title ?? 'Detail' })}/>
    </DiscoverStack.Navigator>
  );
}

const Tabs = createBottomTabNavigator();

export default function AppNavigator() {
  return (
    <Tabs.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarShowLabel: true,
        tabBarIcon: ({ color, size }) => {
          const map: Record<string, string> = {
            Home: 'home',
            Discover: 'explore',
            'My List': 'bookmark',
            Community: 'forum',
          };
          const name = map[route.name] ?? 'circle';
          return <MaterialIcon name={name} size={size} color={color} />;
        },
      })}
    >
      <Tabs.Screen name="Home" component={HomeScreen} />
      <Tabs.Screen name="Discover" component={DiscoverStackNavigator} />
      <Tabs.Screen name="My List" children={() => <PlaceholderScreen title="My List" />} />
      <Tabs.Screen name="Community" children={() => <PlaceholderScreen title="Community" />} />
    </Tabs.Navigator>
  );
}
