import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import HomeScreen from '../features/home/HomeScreen';
import AnimeListScreen from '../features/anime/screens/AnimeListScreen';
import AnimeDetailScreen from '../features/anime/screens/AnimeDetailScreen';
import PlaceholderScreen from '../features/misc/PlaceholderScreen';

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
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Tabs.Navigator screenOptions={{ headerShown: false }}>
        <Tabs.Screen name="Home" component={HomeScreen} />
        <Tabs.Screen name="Discover" component={DiscoverStackNavigator} />
        <Tabs.Screen name="My List" children={() => <PlaceholderScreen title="My List"/>} />
        <Tabs.Screen name="Community" children={() => <PlaceholderScreen title="Community"/>} />
      </Tabs.Navigator>
    </NavigationContainer>
  );
}
