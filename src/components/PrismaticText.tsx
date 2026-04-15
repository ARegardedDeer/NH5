import React from 'react';
import { Text, StyleSheet, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface PrismaticTextProps {
  children: string;
  style?: object;
}

const PRISMATIC_COLORS = [
  '#FF6EC7',
  '#FF9A3C',
  '#FFD93D',
  '#6BCB77',
  '#4FC3F7',
  '#C084FC',
  '#FF6EC7',
];

export default function PrismaticText({ children, style }: PrismaticTextProps) {
  const textStyle = [styles.text, style];
  return (
    <MaskedView maskElement={<Text style={textStyle}>{children}</Text>}>
      <View>
        {/* Invisible text drives the size */}
        <Text style={[textStyle, styles.invisible]}>{children}</Text>
        {/* Gradient fills exactly that space */}
        <LinearGradient
          colors={PRISMATIC_COLORS}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      </View>
    </MaskedView>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 13,
    fontWeight: '700',
  },
  invisible: {
    opacity: 0,
  },
});
