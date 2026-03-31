import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import Modal from 'react-native-modal';
import Ionicons from '@react-native-vector-icons/ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../ThemedText';

interface ExitConfirmModalProps {
  visible: boolean;
  onCancel: () => void;
  onConfirm: () => void;
  title?: string;
  message?: string;
}

/**
 * A consistent exit confirmation modal designed to work 
 * safely alongside React Navigation and the BackHandler logic.
 */
const ExitConfirmModal: React.FC<ExitConfirmModalProps> = ({
  visible,
  onCancel,
  onConfirm,
  title = 'Exit App',
  message = 'Are you sure you want to exit the application?',
}) => {
  const { theme, isDark } = useTheme();

  return (
    <Modal
      isVisible={visible}
      onBackdropPress={onCancel}
      onBackButtonPress={onCancel}
      backdropOpacity={isDark ? 0.7 : 0.5}
      animationIn="fadeInUp"
      animationOut="fadeOutDown"
      animationInTiming={300}
      animationOutTiming={250}
      useNativeDriver
      useNativeDriverForBackdrop
      hideModalContentWhileAnimating
    >
      <View style={[styles.modalContent, { backgroundColor: theme.surface }]}>
        <View style={[styles.iconContainer, { backgroundColor: theme.error + '18' }]}>
          <Ionicons name="exit-outline" size={28} color={theme.error} />
        </View>

        <ThemedText style={[styles.title, { color: theme.text }]}>
          {title}
        </ThemedText>

        <ThemedText style={[styles.message, { color: theme.textSecondary }]}>
          {message}
        </ThemedText>

        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.button, styles.cancelButton, { backgroundColor: theme.surfaceHighlight }]}
            onPress={onCancel}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: theme.textSecondary }]}>
              Stay
            </ThemedText>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.confirmButton, { backgroundColor: theme.error }]}
            onPress={onConfirm}
            activeOpacity={0.8}
          >
            <ThemedText style={[styles.buttonText, { color: theme.textInverse }]}>
              Exit
            </ThemedText>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContent: {
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 24,
  },
  iconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    marginBottom: 8,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
    paddingHorizontal: 10,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
  },
  button: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    borderWidth: 1,
    borderColor: 'transparent',
  },
  confirmButton: {},
  buttonText: {
    fontSize: 16,
    fontWeight: '700',
  },
});

export default ExitConfirmModal;
