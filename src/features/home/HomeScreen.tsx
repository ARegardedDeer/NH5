import React from 'react';
import { View, Text, ScrollView, FlatList } from 'react-native';
import { rails, featuredLists } from './mockData';
import { CollectionCard } from './components/CollectionCard';
import { FeaturedListCard } from './components/FeaturedListCard';
import { theme } from '../../ui/theme';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  return (
    <View style={{ flex:1, backgroundColor: theme.colors.bgDark }}>
      {/* Sticky header */}
      <View style={{ paddingHorizontal:16, paddingTop:14, paddingBottom:8, flexDirection:'row', alignItems:'center', justifyContent:'space-between' }}>
        <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:20 }}>Nimehime</Text>
        <View style={{ flexDirection:'row', gap:12 }}>
          <MaterialIcon name="search" size={22} color={theme.colors.text} />
          <MaterialIcon name="person" size={22} color={theme.colors.text} />
        </View>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 80 }}>
        <View style={{ paddingHorizontal:16, paddingTop:6, paddingBottom:8 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Smart Collections</Text>
        </View>

        <View style={{ paddingHorizontal:16, gap:12 }}>
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
