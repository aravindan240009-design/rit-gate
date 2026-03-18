import React from 'react';
import {
  Modal,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export type ErrorType = 'network' | 'api' | 'validation' | 'auth' | 'timeout' | 'general';

interface ErrorModalProps {
  visible: boolean;
  type: ErrorType;
  title?: string;
  message: string;
  onClose: () => void;
  onRetry?: () => void;
}

const ErrorModal: React.FC<ErrorModalProps> = ({
  visible,
  type,
  title,
  message,
  onClose,
  onRetry,
}) => {
  const scaleAnim = React.useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (visible) {
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }).start();
    } else {
      scaleAnim.setValue(0);
    }
  }, [visible]);

  const getErrorConfig = () => {
    switch (type) {
      case 'network':
        return {
          icon: 'cloud-offline' as const,
          color: '#F59E0B',
          defaultTitle: 'Connection Issue',
          bgGradient: ['#FEF3C7', '#FDE68A'],
        };
      case 'api':
        return {
          icon: 'server' as const,
          color: '#EF4444',
          defaultTitle: 'Server Error',
          bgGradient: ['#FEE2E2', '#FECACA'],
        };
      case 'validation':
        return {
          icon: 'alert-circle' as const,
          color: '#F59E0B',
          defaultTitle: 'Invalid Input',
          bgGradient: ['#FEF3C7', '#FDE68A'],
        };
      case 'auth':
        return {
          icon: 'lock-closed' as const,
          color: '#EF4444',
          defaultTitle: 'Authentication Failed',
          bgGradient: ['#FEE2E2', '#FECACA'],
        };
      case 'timeout':
        return {
          icon: 'time' as const,
          color: '#F59E0B',
          defaultTitle: 'Request Timeout',
          bgGradient: ['#FEF3C7', '#FDE68A'],
        };
      default:
        return {
          icon: 'information-circle' as const,
          color: '#6B7280',
          defaultTitle: 'Something Went Wrong',
          bgGradient: ['#F3F4F6', '#E5E7EB'],
        };
    }
  };

  const config = getErrorConfig();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ scale: scaleAnim }],
            },
          ]}
        >
          {/* Icon Header */}
          <View style={[styles.iconContainer, { backgroundColor: config.color }]}>
            <Ionicons name={config.icon} size={40} color="#FFFFFF" />
          </View>

          {/* Content */}
          <View style={styles.content}>
            <Text style={styles.title}>
              {title || config.defaultTitle}
            </Text>
            <Text style={styles.message}>{message}</Text>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            {onRetry && (
              <TouchableOpacity
                style={[styles.button, styles.retryButton, { backgroundColor: config.color }]}
                onPress={() => {
                  onClose();
                  onRetry();
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="refresh" size={18} color="#FFFFFF" />
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={[
                styles.button,
                styles.closeButton,
                !onRetry && styles.closeButtonFull,
              ]}
              onPress={onClose}
              activeOpacity={0.8}
            >
              <Text style={styles.closeButtonText}>
                {onRetry ? 'Cancel' : 'Close'}
              </Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 20,
  },
  modalContainer: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  content: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
    textAlign: 'center',
  },
  message: {
    fontSize: 15,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
  },
  actions: {
    flexDirection: 'row',
    padding: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  retryButton: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  closeButton: {
    backgroundColor: '#F3F4F6',
  },
  closeButtonFull: {
    flex: 1,
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
  },
});

export default ErrorModal;
