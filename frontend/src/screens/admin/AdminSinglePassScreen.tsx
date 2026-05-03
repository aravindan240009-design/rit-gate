import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, ScrollView, BackHandler, Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import GatePassQRModal from '../../components/GatePassQRModal';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';

interface AdminSinglePassScreenProps {
  admin: NonTeachingFaculty;
  onBack: () => void;
}

const PURPOSE_OPTIONS = [
  'Medical Appointment',
  'Family Emergency',
  'Official Meeting / Conference',
  'Personal Work',
  'Others',
];

const AdminSinglePassScreen: React.FC<AdminSinglePassScreenProps> = ({ admin, onBack }) => {
  const { theme } = useTheme();
  const [purpose, setPurpose] = useState('');
  const [showPurposePicker, setShowPurposePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [showError, setShowError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);

  const isDirty = purpose.trim().length > 0 || reason.trim().length > 0;

  const handleBack = () => {
    if (isDirty) setShowBackConfirm(true);
    else onBack();
  };

  // Intercept hardware back button
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (isDirty) {
        setShowBackConfirm(true);
        return true;
      }
      return false;
    });
    return () => sub.remove();
  }, [isDirty]);

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
        staffCode: admin.staffCode,
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
      const approveRes = await apiService.approveRequestAsHR(requestId, admin.staffCode);
      if (!approveRes.success) {
        setErrorMsg(approveRes.message || 'Submitted but auto-approval failed.');
        setShowError(true);
        return;
      }

      // Step 3: Fetch QR code
      const qrRes = await apiService.getGatePassQRCode(requestId, admin.staffCode, true);
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
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={handleBack}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>New Gate Pass</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={[styles.infoCard, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '30' }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.primary }]}>
            Your gate pass is instantly approved and a QR code is generated immediately.
          </ThemedText>
        </View>

        <View style={[styles.userCard, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
            <ThemedText style={styles.avatarText}>
              {(admin.staffName || admin.name || 'AO').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
            </ThemedText>
          </View>
          <View style={{ flex: 1 }}>
            <ThemedText style={[styles.userName, { color: theme.text }]}>{admin.staffName || admin.name}</ThemedText>
            <ThemedText style={[styles.userSub, { color: theme.textSecondary }]}>{admin.staffCode} • Administrative Officer</ThemedText>
          </View>
        </View>

        <View style={[styles.inputGroup, { zIndex: 10 }]}>
          <ThemedText style={[styles.label, { color: theme.textSecondary }]}>Purpose *</ThemedText>
          <TouchableOpacity
            style={[styles.inputWrap, { backgroundColor: theme.surface, borderColor: showPurposePicker ? theme.primary : theme.border }]}
            onPress={() => setShowPurposePicker(v => !v)}
          >
            <Ionicons name="document-text-outline" size={18} color={theme.textTertiary} />
            <ThemedText style={[styles.input, { color: purpose ? theme.text : theme.textTertiary }]}>
              {purpose || 'Select purpose'}
            </ThemedText>
            <Ionicons name={showPurposePicker ? 'chevron-up' : 'chevron-down'} size={18} color={theme.textSecondary} />
          </TouchableOpacity>
          {showPurposePicker && (
            <View style={[styles.dropdown, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              {PURPOSE_OPTIONS.map((item, index) => (
                <TouchableOpacity
                  key={item}
                  style={[styles.dropdownOption, { borderBottomColor: theme.border }, index === PURPOSE_OPTIONS.length - 1 && { borderBottomWidth: 0 }, purpose === item && { backgroundColor: theme.primary + '15' }]}
                  onPress={() => { setPurpose(item); setShowPurposePicker(false); }}
                >
                  <ThemedText style={[styles.dropdownOptionText, { color: purpose === item ? theme.primary : theme.text }, purpose === item && { fontWeight: '700' }]}>{item}</ThemedText>
                  {purpose === item && <Ionicons name="checkmark" size={16} color={theme.primary} />}
                </TouchableOpacity>
              ))}
            </View>
          )}
        </View>

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
        personName={admin.staffName || admin.name || 'Admin'}
        personId={admin.staffCode}
        qrCodeData={qrCode}
        manualCode={manualCode}
        reason={purpose}
        showShare={true}
      />

      <ErrorModal visible={showError} type="general" title="Error" message={errorMsg} onClose={() => setShowError(false)} />
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
        message="You have unsaved changes. Going back will discard them."
        confirmText="Discard"
        cancelText="Keep editing"
        confirmColor="#DC2626"
        icon="trash-outline"
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
  dropdown: { borderWidth: 1, borderRadius: 12, marginTop: 4, overflow: 'hidden', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.1, shadowRadius: 6 },
  dropdownOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, paddingVertical: 13, borderBottomWidth: StyleSheet.hairlineWidth },
  dropdownOptionText: { flex: 1, fontSize: 14, fontWeight: '500' },
});

export default AdminSinglePassScreen;
