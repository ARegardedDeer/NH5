import React from 'react';
import {createNativeStackNavigator} from '@react-navigation/native-stack';

import AnimeListScreen from '../features/anime/screens/AnimeListScreen';
import QuestBoardScreen from '../features/quests/screens/QuestBoardScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';

export type RootStackParamList = {
  Anime: undefined;
  Quests: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();

const AppNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      initialRouteName="Anime"
      screenOptions={{
        headerStyle: {backgroundColor: '#020617'},
        headerTitleStyle: {color: '#f8fafc', fontWeight: '700'},
        headerTintColor: '#38bdf8',
        contentStyle: {backgroundColor: '#020617'},
      }}>
      <Stack.Screen
        name="Anime"
        component={AnimeListScreen}
        options={{title: 'Anime'}}
      />
      <Stack.Screen
        name="Quests"
        component={QuestBoardScreen}
        options={{title: 'Quests'}}
      />
      <Stack.Screen
        name="Profile"
        component={ProfileScreen}
        options={{title: 'Profile'}}
      />
    </Stack.Navigator>
  );
};

export default AppNavigator;
