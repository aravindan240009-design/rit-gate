import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Animated,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../../services/api';
import { detectUserRole, getRoleDisplayName, getRoleIcon, getRoleColor } from '../../utils/roleDetection';
import { UserRole, LoginResponse } from '../../types';
import { THEME } from '../../config/api.config';
import QRLoginScanner from './QRLoginScanner';
import { SettingsScreen } from '../shared/SettingsScreen';

interface UnifiedLoginScreenProps {
  onLoginSuccess: (user: any, role: UserRole) => void;
  onBack?: () => void;
}

// Direct fetch test function
const testDirectFetch = async () => {
  console.log('🧪 DIRECT FETCH TEST');
  console.log('===================');
  
  const url = 'http://192.168.29.119:8080/api/health';
  console.log('📍 URL:', url);
  
  try {
    console.log('🚀 Starting fetch...');
    const startTime = Date.now();
    
    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
      },
    });
    
    const endTime = Date.now();
    console.log(`✅ Response received in ${endTime - startTime}ms`);
    console.log('   Status:', response.status);
    console.log('   Status Text:', response.statusText);
    
    const data = await response.json();
    console.log('✅ Data:', JSON.stringify(data, null, 2));
    
    Alert.alert('Success!', `Backend is reachable!\n\nResponse time: ${endTime - startTime}ms\n\nStatus: ${response.status}\n\nMessage: ${data.message}`);
    
    return { success: true, data };
    
  } catch (error: any) {
    console.error('❌ Fetch failed!');
    console.error('   Error name:', error.name);
    console.error('   Error message:', error.message);
    console.error('   Error stack:', error.stack);
    
    Alert.alert('Fetch Failed', `Error: ${error.message}\n\nType: ${error.name}\n\nNote: Browser test worked, so this is a React Native issue.`);
    
    return { success: false, error: error.message };
  }
};

