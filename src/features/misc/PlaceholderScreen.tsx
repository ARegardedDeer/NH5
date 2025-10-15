import React from 'react';
import { View, Text } from 'react-native';
export default function PlaceholderScreen({ title = 'Coming soon' }: { title?: string }) {
  return <View style={{flex:1,alignItems:'center',justifyContent:'center'}}><Text>{title}</Text></View>;
}
