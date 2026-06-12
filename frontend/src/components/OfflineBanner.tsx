/**
 * OfflineBanner.tsx
 *
 * Global connectivity indicator — a compact floating pill that drops in
 * below the status bar when the device goes offline, and briefly turns
 * green ("Back online") when connectivity returns. It never paints the
 * status bar or covers screen headers.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ThemedText from './ThemedText';
import { useNetwork } from '../context/NetworkContext';

const OfflineBanner: React.FC = () => {
  const { isOnline } = useNetwork();
  const insets = useSafeAreaInsets();
  const anim = useRef(new Animated.Value(0)).current; // 0 hidden, 1 shown
  const [visible, setVisible] = useState(false);
  const [showRestored, setShowRestored] = useState(false);
  const wasOffline = useRef(false);

  useEffect(() => {
    if (!isOnline) {
      wasOffline.current = true;
      setShowRestored(false);
      setVisible(true);
      Animated.spring(anim, { toValue: 1, useNativeDriver: true, damping: 18, stiffness: 220 }).start();
      return;
    }
    // Back online — only flash the restored pill if we were actually offline
    if (wasOffline.current) {
      wasOffline.current = false;
      setShowRestored(true);
      const timer = setTimeout(() => {
        Animated.timing(anim, { toValue: 0, duration: 200, useNativeDriver: true }).start(() => {
          setVisible(false);
          setShowRestored(false);
        });
      }, 1800);
      return () => clearTimeout(timer);
    }
  }, [isOnline, anim]);

  if (!visible) return null;

  const translateY = anim.interpolate({ inputRange: [0, 1], outputRange: [-60, 0] });

  return (
    <Animated.View
      pointerEvents="none"
      style={[
        styles.wrap,
        { top: insets.top + 10, opacity: anim, transform: [{ translateY }] },
      ]}
    >
      <View style={styles.pill}>
        <View style={[styles.iconDot, { backgroundColor: showRestored ? '#16A34A' : '#DC2626' }]}>
          <Ionicons
            name={showRestored ? 'wifi-outline' : 'cloud-offline-outline'}
            size={13}
            color="#FFFFFF"
          />
        </View>
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
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 9999,
    elevation: 12,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#1F2937',
    paddingVertical: 8,
    paddingLeft: 8,
    paddingRight: 16,
    borderRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  iconDot: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '600',
    letterSpacing: 0.2,
  },
});

export default OfflineBanner;
