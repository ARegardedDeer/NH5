import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { rails, featuredLists } from './mockData';
import { CollectionCard } from './components/CollectionCard';
import { FeaturedListCard } from './components/FeaturedListCard';
import { theme } from '../../ui/theme';

export default function HomeScreen() {
  return (
    <View style={{ flex:1, backgroundColor: theme.colors.bgDark }}>
      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ paddingHorizontal:16, paddingTop:16, paddingBottom:8 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Smart Collections</Text>
        </View>

        <View style={{ paddingHorizontal:16, gap:12 }}>
          {rails.map(r=>(
            <CollectionCard key={r.id} title={r.title} subtitle={r.subtitle} tags={r.tags} posters={r.posters} colors={r.colors}/>
          ))}
        </View>

        <View style={{ paddingHorizontal:16, paddingTop:20 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Featured Lists</Text>
        </View>

        <FlatList
          horizontal
          data={featuredLists}
          keyExtractor={(i)=>i.id}
          contentContainerStyle={{ paddingHorizontal:16, gap:12, paddingBottom:16 }}
          showsHorizontalScrollIndicator={false}
          renderItem={({ item }) => (
            <FeaturedListCard title={item.title} creator={item.creator} avatar={item.avatar} images={item.images}/>
          )}
        />
      </ScrollView>
    </View>
  );
}
