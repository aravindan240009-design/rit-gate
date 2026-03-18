import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  Animated,
  Dimensions,
  PanResponder,
  Image,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import { UserType } from '../types';
import { Ionicons } from '@expo/vector-icons';

interface HomeScreenProps {
  onSelectUserType: (type: UserType) => void;
}

const { width } = Dimensions.get('window');
const SLIDER_WIDTH = width - 60;
const BUTTON_SIZE = 64;
const SLIDE_THRESHOLD = SLIDER_WIDTH - BUTTON_SIZE - 8;

// Professional Color Scheme - White Theme
const COLORS = {
  darkNavy: '#0F172A',      // Dark text/accents
  slate: '#334155',          // Secondary text
  electricCyan: '#22D3EE',   // Primary accent (Electric Cyan)
  lightGray: '#F8FAFC',      // Background
  white: '#FFFFFF',          // Cards/surfaces
  cyan50: 'rgba(34, 211, 238, 0.1)',   // Cyan with opacity
  cyan20: 'rgba(34, 211, 238, 0.2)',
};

const HomeScreen: React.FC<HomeScreenProps> = ({ onSelectUserType }) => {
  console.log('🌟 HomeScreen Rendering...');
  const { theme } = useTheme();

  // Animations
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const slidePosition = useRef(new Animated.Value(0)).current;
  const glowAnim = useRef(new Animated.Value(0)).current;
  const [isSliding, setIsSliding] = useState(false);

  useEffect(() => {
    // Initial entrance animations
    Animated.parallel([
      Animated.timing(fadeAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
      Animated.spring(slideAnim, { toValue: 0, tension: 40, friction: 8, useNativeDriver: true }),
    ]).start();

    // Pulsing glow effect
    Animated.loop(
      Animated.sequence([
        Animated.timing(glowAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(glowAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();
  }, []);

  // Pan responder for swipe gesture
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: () => {
        setIsSliding(true);
      },
      onPanResponderMove: (_, gestureState) => {
        const newPosition = Math.max(0, Math.min(gestureState.dx, SLIDE_THRESHOLD));
        slidePosition.setValue(newPosition);
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx >= SLIDE_THRESHOLD * 0.75) {
          // Slide completed
          Animated.spring(slidePosition, {
            toValue: SLIDE_THRESHOLD,
            useNativeDriver: false,
            tension: 40,
            friction: 6,
          }).start(() => {
            onSelectUserType('STUDENT');
          });
        } else {
          // Snap back
          Animated.spring(slidePosition, {
            toValue: 0,
            useNativeDriver: false,
            tension: 40,
            friction: 6,
          }).start(() => {
            setIsSliding(false);
          });
        }
      },
    })
  ).current;

  const buttonTranslateX = slidePosition;
  const textOpacity = slidePosition.interpolate({
    inputRange: [0, SLIDE_THRESHOLD / 2],
    outputRange: [1, 0],
    extrapolate: 'clamp',
  });

  const glowOpacity = glowAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.8],
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor={COLORS.lightGray} />
      <SafeAreaView style={styles.safeArea}>
        <Animated.View style={[styles.mainContent, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          {/* Header Section */}
          <View style={styles.headerSection}>
            <View style={styles.logoContainer}>
              <Image
                source={require('../../assets/rit-logo.png')}
                style={styles.logoImage}
              />
            </View>

            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleMain}>RIT</Text>
              <Text style={styles.titleAccent}>GATE</Text>
            </View>
            <Text style={styles.subtitle}>Secure Access Control System</Text>
          </View>

          {/* Features Grid */}
          <View style={styles.featuresGrid}>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="finger-print" size={24} color={COLORS.electricCyan} />
              </View>
              <Text style={styles.featureText}>Biometric</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="scan" size={24} color={COLORS.electricCyan} />
              </View>
              <Text style={styles.featureText}>Badge Scan</Text>
            </View>
            <View style={styles.featureItem}>
              <View style={styles.featureIconContainer}>
                <Ionicons name="flash" size={24} color={COLORS.electricCyan} />
              </View>
              <Text style={styles.featureText}>Instant</Text>
            </View>
          </View>

          {/* Info Text */}
          <View style={styles.infoSection}>
            <Text style={styles.infoTitle}>Universal Access</Text>
            <Text style={styles.infoDescription}>
              One credential for all roles{'\n'}Auto-detection enabled
            </Text>
          </View>

          {/* Swipe to Unlock */}
          <View style={styles.sliderSection}>
            <View style={styles.sliderTrack}>
              {/* Slider text */}
              <Animated.View style={[styles.sliderTextContainer, { opacity: textOpacity }]}>
                <Text style={styles.sliderText}>Swipe to Access</Text>
                <Ionicons name="arrow-forward" size={20} color={COLORS.electricCyan} />
              </Animated.View>

              {/* Sliding button */}
              <Animated.View
                {...panResponder.panHandlers}
                style={[
                  styles.sliderButton,
                  { transform: [{ translateX: buttonTranslateX }] },
                ]}
              >
                <View style={styles.sliderButtonGradient}>
                  <Ionicons name="chevron-forward" size={32} color={COLORS.white} />
                </View>
              </Animated.View>
            </View>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={styles.footerText}>SECURE GATEWAY • RIT TECHNOLOGY © 2026</Text>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: COLORS.lightGray,
  },
  safeArea: {
    flex: 1,
  },
  mainContent: {
    flex: 1,
    paddingHorizontal: 30,
    paddingVertical: 20,
    justifyContent: 'space-between',
  },
  // Header Section
  headerSection: {
    alignItems: 'center',
    marginTop: 40,
  },
  logoContainer: {
    marginBottom: 30,
  },
  logoImage: {
    width: 160,
    height: 160,
    borderRadius: 80,
    resizeMode: 'cover',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  titleMain: {
    fontSize: 52,
    fontWeight: '800', // Making it stand out with bold classic styling
    color: COLORS.darkNavy,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'monospace', // Simple system fallback that looks slightly more distinct
  },
  titleAccent: {
    fontSize: 52,
    fontWeight: '800',
    color: COLORS.electricCyan,
    letterSpacing: 2,
    fontFamily: Platform.OS === 'ios' ? 'Avenir' : 'monospace',
  },
  subtitle: {
    fontSize: 13,
    color: COLORS.slate,
    opacity: 0.7,
    letterSpacing: 2,
    fontWeight: '600',
    textTransform: 'uppercase',
  },

  // Features Grid
  featuresGrid: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginVertical: 40,
  },
  featureItem: {
    alignItems: 'center',
    gap: 12,
  },
  featureIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: COLORS.white,
    borderWidth: 2,
    borderColor: COLORS.electricCyan,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  featureText: {
    fontSize: 12,
    color: COLORS.darkNavy,
    fontWeight: '600',
  },
  // Info Section
  infoSection: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  infoTitle: {
    fontSize: 22,
    fontWeight: '700',
    color: COLORS.darkNavy,
    marginBottom: 8,
    letterSpacing: 1,
  },
  infoDescription: {
    fontSize: 14,
    color: COLORS.slate,
    opacity: 0.7,
    textAlign: 'center',
    lineHeight: 22,
  },
  // Slider Section
  sliderSection: {
    marginVertical: 30,
  },
  sliderTrack: {
    height: 72,
    borderRadius: 36,
    backgroundColor: COLORS.white,
    position: 'relative',
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: COLORS.electricCyan,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },

  sliderTextContainer: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  sliderText: {
    color: COLORS.electricCyan,
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 1,
  },
  sliderButton: {
    position: 'absolute',
    left: 4,
    top: 4,
    width: BUTTON_SIZE,
    height: BUTTON_SIZE,
    borderRadius: BUTTON_SIZE / 2,
  },
  sliderButtonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: BUTTON_SIZE / 2,
    backgroundColor: COLORS.darkNavy,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: COLORS.darkNavy,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  // Footer
  footer: {
    alignItems: 'center',
    paddingBottom: 10,
  },
  footerText: {
    fontSize: 10,
    color: COLORS.slate,
    opacity: 0.4,
    fontWeight: '600',
  },
});

export default HomeScreen;
