import { useRef, useCallback } from 'react';
import { Animated, PanResponder } from 'react-native';

const SHEET_HEIGHT = 700;

/**
 * Returns an Animated.Value for translateY, a PanResponder for swipe-to-close,
 * and an `openSheet` function that animates the sheet in from the bottom.
 *
 * Usage:
 *   const { translateY, panHandlers, openSheet } = useBottomSheetSwipe(onClose);
 *   - Set animationType="none" on the Modal
 *   - Call openSheet() inside onShow / when you set visible=true
 *   - Spread {...panHandlers} on the Animated.View
 */
export function useBottomSheetSwipe(onClose: () => void) {
  const translateY = useRef(new Animated.Value(SHEET_HEIGHT)).current;

  /** Slide the sheet in from the bottom */
  const openSheet = useCallback(() => {
    translateY.setValue(SHEET_HEIGHT);
    Animated.spring(translateY, {
      toValue: 0,
      useNativeDriver: true,
      bounciness: 4,
      speed: 14,
    }).start();
  }, [translateY]);

  /** Slide the sheet out and call onClose */
  const closeSheet = useCallback(() => {
    Animated.timing(translateY, {
      toValue: SHEET_HEIGHT,
      duration: 220,
      useNativeDriver: true,
    }).start(() => {
      translateY.setValue(SHEET_HEIGHT);
      onClose();
    });
  }, [translateY, onClose]);

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => false,
      onMoveShouldSetPanResponder: (_, g) =>
        g.dy > 8 && Math.abs(g.dy) > Math.abs(g.dx),
      onPanResponderMove: (_, g) => {
        if (g.dy > 0) translateY.setValue(g.dy);
      },
      onPanResponderRelease: (_, g) => {
        if (g.dy > 80 || g.vy > 0.5) {
          Animated.timing(translateY, {
            toValue: SHEET_HEIGHT,
            duration: 200,
            useNativeDriver: true,
          }).start(() => {
            translateY.setValue(SHEET_HEIGHT);
            onClose();
          });
        } else {
          Animated.spring(translateY, {
            toValue: 0,
            useNativeDriver: true,
          }).start();
        }
      },
    })
  ).current;

  return { translateY, panHandlers: panResponder.panHandlers, openSheet, closeSheet };
}
