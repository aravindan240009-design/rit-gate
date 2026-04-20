import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  ScrollView,
  StatusBar,
  Modal,
  Platform,
  BackHandler,
  Animated,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Camera, CameraView } from '../../shims/expoCamera';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { SecurityPersonnel, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import SecurityBottomNav from '../../components/SecurityBottomNav';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import ThemedText from '../../components/ThemedText';
import { VerticalScrollView } from '../../components/navigation/VerticalScrollViews';
import { useTheme } from '../../context/ThemeContext';
import { useBottomSheetSwipe } from '../../hooks/useBottomSheetSwipe';


interface ModernQRScannerScreenProps {
  security: SecurityPersonnel;
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const ModernQRScannerScreen: React.FC<ModernQRScannerScreenProps> = ({ security, onBack, onNavigate }) => {
  const { theme } = useTheme();
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);
  const [scanned, setScanned] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [manualCode, setManualCode] = useState('');
  const [showManualModal, setShowManualModal] = useState(false);

  const { translateY: sheetTranslateY, panHandlers: sheetPanHandlers, openSheet: openManualSheet } = useBottomSheetSwipe(() => setShowManualModal(false));
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');

  useEffect(() => {
    const getCameraPermissions = async () => {
      console.log('🎥 [MODERN] Requesting camera permissions...');
      const { status } = await Camera.requestCameraPermissionsAsync();
      console.log('🎥 [MODERN] Camera permission status:', status);
      setHasPermission(status === 'granted');
    };
    getCameraPermissions();
  }, []);

  // Hardware back button: if camera is open, close it; otherwise go back
  useEffect(() => {
    const onBackPress = () => {
      if (showCamera) {
        resetScanner();
        return true;
      }
      onBack();
      return true;
    };
    const sub = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => sub.remove();
  }, [showCamera, onBack]);

  const handleBarCodeScanned = async ({ data }: { data: string }) => {
    // CRITICAL: Log immediately to verify camera is detecting
    console.log('========================================');
    console.log('🔍 [MODERN] QR CODE DETECTED BY CAMERA!');
    console.log('📦 [MODERN] Raw Data:', data);
    console.log('🔒 [MODERN] Scanned state:', scanned);
    console.log('========================================');
    
    if (scanned) {
      console.log('⚠️ [MODERN] Ignoring scan - already scanned');
      return;
    }
    
    console.log('✅ [MODERN] Processing scan...');
    setScanned(true);
    setIsLoading(true);

    try {
      let response;
      // Route based on code format:
      // - QR codes (contain / or |) or 6-digit manual codes → unified scan endpoint
      // - Plain ID card barcodes (reg no / staff code) → late entry endpoint
      const isQRFormat = data.includes('/') || data.includes('|');
      const is6DigitCode = /^\d{6}$/.test(data.trim());

      if (isQRFormat || is6DigitCode) {
        console.log('🚀 [MODERN] Calling apiService.scanQREntry (unified handler)');
        console.log('👤 [MODERN] Security ID:', security.securityId);
        response = await apiService.scanQREntry(data, security.securityId);
      } else {
        // Plain reg no / staff code from ID card barcode → late entry
        console.log('🚀 [MODERN] Calling apiService.scanLateEntry (ID card barcode)');
        console.log('👤 [MODERN] Security ID:', security.securityId);
        response = await apiService.scanLateEntry(data.trim(), security.securityId);
      }

      console.log('📥 [MODERN] API Response:', JSON.stringify(response));

      if (response.success || (response as any).status === 'SUCCESS' || (response as any).status === 'APPROVED') {
        // Backend tells us if it was entry or exit via scanLocation or type
        const data_resp = response.data || response;
        const isExit = (data_resp?.scanLocation || '').toLowerCase().includes('exit');
        const isLateEntry = !isExit && (isQRFormat === false && is6DigitCode === false);
        const scanLabel = isExit ? 'Exit' : isLateEntry ? 'Late Entry' : 'Entry';
        setModalTitle(`✅ ${scanLabel} Recorded`);
        setModalMessage(response.message || `${scanLabel} recorded successfully`);
        setShowSuccessModal(true);
      } else {
        setModalTitle('Scan Failed');
        // Map technical messages to user-friendly ones
        const rawMsg = response.message || '';
        let friendlyMsg = rawMsg;
        if (rawMsg.toLowerCase().includes('not found in system') || rawMsg.toLowerCase().includes('qr not found') || rawMsg.toLowerCase().includes('not found with')) {
          friendlyMsg = 'User not found in system. Please verify the ID.';
        } else if (rawMsg.toLowerCase().includes('already scanned') || rawMsg.toLowerCase().includes('daily limit') || rawMsg.toLowerCase().includes('already recorded')) {
          friendlyMsg = 'Late entry already recorded for today.';
        } else if (rawMsg.toLowerCase().includes('entry mismatch') || rawMsg.toLowerCase().includes('does not match entry')) {
          friendlyMsg = 'Invalid QR code for entry. Please scan the correct code.';
        } else if (rawMsg.toLowerCase().includes('exit mismatch') || rawMsg.toLowerCase().includes('does not match exit')) {
          friendlyMsg = 'Entry not recorded yet. Please scan for entry first.';
        } else if (rawMsg.toLowerCase().includes('invalid qr') || rawMsg.toLowerCase().includes('invalid format')) {
          friendlyMsg = 'Invalid QR code format. Please try again.';
        } else if (rawMsg.toLowerCase().includes('already used') || rawMsg.toLowerCase().includes('qr is invalid')) {
          friendlyMsg = 'This QR code has already been used.';
        } else if (!rawMsg) {
          friendlyMsg = 'Could not process the QR code. Please try again.';
        }
        setModalMessage(friendlyMsg);
        setShowErrorModal(true);
        resetScanner();
      }
    } catch (error: any) {
      console.error('❌ [MODERN] Error scanning QR code:', error);
      setModalTitle('Scan Error');
      setModalMessage(error.message || 'Failed to process scan. Please check your connection and try again.');
      setShowErrorModal(true);
      resetScanner();
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualCode.trim()) return;

    setIsLoading(true);
    try {
      // 1. Detect code format
      // QR codes: ST/userid/random or GP|incharge|students...
      // Manual/QR strings: 6 digits
      const isQRCodeFormat = manualCode.includes('/') || manualCode.includes('|');
      const is6DigitCode = /^\d{6}$/.test(manualCode.trim());
      
      console.log('🔍 [MODERN] Manual entry code format detection:');
      console.log('  - Code:', manualCode);
      console.log('  - Is QR Format:', isQRCodeFormat);
      console.log('  - Is 6-Digit Code:', is6DigitCode);

      let response;
      if (isQRCodeFormat || is6DigitCode) {
        // Unified scan endpoint
        console.log('🚀 Calling apiService.scanQREntry (unified handler)');
        response = await apiService.scanQREntry(manualCode.trim(), security.securityId);
      } else {
        // Assume student reg no or staff id
        console.log('🚀 Calling apiService.scanLateEntry (ID code handler)');
        response = await apiService.scanLateEntry(manualCode.trim(), security.securityId);
      }

      console.log('📥 [MODERN] Manual Entry API Response:', JSON.stringify(response));

      if (response.success || (response as any).status === 'SUCCESS' || (response as any).status === 'APPROVED') {
        const data_resp = response.data || response;
        const isExit = (data_resp?.scanLocation || '').toLowerCase().includes('exit');
        const scanLabel = isExit ? 'Exit' : 'Entry';
        setModalTitle(`✅ ${scanLabel} Recorded`);
        setModalMessage(response.message || `${scanLabel} recorded successfully`);
        setManualCode('');
        setShowManualModal(false);
        setShowSuccessModal(true);
      } else {
        setModalTitle('Scan Failed');
        const rawMsg = response.message || '';
        let friendlyMsg = rawMsg;
        if (rawMsg.toLowerCase().includes('not found in system') || rawMsg.toLowerCase().includes('qr not found')) {
          friendlyMsg = 'QR code not found. It may have already been used or is invalid.';
        } else if (rawMsg.toLowerCase().includes('already scanned') || rawMsg.toLowerCase().includes('daily limit')) {
          friendlyMsg = 'This code has already been used today.';
        } else if (rawMsg.toLowerCase().includes('exit mismatch') || rawMsg.toLowerCase().includes('does not match exit')) {
          friendlyMsg = 'Entry not recorded yet. Please scan for entry first.';
        } else if (rawMsg.toLowerCase().includes('already used') || rawMsg.toLowerCase().includes('qr is invalid')) {
          friendlyMsg = 'This code has already been used.';
        } else if (!rawMsg) {
          friendlyMsg = 'This code is invalid or already used. Please verify and try again.';
        }
        setModalMessage(friendlyMsg);
        setShowErrorModal(true);
      }
    } catch (error: any) {
      console.error('❌ [MODERN] Manual entry error:', error);
      setModalTitle('Entry Error');
      setModalMessage('Could not process the code. Please check your connection and try again.');
      setShowErrorModal(true);
    } finally {
      setIsLoading(false);
    }
  };

  const resetScanner = () => {
    setScanned(false);
    setShowCamera(false);
  };

  const startScanning = () => {
    console.log('📱 [MODERN] Scanner started');
    setShowCamera(true);
    setScanned(false);
    console.log('📷 [MODERN] Camera should now be visible');
  };

  if (hasPermission === null) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top','left','right','bottom']}>
        <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={theme.primary} />
          <ThemedText style={[styles.loadingText, { color: theme.textSecondary }]}>Requesting camera permission...</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  if (hasPermission === false) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top','left','right','bottom']}>
        <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
        <View style={styles.errorContainer}>
          <Ionicons name="camera-reverse-outline" size={64} color={theme.error} />
          <ThemedText style={[styles.errorTitle, { color: theme.text }]}>Camera Access Denied</ThemedText>
          <ThemedText style={[styles.errorText, { color: theme.textSecondary }]}>Please enable camera permissions in settings</ThemedText>
        </View>
      </SafeAreaView>
    );
  }

  // When camera is active, go truly full-screen (no SafeAreaView padding)
  if (showCamera) {
    return (
      <View style={styles.fullScreen}>
        <StatusBar barStyle="light-content" backgroundColor="transparent" translucent />
        <CameraView
          style={StyleSheet.absoluteFillObject}
          onBarcodeScanned={scanned ? undefined : handleBarCodeScanned}
          barcodeScannerSettings={{
            barcodeTypes: ['qr','ean13','ean8','code128','code39','code93','upc_e','pdf417','aztec','datamatrix','itf14'],
          }}
        >
          <View style={styles.cameraOverlay}>
            {/* Scan Type Badge */}
            <View style={[styles.scanTypeBadge, { marginTop: Platform.OS === 'android' ? 48 : 60, backgroundColor: theme.primary + 'E6' }]}>
              <Ionicons name="qr-code" size={20} color="#FFF" />
              <ThemedText style={styles.scanTypeBadgeText}>AUTO SCAN</ThemedText>
            </View>

            {/* Scan Frame */}
            <View style={styles.scanFrame}>
              <View style={[styles.corner, styles.cornerTopLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.cornerTopRight, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.cornerBottomLeft, { borderColor: theme.primary }]} />
              <View style={[styles.corner, styles.cornerBottomRight, { borderColor: theme.primary }]} />
            </View>

            {/* Instructions */}
            <View style={styles.scanInstructions}>
              <ThemedText style={styles.scanInstructionsText}>
                Position QR code or barcode within frame
              </ThemedText>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity style={styles.cancelButton} onPress={resetScanner}>
              <Ionicons name="close-circle" size={24} color="#FFF" />
              <ThemedText style={styles.cancelButtonText}>EXIT SCAN</ThemedText>
            </TouchableOpacity>
          </View>

          {isLoading && (
            <View style={styles.loadingOverlay}>
              <ActivityIndicator size="large" color="#FFF" />
              <ThemedText style={styles.loadingOverlayText}>Processing...</ThemedText>
            </View>
          )}
        </CameraView>

        {/* Success Modal */}
        <SuccessModal
          visible={showSuccessModal}
          title={modalTitle}
          message={modalMessage}
          onClose={() => { setShowSuccessModal(false); resetScanner(); }}
          autoClose={true}
          autoCloseDelay={2500}
        />
        <ErrorModal
          visible={showErrorModal}
          type="api"
          title={modalTitle}
          message={modalMessage}
          onClose={() => setShowErrorModal(false)}
        />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top','left','right','bottom']}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backButton, { backgroundColor: theme.surfaceHighlight }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>QR Scanner</ThemedText>
        <View style={styles.headerRight} />
      </View>

      {!showCamera ? (
        <VerticalScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
          {/* Scanner Type Selection */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Scan QR Code</ThemedText>

            <TouchableOpacity
              style={[styles.scanTypeCard, { backgroundColor: theme.surface }]}
              onPress={() => startScanning()}
            >
              <View style={[styles.scanTypeIcon, { backgroundColor: theme.primary }]}>
                <Ionicons name="qr-code" size={32} color="#FFFFFF" />
              </View>
              <View style={styles.scanTypeInfo}>
                <ThemedText style={[styles.scanTypeTitle, { color: theme.text }]}>Scan QR / Barcode</ThemedText>
                <ThemedText style={[styles.scanTypeDesc, { color: theme.textSecondary }]}>
                  Entry or exit is detected automatically
                </ThemedText>
              </View>
              <Ionicons name="chevron-forward" size={24} color={theme.textTertiary} />
            </TouchableOpacity>
          </View>

          {/* Manual Entry Option */}
          <View style={styles.section}>
            <ThemedText style={[styles.sectionTitle, { color: theme.text }]}>Manual Entry</ThemedText>
            <TouchableOpacity
              style={[styles.manualButton, { borderColor: theme.primary, backgroundColor: theme.surface }]}
              onPress={() => setShowManualModal(true)}
            >
              <Ionicons name="keypad" size={24} color={theme.primary} />
              <ThemedText style={[styles.manualButtonText, { color: theme.primary }]}>Enter Code Manually</ThemedText>
            </TouchableOpacity>
          </View>

          {/* Instructions */}
          <View style={[styles.instructionsCard, { backgroundColor: theme.primary + '20' }]}>
            <Ionicons name="information-circle" size={24} color={theme.primary} />
            <View style={styles.instructionsContent}>
              <ThemedText style={[styles.instructionsTitle, { color: theme.primary }]}>How to Scan</ThemedText>
              <ThemedText style={[styles.instructionsText, { color: theme.textSecondary }]}>
                The system automatically detects entry or exit:{'\n'}
                • Visitor first scan → Entry recorded{'\n'}
                • Visitor second scan → Exit recorded{'\n'}
                • Student/Staff QR → Exit recorded{'\n'}
                • Plain ID code → Late entry{'\n'}
                {'\n'}
                No need to select entry or exit manually!
              </ThemedText>
            </View>
          </View>
        </VerticalScrollView>
      ) : null}

      {/* Manual Entry Modal */}
      <Modal
        visible={showManualModal}
        animationType="none"
        transparent={true}
        onShow={openManualSheet}
        onRequestClose={() => setShowManualModal(false)}
        statusBarTranslucent={true}
      >
        <KeyboardAvoidingView 
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={{ flex: 1 }}
        >
          <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowManualModal(false)}>
            <Animated.View
              style={[styles.modalContainer, { backgroundColor: theme.surface, transform: [{ translateY: sheetTranslateY }] }]}
              {...sheetPanHandlers}
            >
            {/* Drag handle */}
            <View style={styles.dragHandle}><View style={[styles.dragHandleBar, { backgroundColor: theme.textTertiary + '60' }]} /></View>
            <TouchableOpacity activeOpacity={1} onPress={e => e.stopPropagation()}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Manual Entry</ThemedText>
              <TouchableOpacity
                onPress={() => setShowManualModal(false)}
                style={[styles.closeButton, { backgroundColor: theme.surfaceHighlight }]}
              >
                <Ionicons name="close" size={24} color={theme.textSecondary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>

              <ThemedText style={[styles.modalLabel, { color: theme.textSecondary }]}>Enter Code</ThemedText>
              <TextInput
                style={[styles.manualInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
                placeholder="Enter QR code manually"
                placeholderTextColor={theme.textTertiary}
                value={manualCode}
                onChangeText={setManualCode}
                autoCapitalize="none"
                autoCorrect={false}
              />

              <TouchableOpacity
                style={[
                  styles.submitButton, { backgroundColor: theme.primary },
                  (!manualCode.trim()) && { backgroundColor: theme.border }
                ]}
                onPress={handleManualEntry}
                disabled={!manualCode.trim() || isLoading}
              >
                {isLoading ? (
                  <ActivityIndicator color="#FFF" />
                ) : (
                  <>
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <ThemedText style={[styles.submitButtonText, { color: '#FFF' }]}>Submit</ThemedText>
                  </>
                )}
              </TouchableOpacity>
            </View>
            </TouchableOpacity>
            </Animated.View>
          </TouchableOpacity>
        </KeyboardAvoidingView>
      </Modal>

      {/* Bottom Navigation */}
      {!showManualModal && <SecurityBottomNav activeTab="scanner" onNavigate={onNavigate} />}

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={modalTitle}
        message={modalMessage}
        onClose={() => {
          setShowSuccessModal(false);
          resetScanner();
        }}
        autoClose={true}
        autoCloseDelay={2500}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        type="api"
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  fullScreen: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: 'transparent',
    borderBottomWidth: 1,
    borderBottomColor: 'transparent',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
  },
  headerRight: {
    width: 40,
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 12,
  },
  scanTypeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scanTypeIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  scanTypeInfo: {
    flex: 1,
  },
  scanTypeTitle: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  scanTypeDesc: {
    fontSize: 14,
  },
  manualButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  manualButtonText: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  instructionsCard: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  instructionsContent: {
    flex: 1,
  },
  instructionsTitle: {
    fontSize: 14,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructionsText: {
    fontSize: 13,
    lineHeight: 20,
  },
  cameraOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 60,
  },
  scanTypeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  scanTypeBadgeText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  scanFrame: {
    width: 250,
    height: 250,
    position: 'relative',
  },
  corner: {
    position: 'absolute',
    width: 40,
    height: 40,
  },
  cornerTopLeft: {
    top: 0,
    left: 0,
    borderTopWidth: 4,
    borderLeftWidth: 4,
    borderTopLeftRadius: 8,
  },
  cornerTopRight: {
    top: 0,
    right: 0,
    borderTopWidth: 4,
    borderRightWidth: 4,
    borderTopRightRadius: 8,
  },
  cornerBottomLeft: {
    bottom: 0,
    left: 0,
    borderBottomWidth: 4,
    borderLeftWidth: 4,
    borderBottomLeftRadius: 8,
  },
  cornerBottomRight: {
    bottom: 0,
    right: 0,
    borderBottomWidth: 4,
    borderRightWidth: 4,
    borderBottomRightRadius: 8,
  },
  scanInstructions: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
  },
  scanInstructionsText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFF',
    textAlign: 'center',
  },
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(239, 68, 68, 0.9)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    gap: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlayText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFF',
    marginTop: 12,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  errorTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: 16,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 14,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  dragHandle: { alignItems: 'center', paddingTop: 10, paddingBottom: 4 },
  dragHandleBar: { width: 40, height: 4, borderRadius: 2 },
  modalContainer: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  typeButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  typeButtonActive: {
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  typeButtonTextActive: {
    color: '#FFF',
  },
  manualInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    marginBottom: 20,
  },
  submitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  submitButtonDisabled: {
  },
  submitButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default ModernQRScannerScreen;
