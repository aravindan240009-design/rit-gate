/**
 * OfflineBanner.tsx
 *
 * Global connectivity banner. Slides down when the device goes offline and
 * shows a brief "Back online" confirmation when connectivity returns.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ThemedText from './ThemedText';
import { useNetwork } from '../context/NetworkContext';

const BANNER_HEIGHT = 36;

const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const slide = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  const [visible, setVisible] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowRestored(false);
      setVisible(true);
      Animated.timing(slide, { toValue: 1, duration: 220, useNativeDriver: true }).start();
      return;
    }
    // Back online — only flash the restored banner if we were actually offline
    if (wasOffline.current) {
      wasOffline.current = false;
      setShowRestored(true);
      const timer = setTimeout(() => {
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }).start(() => {
          setVisible(false);
          setShowRestored(false);
        });
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [isOnline, slide]);

  if (!visible) return null;

  const translateY = slide.interpolate({
    inputRange: [0, 1],
    outputRange: [-(BANNER_HEIGHT + insets.top), 0],
  });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        {
          paddingTop: insets.top,
          backgroundColor: showRestored ? '#16A34A' : '#DC2626',
          transform: [{ translateY }],
        },
      ]}
    >
      <View style={styles.row}>
        <Ionicons
          name={showRestored ? 'cloud-done-outline' : 'cloud-offline-outline'}
          size={16}
          color="#FFFFFF"
        />
        <ThemedText style={styles.text}>
          {showRestored ? 'Back online' : 'No internet connection'}
        </ThemedText>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 12,
  },
  row: {
    height: BANNER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default OfflineBanner;
