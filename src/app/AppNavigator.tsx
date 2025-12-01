import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import HomeScreen from '../features/home/HomeScreen';
import AnimeDetailScreen from '../features/anime/screens/AnimeDetailScreen';
import PlaceholderScreen from '../features/misc/PlaceholderScreen';
import ProfileScreen from '../features/profile/screens/ProfileScreen';
import EditProfileScreen from '../features/profile/screens/EditProfileScreen';
import ElevenPickerScreen from '../features/profile/screens/ElevenPickerScreen';
import MyListScreen from '../features/my-list/screens/MyListScreen';
import { DiscoverScreen } from '../screens/DiscoverScreen';
// @ts-ignore - Icon library type definitions
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { DiscoverStackParamList, MainTabParamList, RootStackParamList } from '../types/navigation';

const DiscoverStack = createNativeStackNavigator<DiscoverStackParamList>();
function DiscoverStackNavigator() {
  return (
    <DiscoverStack.Navigator>
      <DiscoverStack.Screen
        name="DiscoverList"
        component={DiscoverScreen}
        options={{ title: 'Discover' }}
      />
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

const Tab = createBottomTabNavigator<MainTabParamList>();
const RootStack = createNativeStackNavigator<RootStackParamList>();

function MainTabs() {
  return (
    <Tab.Navigator
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
      <Tab.Screen name="Home" component={HomeScreen} />
      <Tab.Screen
        name="Discover"
        component={DiscoverStackNavigator}
        listeners={({ navigation }) => ({
          tabPress: () => {
            navigation.navigate('Discover', { screen: 'DiscoverList' });
          },
        })}
      />
      <Tab.Screen name="My List" component={MyListScreen} />
      <Tab.Screen name="Community" children={() => <PlaceholderScreen title="Community" />} />
      <Tab.Screen name="Profile" component={ProfileStackNavigator} />
    </Tab.Navigator>
  );
}

export default function AppNavigator() {
  return (
    <RootStack.Navigator>
      <RootStack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <RootStack.Screen
        name="AnimeDetail"
        component={AnimeDetailScreen}
        options={({ route }) => ({
          title: route.params?.title ?? 'Detail',
          headerBackTitleVisible: false,
        })}
      />
    </RootStack.Navigator>
  );
}
