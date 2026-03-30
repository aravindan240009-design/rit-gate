import React from 'react';
import { View, StyleSheet, ViewStyle } from 'react-native';

/** Max readable width (profile-style) — centers content and avoids horizontal scroll on tablets/web. */
export const SCREEN_CONTENT_MAX_WIDTH = 560;

interface ScreenContentContainerProps {
  children: React.ReactNode;
  style?: ViewStyle;
}

const ScreenContentContainer: React.FC<ScreenContentContainerProps> = ({ children, style }) => (
  <View style={[styles.outer, style]}>
    <View style={styles.inner}>{children}</View>
  </View>
);

const styles = StyleSheet.create({
  outer: {
    width: '100%',
    flex: 1,
    alignSelf: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  inner: {
    width: '100%',
    maxWidth: SCREEN_CONTENT_MAX_WIDTH,
    flex: 1,
    overflow: 'hidden',
  },
});

export default ScreenContentContainer;
