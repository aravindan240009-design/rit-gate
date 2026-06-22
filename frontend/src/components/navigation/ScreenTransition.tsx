import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTheme } from '../../context/ThemeContext';

/**
 * Cross-fades whenever `screenKey` changes.
 *
 * The custom navigator in App.tsx swaps the rendered screen instantly when
 * `currentScreen` changes, which makes the previous page flash for a split
 * second before the new one settles. Wrapping the screen here fades the new
 * content in over a constant background, so the swap reads as a smooth
 * transition instead of a hard cut.
 */
interface ScreenTransitionProps {
  /** Identity of the current screen — fade fires when this value changes. */
  screenKey: string;
  /** Override the background shown underneath during the fade (defaults to theme bg). */
  backgroundColor?: string;
  /** Fade duration in ms. */
  duration?: number;
  children: React.ReactNode;
}

const ScreenTransition: React.FC<ScreenTransitionProps> = ({
  screenKey,
  backgroundColor,
  duration = 200,
  children,
}) => {
  const { theme } = useTheme();
  const bg = backgroundColor ?? theme.background;
  const opacity = useRef(new Animated.Value(1)).current;
  const prevKey = useRef(screenKey);

  useEffect(() => {
    if (prevKey.current === screenKey) return;
    prevKey.current = screenKey;
    opacity.setValue(0);
    const anim = Animated.timing(opacity, {
      toValue: 1,
      duration,
      useNativeDriver: true,
    });
    anim.start();
    return () => anim.stop();
  }, [screenKey, duration, opacity]);

  return (
    <View style={[styles.container, { backgroundColor: bg }]}>
      <Animated.View style={[styles.container, { opacity }]}>
        {children}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
});

export default ScreenTransition;
