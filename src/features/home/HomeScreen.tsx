import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
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
        <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:20 }}>Nimehime</Text>
        <View style={{ flexDirection:'row', gap:12 }}>
          <MaterialIcon name="search" size={22} color={theme.colors.text} />
          <MaterialIcon name="person" size={22} color={theme.colors.text} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        {/* Continue Watching rail (live data) */}
        {authReady && userId && (
          <View style={{ paddingHorizontal: 20, paddingTop: 6, paddingBottom: 2 }}>
            <ContinueWatchingSection userId={userId} limit={3} />
          </View>
        )}

        <View style={{ paddingHorizontal:20, paddingTop:6, paddingBottom:8 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Smart Collections</Text>
        </View>

        <View style={{ paddingHorizontal:20, gap:12 }}>
          {rails.map(r=>(
            <CollectionCard
              key={r.id}
              title={r.title}
              subtitle={r.subtitle}
              tags={r.tags}
              posters={r.posters}
            />
          ))}
        </View>

        <View style={{ paddingHorizontal:20, paddingTop:20 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Featured Lists</Text>
        </View>

        <FlatList
          horizontal
          data={featuredLists}
          keyExtractor={(i)=>i.id}
          contentContainerStyle={{ paddingHorizontal:20, gap:12, paddingBottom:16 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <FeaturedListCard title={item.title} creator={item.creator} avatar={item.avatar} images={item.images}/>
          )}
        />
      </ScrollView>
    </SafeAreaView>
  );
}
