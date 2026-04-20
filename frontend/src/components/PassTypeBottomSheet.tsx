import React from 'react';
import { View, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import Modal from 'react-native-modal';
import LinearGradient from 'react-native-linear-gradient';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../context/ThemeContext';
import ThemedText from './ThemedText';

const TypedModal = Modal as any;
const TypedLinearGradient = LinearGradient as any;

interface PassTypeBottomSheetProps {
  visible: boolean;
  onClose: () => void;
  onSelectSingle: () => void;
  /** Bulk student pass — omit to hide this option */
  onSelectBulk?: () => void;
  /** Pre-register guest (instant QR) — Staff / HOD / NTF flows */
  onSelectGuest?: () => void;
}

const { width } = Dimensions.get('window');

/** Returns current time in IST (UTC+5:30) as { hours, minutes } */
const getISTTime = () => {
  const now = new Date();
  const utcMs = now.getTime() + now.getTimezoneOffset() * 60000;
  const istMs = utcMs + 5.5 * 60 * 60 * 1000;
  const ist = new Date(istMs);
  return { hours: ist.getHours(), minutes: ist.getMinutes() };
};

/** Staff / HOD / NTF / NCI: gate pass disabled after 17:00 IST */
const isStaffPassDisabled = () => {
  const { hours } = getISTTime();
  return hours >= 17;
};

const PassTypeBottomSheet: React.FC<PassTypeBottomSheetProps> = ({
  visible,
  onClose,
  onSelectSingle,
  onSelectBulk,
  onSelectGuest,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const passDisabled = isStaffPassDisabled();

  return (
    <TypedModal
      isVisible={visible}
      onBackdropPress={onClose}
      onBackButtonPress={onClose}
      onSwipeComplete={onClose}
      swipeDirection="down"
      style={styles.modal}
      animationIn="slideInUp"
      animationOut="slideOutDown"
      backdropOpacity={0.5}
      useNativeDriver={true}
    >
      <View style={[styles.container, { backgroundColor: theme.background, paddingBottom: Math.max(insets.bottom, 20) }]}>
        {/* Handle Bar */}
        <View style={styles.handleBar}>
          <View style={[styles.handle, { backgroundColor: theme.textSecondary + '40' }]} />
        </View>

        {/* Header */}
        <View style={styles.header}>
          <ThemedText style={[styles.title, { color: theme.text }]}>Select Pass Type</ThemedText>
          <ThemedText style={[styles.subtitle, { color: theme.textSecondary }]}>
            Choose the type of gate pass you want to create
          </ThemedText>
        </View>

        {/* Pass Type Cards */}
        <View style={styles.cardsContainer}>
          {/* Single Pass Card */}
          <TouchableOpacity
            style={[
              styles.card,
              { backgroundColor: theme.cardBackground, borderColor: theme.border },
              passDisabled && styles.cardDisabled,
            ]}
            onPress={passDisabled ? undefined : onSelectSingle}
            activeOpacity={passDisabled ? 1 : 0.8}
          >
            <TypedLinearGradient
              colors={passDisabled ? ['#9ca3af', '#9ca3af'] : ['#4facfe', '#00f2fe']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.iconContainer}
            >
              <Ionicons name="person" size={28} color="#FFF" />
            </TypedLinearGradient>

            <View style={styles.cardContent}>
              <ThemedText style={[styles.cardTitle, { color: passDisabled ? theme.textTertiary : theme.text }]}>
                Myself (Single Pass)
              </ThemedText>
              <ThemedText style={[styles.cardDescription, { color: theme.textTertiary }]}>
                {passDisabled ? 'Not available after 5:00 PM' : 'Create a gate pass for yourself'}
              </ThemedText>
            </View>

            <View style={styles.arrowContainer}>
              {passDisabled ? (
                <ProhibitionIcon size={26} />
              ) : (
                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
              )}
            </View>
          </TouchableOpacity>

          {/* Bulk Pass Card — only shown when onSelectBulk is provided */}
          {onSelectBulk ? (
            <TouchableOpacity
              style={[
                styles.card,
                { backgroundColor: theme.cardBackground, borderColor: theme.border },
                passDisabled && styles.cardDisabled,
              ]}
              onPress={passDisabled ? undefined : onSelectBulk}
              activeOpacity={passDisabled ? 1 : 0.8}
            >
              <TypedLinearGradient
                colors={passDisabled ? ['#9ca3af', '#9ca3af'] : ['#667eea', '#764ba2']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name="people" size={28} color="#FFF" />
              </TypedLinearGradient>

              <View style={styles.cardContent}>
                <ThemedText style={[styles.cardTitle, { color: passDisabled ? theme.textTertiary : theme.text }]}>
                  Bulk Student Pass
                </ThemedText>
                <ThemedText style={[styles.cardDescription, { color: theme.textTertiary }]}>
                  {passDisabled ? 'Not available after 5:00 PM' : 'Create a gate pass for multiple students'}
                </ThemedText>
              </View>

              <View style={styles.arrowContainer}>
                {passDisabled ? (
                  <ProhibitionIcon size={26} />
                ) : (
                  <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
                )}
              </View>
            </TouchableOpacity>
          ) : null}

          {/* Guest / Pre-register — never time-restricted */}
          {onSelectGuest ? (
            <TouchableOpacity
              style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={() => {
                onClose();
                onSelectGuest();
              }}
              activeOpacity={0.8}
            >
              <TypedLinearGradient
                colors={['#0d9488', '#14b8a6']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={styles.iconContainer}
              >
                <Ionicons name="person-add" size={28} color="#FFF" />
              </TypedLinearGradient>
              <View style={styles.cardContent}>
                <ThemedText style={[styles.cardTitle, { color: theme.text }]}>Pre-register guest</ThemedText>
                <ThemedText style={[styles.cardDescription, { color: theme.textSecondary }]}>
                  Instant visitor pass — QR &amp; manual code
                </ThemedText>
              </View>
              <View style={styles.arrowContainer}>
                <Ionicons name="chevron-forward" size={24} color={theme.textSecondary} />
              </View>
            </TouchableOpacity>
          ) : null}
        </View>

        {/* Cancel Button */}
        <TouchableOpacity
          style={[styles.cancelButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
          onPress={onClose}
          activeOpacity={0.8}
        >
          <ThemedText style={[styles.cancelButtonText, { color: theme.textSecondary }]}>Cancel</ThemedText>
        </TouchableOpacity>
      </View>
    </TypedModal>
  );
};

/** SVG-free prohibition icon drawn with RN primitives */
const ProhibitionIcon: React.FC<{ size?: number }> = ({ size = 24 }) => {
  const r = size / 2;
  const stroke = size * 0.14;
  return (
    <View style={{ width: size, height: size, justifyContent: 'center', alignItems: 'center' }}>
      {/* Outer circle */}
      <View
        style={{
          position: 'absolute',
          width: size,
          height: size,
          borderRadius: r,
          borderWidth: stroke,
          borderColor: '#DC2626',
        }}
      />
      {/* Diagonal slash — rotated rectangle */}
      <View
        style={{
          position: 'absolute',
          width: stroke,
          height: size * 0.88,
          backgroundColor: '#DC2626',
          borderRadius: stroke / 2,
          transform: [{ rotate: '-45deg' }],
        }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  modal: {
    margin: 0,
    justifyContent: 'flex-end',
  },
  container: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
  },
  handleBar: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '500',
  },
  cardsContainer: {
    gap: 16,
    marginBottom: 20,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
  },
  cardDisabled: {
    opacity: 0.55,
  },
  iconContainer: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContent: {
    flex: 1,
    marginLeft: 16,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  cardDescription: {
    fontSize: 13,
    fontWeight: '500',
  },
  arrowContainer: {
    marginLeft: 8,
  },
  cancelButton: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PassTypeBottomSheet;
