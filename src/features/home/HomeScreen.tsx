import React, { useRef } from 'react';
import { View, Text, Animated, FlatList } from 'react-native';
import { rails, featuredLists } from './mockData';
import { CollectionCard } from './components/CollectionCard';
import { FeaturedListCard } from './components/FeaturedListCard';
import { theme } from '../../ui/theme';
import MaterialIcon from 'react-native-vector-icons/MaterialIcons';

export default function HomeScreen() {
  const scrollY = useRef(new Animated.Value(0)).current;
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

      <Animated.ScrollView
        scrollEventThrottle={16}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { y: scrollY } } }],
          { useNativeDriver: true }
        )}
        contentContainerStyle={{ paddingBottom: 80 }}
      >
        <View style={{ paddingHorizontal:16, paddingTop:6, paddingBottom:8 }}>
          <Text style={{ color: theme.colors.text, fontWeight:'800', fontSize:22 }}>✨ Smart Collections</Text>
        </View>

        <View style={{ paddingHorizontal:16, gap:12 }}>
          {rails.map((r, idx)=>(
            <CollectionCard
              key={r.id}
              index={idx}
              scrollY={scrollY}
              title={r.title}
              subtitle={r.subtitle}
              tags={r.tags}
              posters={r.posters}
              colors={r.colors as any}
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
      </Animated.ScrollView>
    </View>
  );
}