const UnifiedLoginScreen: React.FC<UnifiedLoginScreenProps> = ({ onLoginSuccess, onBack }) => {
  const [userId, setUserId] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [detectedRole, setDetectedRole] = useState<UserRole | null>(null);
  const [maskedEmail, setMaskedEmail] = useState('');
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [showSettings, setShowSettings] = useState(false);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const scaleAnim = useRef(new Animated.Value(0.9)).current;
  const logoRotate = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animation
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        tension: 50,
        friction: 7,
        useNativeDriver: true,
      }),
    ]).start();

    // Logo rotation animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(logoRotate, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        }),
        Animated.timing(logoRotate, {
          toValue: 0,
          duration: 3000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  // Detect role as user types
  useEffect(() => {
    if (userId.trim().length > 0) {
      const role = detectUserRole(userId);
      setDetectedRole(role);
    } else {
      setDetectedRole(null);
    }
  }, [userId]);

  const logoRotateInterpolate = logoRotate.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const handleSendOTP = async () => {
    if (!userId.trim()) {
      Alert.alert('Error', 'Please enter your ID');
      return;
    }

    const role = detectUserRole(userId);
    setDetectedRole(role);
    setLoading(true);

    try {
      let response;

      switch (role) {
        case 'STUDENT':
          response = await apiService.sendStudentOTP(userId.trim());
          break;
        case 'STAFF':
          response = await apiService.sendStaffOTP(userId.trim());
          break;
        case 'HOD':
          response = await apiService.sendHODOTP(userId.trim());
          break;
        case 'HR':
          response = await apiService.sendHROTP(userId.trim());
          break;
        case 'SECURITY':
          response = await apiService.sendSecurityOTP(userId.trim());
          break;
        default:
          throw new Error('Invalid user type');
      }

      if (response.success) {
        setMaskedEmail(response.email || 'your registered email');
        setOtpSent(true);
        Alert.alert('Success', `OTP sent to ${response.email || 'your registered email'}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to send OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    if (!otp.trim()) {
      Alert.alert('Error', 'Please enter the OTP');
      return;
    }

    if (!detectedRole) {
      Alert.alert('Error', 'Invalid user ID');
      return;
    }

    setLoading(true);

    try {
      let response: LoginResponse;

      switch (detectedRole) {
        case 'STUDENT':
          response = await apiService.verifyStudentOTP(userId.trim(), otp.trim());
          break;
        case 'STAFF':
          response = await apiService.verifyStaffOTP(userId.trim(), otp.trim());
          break;
        case 'HOD':
          response = await apiService.verifyHODOTP(userId.trim(), otp.trim());
          break;
        case 'HR':
          response = await apiService.verifyHROTP(userId.trim(), otp.trim()) as LoginResponse;
          break;
        case 'SECURITY':
          response = await apiService.verifySecurityOTP(userId.trim(), otp.trim());
          break;
        default:
          throw new Error('Invalid user type');
      }

      if (response.success && response.user && response.role) {
        onLoginSuccess(response.user, response.role);
      } else {
        Alert.alert('Error', response.message || 'Invalid OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to verify OTP');
    } finally {
      setLoading(false);
    }
  };

  const handleReset = () => {
    setOtpSent(false);
    setOtp('');
    setMaskedEmail('');
  };

  const handleQRScan = async (qrData: string) => {
    setShowQRScanner(false);
    setLoading(true);

    try {
      // Parse QR data - expecting format like "SEC001" or "STAFF001" or JSON
      let parsedData: { userId: string; role?: UserRole } | null = null;

      // Try parsing as JSON first
      try {
        const jsonData = JSON.parse(qrData);
        if (jsonData.userId || jsonData.user_id || jsonData.id) {
          parsedData = {
            userId: jsonData.userId || jsonData.user_id || jsonData.id,
            role: jsonData.role || jsonData.userType,
          };
        }
      } catch {
        // Not JSON, treat as plain user ID
        parsedData = { userId: qrData.trim() };
      }

      if (!parsedData || !parsedData.userId) {
        Alert.alert('Invalid QR', 'QR code does not contain valid user information');
        setLoading(false);
        return;
      }

      // Detect role if not provided
      const role = parsedData.role || detectUserRole(parsedData.userId);
      setDetectedRole(role);
      setUserId(parsedData.userId);

      // Send OTP based on detected role
      let response;
      switch (role) {
        case 'STUDENT':
          response = await apiService.sendStudentOTP(parsedData.userId);
          break;
        case 'STAFF':
          response = await apiService.sendStaffOTP(parsedData.userId);
          break;
        case 'HOD':
          response = await apiService.sendHODOTP(parsedData.userId);
          break;
        case 'HR':
          response = await apiService.sendHROTP(parsedData.userId);
          break;
        case 'SECURITY':
          response = await apiService.sendSecurityOTP(parsedData.userId);
          break;
        default:
          throw new Error('Invalid user type detected from QR code');
      }

      if (response.success) {
        setMaskedEmail(response.email || 'your registered email');
        setOtpSent(true);
        Alert.alert('Success', `OTP sent to ${response.email || 'your registered email'}`);
      } else {
        Alert.alert('Error', response.message || 'Failed to send OTP');
      }
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to process QR code');
    } finally {
      setLoading(false);
    }
  };

  // Render Login Screen
  if (!otpSent) {
    return (
      <SafeAreaView style={styles.container}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
          keyboardVerticalOffset={0}
        >
          <View style={styles.loginContent}>
            {/* Header Row - Fixed at top */}
            <View style={styles.headerRow}>
              {onBack && (
                <TouchableOpacity onPress={onBack} style={styles.backButtonCompact} activeOpacity={0.8}>
                  <Ionicons name="arrow-back" size={24} color="#1A1D1F" />
                </TouchableOpacity>
              )}
              <View style={{ flex: 1 }} />
              <TouchableOpacity 
                onPress={() => setShowSettings(true)} 
                style={styles.settingsButtonCompact}
                activeOpacity={0.8}
              >
                <Ionicons name="settings-outline" size={24} color="#1A1D1F" />
              </TouchableOpacity>
            </View>

            {/* Logo Section */}
            <View style={styles.logoSectionCompact}>
              <Animated.View
                style={[
                  styles.logoCircleCompact,
                  {
                    transform: [
                      { rotate: logoRotateInterpolate },
                      { scale: scaleAnim },
                    ],
                  },
                ]}
              >
                <Ionicons name="shield-checkmark" size={36} color={THEME.colors.primary} />
              </Animated.View>
              <Animated.Text
                style={[
                  styles.appTitleCompact,
                  { opacity: fadeAnim, transform: [{ scale: scaleAnim }] },
                ]}
              >
                MyGate
              </Animated.Text>
              <Animated.Text style={[styles.appSubtitleCompact, { opacity: fadeAnim }]}>
                Campus Access Management
              </Animated.Text>
            </View>

            {/* Form Card */}
            <View style={styles.formCardCompact}>
              <Text style={styles.fieldLabelCompact}>USER ID</Text>

              {/* ID Input */}
              <View style={styles.inputFieldContainerCompact}>
                <Ionicons name="person" size={20} color="#6B7280" />
                <TextInput
                  style={styles.inputFieldCompact}
                  placeholder="Enter your ID"
                  placeholderTextColor="#9CA3AF"
                  value={userId}
                  onChangeText={setUserId}
                  autoCapitalize="characters"
                  returnKeyType="send"
                  onSubmitEditing={handleSendOTP}
                  blurOnSubmit={false}
                />
              </View>

              {/* Send OTP Button */}
              <TouchableOpacity
                style={[styles.sendOtpButton, loading && styles.buttonDisabled]}
                onPress={handleSendOTP}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#FFF" size="small" />
                ) : (
                  <>
                    <Text style={styles.sendOtpButtonText}>SEND OTP</Text>
                    <Ionicons name="arrow-forward" size={20} color="#FFF" />
                  </>
                )}
              </TouchableOpacity>

              {/* QR Scan Button */}
              <TouchableOpacity
                style={styles.qrScanButton}
                onPress={() => setShowQRScanner(true)}
                activeOpacity={0.8}
              >
                <Ionicons name="qr-code-outline" size={24} color={THEME.colors.primary} />
                <Text style={styles.qrScanButtonText}>SCAN QR CODE</Text>
              </TouchableOpacity>
            </View>

            {/* Footer */}
            <View style={styles.footerCompact}>
              <Ionicons name="information-circle-outline" size={16} color="#9CA3AF" />
              <Text style={styles.footerTextCompact}>
                Enter Student/Staff/HOD/HR/Security ID
              </Text>
            </View>
          </View>

          {/* QR Scanner Modal */}
          <Modal
            visible={showQRScanner}
            animationType="slide"
            presentationStyle="fullScreen"
            onRequestClose={() => setShowQRScanner(false)}
          >
            <QRLoginScanner
              onScanSuccess={handleQRScan}
              onClose={() => setShowQRScanner(false)}
            />
          </Modal>

          {/* Settings Modal */}
          <Modal
            visible={showSettings}
            animationType="slide"
            presentationStyle="pageSheet"
            onRequestClose={() => setShowSettings(false)}
          >
            <SafeAreaView style={{ flex: 1 }}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Backend Settings</Text>
                <TouchableOpacity onPress={() => setShowSettings(false)}>
                  <Ionicons name="close" size={28} color={THEME.colors.text} />
                </TouchableOpacity>
              </View>
              <SettingsScreen />
            </SafeAreaView>
          </Modal>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  // Render OTP Verification Screen
  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={styles.otpContent}>
          {/* Header */}
          <TouchableOpacity onPress={handleReset} style={styles.backButtonCompact}>
            <Ionicons name="arrow-back" size={22} color={THEME.colors.text} />
          </TouchableOpacity>

          {/* Compact OTP Icon */}
          <View style={styles.otpIconContainerCompact}>
            <View style={styles.otpIconCircleCompact}>
              <Ionicons name="mail" size={32} color={THEME.colors.primary} />
            </View>
          </View>

          {/* OTP Title */}
          <Text style={styles.otpTitleCompact}>Verify OTP</Text>
          <Text style={styles.otpSubtitleCompact}>
            Code sent to <Text style={styles.otpEmail}>{maskedEmail}</Text>
          </Text>

          {/* OTP Input */}
          <View style={styles.otpInputContainerCompact}>
            <TextInput
              style={styles.otpInputCompact}
              value={otp}
              onChangeText={setOtp}
              keyboardType="number-pad"
              maxLength={6}
              autoFocus={true}
              placeholder="000000"
              placeholderTextColor={THEME.colors.textSecondary}
            />
          </View>

          {/* Verify Button */}
          <TouchableOpacity
            style={[styles.verifyButtonCompact, loading && styles.buttonDisabled]}
            onPress={handleVerifyOTP}
            disabled={loading}
            activeOpacity={0.8}
          >
            {loading ? (
              <ActivityIndicator color="#FFF" size="small" />
            ) : (
              <>
                <Text style={styles.verifyButtonTextCompact}>VERIFY & LOGIN</Text>
                <Ionicons name="checkmark-circle" size={18} color="#FFF" />
              </>
            )}
          </TouchableOpacity>

          {/* Resend OTP */}
          <View style={styles.resendContainerCompact}>
            <Text style={styles.resendTextCompact}>Didn't receive? </Text>
            <TouchableOpacity onPress={handleSendOTP} disabled={loading}>
              <Text style={styles.resendLinkCompact}>Resend</Text>
            </TouchableOpacity>
          </View>

          {/* Change ID */}
          <TouchableOpacity style={styles.changeIdButtonCompact} onPress={handleReset}>
            <Text style={styles.changeIdTextCompact}>Change ID</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  keyboardView: {
    flex: 1,
  },
  loginContent: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 8,
  },
  // Header Row - Fixed at top
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 8,
    paddingBottom: 32,
  },
  backButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  settingsButtonCompact: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 2,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAED',
    backgroundColor: '#FFFFFF',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1D1F',
    letterSpacing: -0.3,
  },
  // Logo Section - Centered
  logoSectionCompact: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoCircleCompact: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 5,
  },
  appTitleCompact: {
    fontSize: 32,
    fontWeight: '800',
    color: '#000000',
    marginBottom: 6,
    letterSpacing: -0.5,
  },
  appSubtitleCompact: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '500',
  },
  // Form Card
  formCardCompact: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  fieldLabelCompact: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 12,
    textTransform: 'uppercase',
  },
  inputFieldContainerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    marginBottom: 20,
    paddingHorizontal: 16,
    height: 56,
    gap: 12,
  },
  inputFieldCompact: {
    flex: 1,
    fontSize: 16,
    color: '#1A1D1F',
    fontWeight: '500',
  },
  // Buttons
  sendOtpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#1F2937',
    borderRadius: 12,
    height: 56,
    gap: 8,
    marginBottom: 12,
  },
  sendOtpButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  qrScanButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: THEME.colors.primary,
    height: 56,
    gap: 10,
  },
  qrScanButtonText: {
    fontSize: 14,
    fontWeight: '800',
    color: THEME.colors.primary,
    letterSpacing: 0.5,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  // Footer
  footerCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 20,
    gap: 6,
  },
  footerTextCompact: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  // OTP Screen Styles
  otpContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 24,
    justifyContent: 'center',
  },
  otpIconContainerCompact: {
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 28,
  },
  otpIconCircleCompact: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: THEME.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 5,
    borderWidth: 1,
    borderColor: THEME.colors.primary + '20',
  },
  otpTitleCompact: {
    fontSize: 28,
    fontWeight: '800',
    color: '#1A1D1F',
    textAlign: 'center',
    marginBottom: 10,
    letterSpacing: -0.5,
  },
  otpSubtitleCompact: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
    paddingHorizontal: 16,
  },
  otpEmail: {
    color: THEME.colors.primary,
    fontWeight: '700',
  },
  otpInputContainerCompact: {
    marginBottom: 24,
  },
  otpInputCompact: {
    backgroundColor: '#F7F8FA',
    borderRadius: 12,
    height: 60,
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    letterSpacing: 8,
    color: '#1A1D1F',
    borderWidth: 1.5,
    borderColor: '#E8EAED',
  },
  verifyButtonCompact: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: THEME.colors.success,
    borderRadius: 12,
    height: 52,
    gap: 8,
    marginBottom: 24,
    shadowColor: THEME.colors.success,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  verifyButtonTextCompact: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  resendContainerCompact: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  resendTextCompact: {
    fontSize: 14,
    color: '#6B7280',
  },
  resendLinkCompact: {
    fontSize: 14,
    color: THEME.colors.primary,
    fontWeight: '800',
  },
  changeIdButtonCompact: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  changeIdTextCompact: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
});

export default UnifiedLoginScreen;
