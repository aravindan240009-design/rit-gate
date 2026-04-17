import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HR } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import GatePassQRModal from '../../components/GatePassQRModal';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';

interface HRSinglePassScreenProps {
  hr: HR;
  onBack: () => void;
}

const HRSinglePassScreen: React.FC<HRSinglePassScreenProps> = ({ hr, onBack }) => {
  const { theme } = useTheme();
  const [purpose, setPurpose] = useState('');
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const handleSubmit = () => {
    if (!purpose.trim() || !reason.trim()) {
      setErrorMsg('Please fill in both purpose and reason.');
      setShowError(true);
      return;
    }
    setShowConfirmSubmit(true);
  };

  const doSubmit = async () => {
    setSubmitting(true);
    try {
      // Step 1: Submit as NTF (skips HOD, goes straight to HR level)
      const submitRes = await apiService.submitNTFGatePassRequest({
        staffCode: hr.hrCode,
        purpose: purpose.trim(),
        reason: reason.trim(),
        requestDate: new Date().toISOString(),
      });
      if (!submitRes.success) {
        setErrorMsg(submitRes.message || 'Failed to submit gate pass.');
        setShowError(true);
        return;
      }
      const requestId = (submitRes as any).requestId || (submitRes as any).id || (submitRes as any).data?.id;
      if (!requestId) {
        setErrorMsg('Gate pass submitted but could not retrieve ID. Check My Requests.');
        setShowError(true);
        return;
      }

      // Step 2: Auto-approve as HR
      const approveRes = await apiService.approveRequestAsHR(requestId, hr.hrCode);
      if (!approveRes.success) {
        setErrorMsg(approveRes.message || 'Submitted but auto-approval failed.');
        setShowError(true);
        return;
      }

      // Step 3: Fetch QR code
      const qrRes = await apiService.getGatePassQRCode(requestId, hr.hrCode, true);
      setQrCode(qrRes.qrCode || null);
      setManualCode(qrRes.manualCode || null);
      setShowQRModal(true);
    } catch (e: any) {
      setErrorMsg(e?.message || 'An error occurred.');
      setShowError(true);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={() => {
          if (purpose.trim() || reason.trim()) setShowBackConfirm(true);
          else onBack();
        }}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>New Gate Pass</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Info card */}
        <View style={[styles.infoCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.primary }]}>
            As HR, your gate pass is instantly approved and a QR code is generated immediately.
          </ThemedText>
        </View>

        {/* User info */}
        <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {(hr.hrName || hr.name || 'HR').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.userName, { color: theme.text }]}>{hr.hrName || hr.name || 'HR'}</ThemedText>
            <ThemedText style={[styles.userSub, { color: theme.textSecondary }]}>{hr.hrCode} • {hr.department || 'HR'}</ThemedText>
          </View>
        </View>

        {/* Purpose */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Purpose *</ThemedText>
          <View style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <Ionicons name="document-text-outline" size={18} color={theme.textTertiary} />
            <TextInput
              style={[styles.input, { color: theme.text }]}
              placeholder="Enter purpose of exit"
              placeholderTextColor={theme.textTertiary}
              value={purpose}
              onChangeText={setPurpose}
            />
          </View>
        </View>

        {/* Reason */}
        <View style={styles.inputGroup}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Reason *</ThemedText>
          <View style={[styles.textAreaWrap, { backgroundColor: theme.surface, borderColor: theme.border }]}>
            <TextInput
              style={[styles.textArea, { color: theme.text }]}
              placeholder="Enter reason for gate pass"
              placeholderTextColor={theme.textTertiary}
              value={reason}
              onChangeText={setReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: submitting ? theme.textTertiary : theme.primary }]}
          onPress={handleSubmit}
          disabled={submitting}
        >
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <>
              <Ionicons name="qr-code-outline" size={20} color="#fff" />
              <ThemedText style={styles.submitBtnText}>Generate Gate Pass</ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <GatePassQRModal
        visible={showQRModal}
        onClose={() => { setShowQRModal(false); onBack(); }}
        personName={hr.hrName || hr.name || 'HR'}
        personId={hr.hrCode}
        qrCodeData={qrCode}
        manualCode={manualCode}
        reason={purpose}
        showShare={true}
      />

      <ErrorModal
        visible={showError}
        type="general"
        title="Error"
        message={errorMsg}
        onClose={() => setShowError(false)}
      />
      <ConfirmationModal
        visible={showConfirmSubmit}
        title="Generate Gate Pass"
        message="Are you sure you want to generate this gate pass? It will be instantly approved."
        confirmText="Generate"
        confirmColor={theme.primary}
        icon="qr-code-outline"
        onConfirm={() => { setShowConfirmSubmit(false); doSubmit(); }}
        onCancel={() => setShowConfirmSubmit(false)}
      />
      <ConfirmationModal
        visible={showBackConfirm}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirmText="Discard"
        icon="arrow-back-outline"
        onConfirm={() => { setShowBackConfirm(false); onBack(); }}
        onCancel={() => setShowBackConfirm(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { padding: 20, paddingBottom: 60 },
  infoCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 12, padding: 14, borderWidth: 1, marginBottom: 20 },
  infoText: { flex: 1, fontSize: 13, fontWeight: '500', lineHeight: 18 },
  userCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 14, padding: 14, marginBottom: 24, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 3 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#fff' },
  userName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  userSub: { fontSize: 13 },
  inputGroup: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  inputWrap: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12, borderWidth: 1 },
  input: { flex: 1, fontSize: 15 },
  textAreaWrap: { borderRadius: 12, padding: 14, borderWidth: 1 },
  textArea: { fontSize: 15, minHeight: 100 },
  submitBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16, borderRadius: 14, marginTop: 8 },
  submitBtnText: { fontSize: 16, fontWeight: '700', color: '#fff' },
});

export default HRSinglePassScreen;
