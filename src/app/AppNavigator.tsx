import React from 'react';
import { NavigationContainer, DefaultTheme, DarkTheme } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useColorScheme } from 'react-native';
import AnimeListScreen from '../features/anime/screens/AnimeListScreen';

const Stack = createNativeStackNavigator();

export default function AppNavigator() {
  const scheme = useColorScheme();
  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <Stack.Navigator>
        <Stack.Screen name="Anime" component={AnimeListScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
