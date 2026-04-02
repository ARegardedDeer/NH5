import React, { useEffect } from 'react';
import { StatusBar } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DarkTheme } from '@react-navigation/native';
import { QueryClientProvider } from '@tanstack/react-query';
import AsyncStorage from '@react-native-async-storage/async-storage';

import { queryClient } from './state/queryClient';
import AppNavigator from './app/AppNavigator';
import { ToastProvider } from './contexts/ToastContext';

const DEV = __DEV__;

// Purge stale v1 rating cache keys on app startup
async function purgeStaleCacheKeys() {
  try {
    const allKeys = await AsyncStorage.getAllKeys();
    const v1RatingKeys = allKeys.filter(key => key.startsWith('nh5::user_rating::') && key.endsWith('::v1'));
    if (v1RatingKeys.length > 0) {
      await AsyncStorage.multiRemove(v1RatingKeys);
      if (DEV) console.log(`[cache] purged ${v1RatingKeys.length} stale v1 rating keys`);
    }
  } catch (err) {
    if (DEV) console.warn('[cache] failed to purge v1 keys:', err);
  }
}

export default function App() {
  useEffect(() => {
    purgeStaleCacheKeys();
  }, []);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <StatusBar barStyle="light-content" />
        <ToastProvider>
          <QueryClientProvider client={queryClient}>
            <NavigationContainer theme={DarkTheme}>
              <AppNavigator />
            </NavigationContainer>
          </QueryClientProvider>
        </ToastProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
