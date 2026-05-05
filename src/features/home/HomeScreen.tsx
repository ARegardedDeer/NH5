import React, { useEffect, useState } from 'react';
import Animated, { FadeInDown, FadeInRight, Easing } from 'react-native-reanimated';
import { View, Text, ScrollView, FlatList, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { rails, featuredLists } from './mockData';
import { CollectionCard } from './components/CollectionCard';
import { FeaturedListCard } from './components/FeaturedListCard';
import { theme } from '../../ui/theme';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';
import { ContinueWatchingSection } from '../../components/continue-watching/ContinueWatchingSection';
import { supabase, whenAuthed } from '../../db/supabaseClient';

export default function HomeScreen() {
  const [userId, setUserId] = useState<string | null>(null);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    whenAuthed.then(async () => {
      const { data } = await supabase.auth.getUser();
      setUserId(data?.user?.id ?? null);
      setAuthReady(true);
    });
  }, []);

  return (
    <SafeAreaView style={{ flex:1, backgroundColor: theme.colors.bgDark }} edges={['top', 'left', 'right']}>
      {/* Sticky header */}
      <View style={{ paddingHorizontal:20, paddingTop:8, paddingBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <Text style={{ color: theme.colors.text, fontWeight:'700', fontSize:20, letterSpacing: 0.38 }}>Nimehime</Text>
        <View style={{ flexDirection:'row', gap:4 }}>
          <Pressable
            onPress={() => console.log('TODO: navigate to Search')}
            style={{ padding: 11 }}
            accessibilityLabel="Search"
            accessibilityRole="button"
          >
            <MaterialIcon name="search" size={22} color={theme.colors.text} />
          </Pressable>
          <Pressable
            onPress={() => console.log('TODO: navigate to Profile')}
            style={{ padding: 11 }}
            accessibilityLabel="Profile"
            accessibilityRole="button"
          >
            <MaterialIcon name="person" size={22} color={theme.colors.text} />
          </Pressable>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Continue Watching rail (live data) */}
        {authReady && userId && (
          <View style={{ paddingTop: 6, paddingBottom: 2 }}>
            <ContinueWatchingSection userId={userId} limit={3} />
          </View>
        )}

        <View style={{ paddingHorizontal:20, paddingTop:6, paddingBottom:8 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'700', fontSize:22, letterSpacing: 0.35 }}>✨ Smart Collections</Text>
        </View>

        <View style={{ paddingHorizontal:20, gap:12 }}>
          {rails.map((r, index) => (
            <Animated.View
              key={r.id}
              entering={index < 8
                ? FadeInDown.delay(index * 45).duration(220).easing(Easing.bezier(0.25, 0.1, 0.25, 1))
                : undefined}
            >
              <CollectionCard
                title={r.title}
                subtitle={r.subtitle}
                tags={r.tags}
                posters={r.posters}
              />
            </Animated.View>
          ))}
        </View>

        <View style={{ paddingHorizontal:20, paddingTop:20 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'700', fontSize:22, letterSpacing: 0.35 }}>✨ Featured Lists</Text>
        </View>

        <FlatList
          horizontal
          data={featuredLists}
          keyExtractor={(i)=>i.id}
          contentContainerStyle={{ paddingHorizontal:20, gap:12, paddingBottom:16 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item, index }) => (
            <Animated.View
              entering={index < 5
                ? FadeInRight.delay(index * 45).duration(220).easing(Easing.bezier(0.25, 0.1, 0.25, 1))
                : undefined}
            >
              <FeaturedListCard title={item.title} creator={item.creator} avatar={item.avatar} images={item.images}/>
            </Animated.View>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
