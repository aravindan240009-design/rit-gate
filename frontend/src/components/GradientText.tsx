import React from 'react';
import { Text, StyleProp, TextStyle, View } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
  text: string;
  colors: string[];
  style?: StyleProp<TextStyle>;
}

const GradientText: React.FC<GradientTextProps> = ({ text, colors, style }) => {
  const gradientColors = colors.length >= 2 ? colors : [colors[0] || '#2563EB', '#0EA5E9'];

  return (
    <MaskedView
      maskElement={
        <View style={{ backgroundColor: 'transparent' }}>
          <Text style={style}>{text}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
