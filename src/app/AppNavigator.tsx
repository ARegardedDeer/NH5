import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/HomeScreen';
import AnimeListScreen from '../features/anime/screens/AnimeListScreen';
import AnimeDetailScreen from '../features/anime/screens/AnimeDetailScreen';
import PlaceholderScreen from '../features/misc/PlaceholderScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import ElevenPickerScreen from '../features/profile/screens/ElevenPickerScreen';
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

type ProfileStackParamList = {
  ProfileHome: undefined;
  EditProfile: undefined;
  ElevenPicker: undefined;
};

const ProfileStack = createNativeStackNavigator<ProfileStackParamList>();

function ProfileStackNavigator() {
  return (
    <ProfileStack.Navigator>
      <ProfileStack.Screen name="ProfileHome" component={ProfileScreen} options={{ headerShown: false }} />
      <ProfileStack.Screen name="EditProfile" component={EditProfileScreen} options={{ title: 'Edit Profile' }} />
      <ProfileStack.Screen
        name="ElevenPicker"
        component={ElevenPickerScreen}
        options={{ presentation: 'modal', title: 'Pick 11/10' }}
      />
    </ProfileStack.Navigator>
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
            Profile: 'person',
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
      <Tabs.Screen name="Profile" component={ProfileStackNavigator} />
    </Tabs.Navigator>
  );
}
