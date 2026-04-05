import React from 'react';
import { View, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import ThemedText from '../../components/ThemedText';

interface BiometricGateScreenProps {
  loading: boolean;
  message?: string;
  onBiometric: () => void;
  onDeviceCredential: () => void;
}

const BiometricGateScreen: React.FC<BiometricGateScreenProps> = ({
  loading,
  message,
  onBiometric,
  onDeviceCredential,
}) => {
  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="shield-checkmark-outline" size={52} color="#0EA5E9" />
        </View>
        <ThemedText style={styles.title}>Secure Access</ThemedText>
        <ThemedText style={styles.subtitle}>
          Choose how you want to verify your identity.
        </ThemedText>
        {!!message && <ThemedText style={styles.message}>{message}</ThemedText>}

        {/* Biometric button */}
        <TouchableOpacity style={styles.biometricBtn} onPress={onBiometric} disabled={loading} activeOpacity={0.85}>
          {loading ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="finger-print-outline" size={22} color="#FFFFFF" />
              <ThemedText style={styles.biometricBtnText}>Use Fingerprint / Face</ThemedText>
            </>
          )}
        </TouchableOpacity>

        {/* Divider */}
        <View style={styles.dividerRow}>
          <View style={styles.dividerLine} />
          <ThemedText style={styles.dividerText}>or</ThemedText>
          <View style={styles.dividerLine} />
        </View>

        {/* PIN / Pattern / Password button */}
        <TouchableOpacity style={styles.pinBtn} onPress={onDeviceCredential} disabled={loading} activeOpacity={0.85}>
          <Ionicons name="keypad-outline" size={22} color="#0F172A" />
          <ThemedText style={styles.pinBtnText}>Use PIN / Pattern / Password</ThemedText>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F1F5F9', alignItems: 'center', justifyContent: 'center', padding: 20 },
  card: {
    width: '100%',
    maxWidth: 380,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 28,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.12,
    shadowRadius: 16,
    elevation: 6,
  },
  iconWrap: { width: 92, height: 92, borderRadius: 46, backgroundColor: '#E0F2FE', alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  title: { fontSize: 28, fontWeight: '800', color: '#0F172A', marginBottom: 8 },
  subtitle: { fontSize: 15, color: '#475569', textAlign: 'center', lineHeight: 22, marginBottom: 14 },
  message: { fontSize: 13, color: '#DC2626', textAlign: 'center', marginBottom: 14, fontWeight: '600' },
  biometricBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    backgroundColor: '#0EA5E9', borderRadius: 14, paddingVertical: 15, marginBottom: 16,
  },
  biometricBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  dividerRow: { flexDirection: 'row', alignItems: 'center', width: '100%', marginBottom: 16, gap: 10 },
  dividerLine: { flex: 1, height: 1, backgroundColor: '#E2E8F0' },
  dividerText: { fontSize: 13, color: '#94A3B8', fontWeight: '500' },
  pinBtn: {
    width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10,
    borderRadius: 14, paddingVertical: 15, borderWidth: 1.5, borderColor: '#CBD5E1',
  },
  pinBtnText: { color: '#0F172A', fontSize: 15, fontWeight: '600' },
});

export default BiometricGateScreen;
