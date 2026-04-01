import React from 'react';
import { Text, StyleProp, TextStyle, View, StyleSheet, ViewStyle } from 'react-native';
import LinearGradient from 'react-native-linear-gradient';
import MaskedView from '@react-native-masked-view/masked-view';

interface GradientTextProps {
  text: string;
  colors: string[];
  style?: StyleProp<TextStyle>;
}

const GradientText: React.FC<GradientTextProps> = ({ text, colors, style }) => {
  const gradientColors = colors.length >= 2 ? colors : [colors[0] || '#2563EB', '#0EA5E9'];
  const flattenedStyle = StyleSheet.flatten(style) || {};

  // Outer container controls the space the component occupies in the flex layout
  const containerStyle: ViewStyle = {
    flex: flattenedStyle.flex,
    flexShrink: flattenedStyle.flexShrink,
    flexGrow: flattenedStyle.flexGrow,
    flexBasis: flattenedStyle.flexBasis,
    alignSelf: flattenedStyle.alignSelf,
    marginTop: flattenedStyle.marginTop,
    marginBottom: flattenedStyle.marginBottom,
    marginLeft: flattenedStyle.marginLeft,
    marginRight: flattenedStyle.marginRight,
    width: flattenedStyle.width,
    height: flattenedStyle.height,
  };

  return (
    <MaskedView
      style={containerStyle}
      maskElement={
        <View style={StyleSheet.absoluteFill}>
          <Text style={style}>{text}</Text>
        </View>
      }
    >
      <LinearGradient
        colors={gradientColors as [string, string, ...string[]]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={{ flex: 1 }}
      >
        <Text style={[style, { opacity: 0 }]}>{text}</Text>
      </LinearGradient>
    </MaskedView>
  );
};

export default GradientText;
