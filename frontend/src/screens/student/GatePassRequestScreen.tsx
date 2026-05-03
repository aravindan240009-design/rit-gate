import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  StatusBar,
  Image,
  BackHandler,
  Linking,
  Modal,
  FlatList,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import ImagePicker from '../../utils/safeImagePicker';
import * as DocumentPicker from '../../shims/expoDocumentPicker';
import LinearGradient from 'react-native-linear-gradient';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Student, Staff, HOD } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { useActionLock } from '../../context/ActionLockContext';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ThemedText from '../../components/ThemedText';
import { VerticalScrollView } from '../../components/navigation/VerticalScrollViews';


interface GatePassRequestScreenProps {
  user: Student | Staff | HOD;
  navigation?: any;
  onBack?: () => void;
  isNTF?: boolean;
  isNCI?: boolean;
}

const PURPOSE_OPTIONS = [
  'Medical Appointment',
  'Family Emergency',
  'Official Meeting / Conference',
  'Personal Work',
  'Pre-Approved Visitor / Campus Visit',
];

const GatePassRequestScreen: React.FC<GatePassRequestScreenProps> = ({ user, navigation, onBack, isNTF = false, isNCI = false }) => {
  const { theme, isDark } = useTheme();
  const { withLock, isLocked } = useActionLock();
  const [purpose, setPurpose] = useState('');
  const [showPurposePicker, setShowPurposePicker] = useState(false);
  const [reason, setReason] = useState('');
  const [attachment, setAttachment] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [showConfirmSubmit, setShowConfirmSubmit] = useState(false);
  const [showBackConfirm, setShowBackConfirm] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const isImageAttachment = !!attachment?.name?.toLowerCase?.().match(/\.(jpg|jpeg|png|gif|webp)$/);

  const getUserDisplayName = () => {
    if (!user) return { fullName: 'User', firstLetter: 'U' };
    if ('firstName' in user) {
      return { fullName: `${user.firstName} ${user.lastName || ''}`, firstLetter: user.firstName.charAt(0) };
    }
    const name = (user as any).staffName || (user as any).hodName || 'User';
    return { fullName: name, firstLetter: name.charAt(0) };
  };

  const userInfo = getUserDisplayName();

  const handleGoBack = () => {
    if (navigation?.goBack) navigation.goBack();
    else if (onBack) onBack();
  };

  const confirmGoBack = () => {
    if (submitted || (!purpose.trim() && !reason.trim() && !attachment)) {
      handleGoBack();
    } else {
      setShowBackConfirm(true);
    }
  };

  useEffect(() => {
    const onBackPress = () => {
      confirmGoBack();
      return true;
    };
    const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => subscription.remove();
  }, [purpose, reason, attachment]);

  useEffect(() => {
    if (!user) {
      setErrorMessage('Session expired. Please log in again.');
      setShowErrorModal(true);
    }
  }, [user]);

  const pickDocument = async () => {
    try {
      const permResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (permResult.status !== 'granted') {
        await pickViaDocumentPicker();
        return;
      }
      const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], base64: true, quality: 0.7, allowsEditing: false });
      if (result.canceled) return;
      const asset = result.assets?.[0];
      if (!asset) {
        setErrorMessage('Could not read the selected file. Please try again.');
        setShowErrorModal(true);
        return;
      }
      const mimeType = asset.mimeType || 'image/jpeg';
      const fileName = asset.fileName || `attachment_${Date.now()}.jpg`;
      if (asset.base64) setAttachment({ name: fileName, base64Uri: `data:${mimeType};base64,${asset.base64}`, uri: asset.uri });
      else if (asset.uri) setAttachment({ name: fileName, base64Uri: asset.uri, uri: asset.uri });
    } catch (error: any) {
      await pickViaDocumentPicker();
    }
  };

  const pickViaDocumentPicker = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true, multiple: false });
      if (result.canceled) return;
      const file = result.assets?.[0];
      if (!file) return;
      setAttachment({ name: file.name || 'attachment', base64Uri: file.uri, uri: file.uri });
    } catch (err: any) {
      setErrorMessage('Could not open file picker.');
      setShowErrorModal(true);
    }
  };

  const doSubmit = async () => {
    const staffCode = (user as any).staffCode || ((user as any).userId && !(user as any).regNo && !(user as any).hodCode ? (user as any).userId : undefined);
    const hodCode = (user as any).hodCode;
    const regNo = (user as any).regNo;
    const isStaff = !!staffCode;
    const isHOD = !staffCode && !!hodCode;
    const identifier = staffCode || hodCode || regNo;
    const requestDate = new Date().toISOString();
    const payload = isStaff
      ? { staffCode: identifier, purpose: purpose.trim(), reason: reason.trim(), requestDate, attachmentUri: attachment?.base64Uri }
      : isHOD
      ? { staffCode: identifier, purpose: purpose.trim(), reason: reason.trim(), requestDate, attachmentUri: attachment?.base64Uri }
      : { regNo: identifier, purpose: purpose.trim(), reason: reason.trim(), requestDate, attachmentUri: attachment?.base64Uri || undefined };
    await withLock(async () => {
      try {
        let response;
        if (isNTF) {
          response = await apiService.submitNTFGatePassRequest(payload as any);
        } else if (isNCI) {
          const designation = (user as any).designation || (user as any).role || '';
          response = await apiService.submitNonClassInchargeRequest(
            (payload as any).staffCode, purpose.trim(), reason.trim(),
            requestDate, attachment?.base64Uri, designation
          );
        } else {
          response = (isStaff || isHOD) ? await apiService.submitStaffGatePassRequest(payload as any) : await apiService.submitGatePassRequest(payload as any);
        }
        if (response.success) { setSubmitted(true); setShowSuccessModal(true); }
        else { setErrorMessage(response.message || 'Failed to submit.'); setShowErrorModal(true); }
      } catch (error: any) { setErrorMessage(error.message || 'Error occurred.'); setShowErrorModal(true); }
    }, 'Submitting request...');
  };

  const handleSubmit = () => {
    if (isLocked) return;
    if (!purpose.trim() || !reason.trim()) {
      setErrorMessage('Please provide purpose and reason.');
      setShowErrorModal(true);
      return;
    }
    setShowConfirmSubmit(true);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={isDark ? "light-content" : "dark-content"} />
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={confirmGoBack}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>New Gate Pass Request</ThemedText>
        <View style={{ width: 44 }} />
      </View>
      <VerticalScrollView style={styles.content} showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
        <View>
          <View style={[styles.infoCard, { backgroundColor: theme.surface }]}>
            <View style={styles.avatarContainer}>
              <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                <ThemedText style={[styles.avatarText, { color: '#FFFFFF' }]}>{userInfo.firstLetter}</ThemedText>
              </View>
              <View>
                <ThemedText style={[styles.userName, { color: theme.text }]}>{userInfo.fullName}</ThemedText>
                <ThemedText style={[styles.userDetail, { color: theme.textSecondary }]}>Dept: {user?.department || 'AIDS'}</ThemedText>
              </View>
            </View>
            <View style={[styles.activeBadge, { backgroundColor: theme.success }]}>
              <ThemedText style={[styles.activeText, { color: '#FFFFFF' }]}>ACTIVE</ThemedText>
            </View>
          </View>
          <View style={styles.formSection}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>PURPOSE</ThemedText>
            <TouchableOpacity
              style={[styles.purposeInput, { backgroundColor: theme.surface, borderColor: theme.border, flexDirection: 'row', alignItems: 'center' }]}
              onPress={() => setShowPurposePicker(true)}
            >
              <ThemedText style={[{ flex: 1, fontSize: 14, color: purpose ? theme.text : theme.textTertiary }]}>
                {purpose || 'Select purpose'}
              </ThemedText>
              <Ionicons name="chevron-down" size={18} color={theme.textSecondary} />
            </TouchableOpacity>
            <Modal visible={showPurposePicker} transparent animationType="fade" onRequestClose={() => setShowPurposePicker(false)}>
              <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setShowPurposePicker(false)}>
                <View style={[styles.modalSheet, { backgroundColor: theme.surface }]}>
                  <ThemedText style={[styles.modalTitle, { color: theme.text }]}>Select Purpose</ThemedText>
                  <FlatList
                    data={PURPOSE_OPTIONS}
                    keyExtractor={item => item}
                    renderItem={({ item }) => (
                      <TouchableOpacity
                        style={[styles.modalOption, { borderBottomColor: theme.border }, purpose === item && { backgroundColor: theme.primary + '18' }]}
                        onPress={() => { setPurpose(item); setShowPurposePicker(false); }}
                      >
                        <ThemedText style={[styles.modalOptionText, { color: theme.text }, purpose === item && { color: theme.primary, fontWeight: '700' }]}>{item}</ThemedText>
                        {purpose === item && <Ionicons name="checkmark" size={18} color={theme.primary} />}
                      </TouchableOpacity>
                    )}
                  />
                </View>
              </TouchableOpacity>
            </Modal>
          </View>
          <View style={styles.formSection}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>REASON</ThemedText>
            <TextInput
              style={[styles.textArea, { backgroundColor: theme.surface, borderColor: theme.border, color: theme.text }]}
              placeholder="Reason"
              placeholderTextColor={theme.textTertiary}
              multiline
              value={reason}
              onChangeText={setReason}
            />
          </View>
          <View style={styles.formSection}>
            <ThemedText style={[styles.label, { color: theme.textSecondary }]}>ATTACHMENT</ThemedText>
            <TouchableOpacity
              style={[styles.uploadBtn, { backgroundColor: theme.surfaceHighlight, borderColor: theme.border }]}
              onPress={pickDocument}
            >
              <Ionicons name="attach-outline" size={22} color={theme.primary} />
              <ThemedText style={[styles.uploadText, { color: theme.textSecondary }]}>
                {attachment ? attachment.name : 'Attach image or PDF'}
              </ThemedText>
            </TouchableOpacity>
            {attachment && (
              isImageAttachment ? (
                <Image source={{ uri: attachment.base64Uri || attachment.uri }} style={styles.attachmentPreview} resizeMode="cover" />
              ) : (
                <TouchableOpacity
                  style={[styles.filePreview, { borderColor: theme.border, backgroundColor: theme.surface }]}
                  onPress={() => Linking.openURL(attachment.uri || attachment.base64Uri)}
                >
                  <Ionicons name="document-text-outline" size={20} color={theme.primary} />
                  <ThemedText style={[styles.filePreviewText, { color: theme.text }]} numberOfLines={1}>
                    Tap to preview {attachment.name}
                  </ThemedText>
                  <Ionicons name="open-outline" size={18} color={theme.textSecondary} />
                </TouchableOpacity>
              )
            )}
          </View>
          <TouchableOpacity style={[styles.submitBtn, isLocked && { opacity: 0.7 }]} onPress={handleSubmit} disabled={isLocked}>
            <LinearGradient colors={theme.gradients.primary as [string, string, ...string[]]} style={styles.btnGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 0 }}>
              <View style={styles.btnContent}>
                <Ionicons name="send" size={20} color="#FFF" />
                <ThemedText style={styles.submitText}>SUBMIT REQUEST</ThemedText>
              </View>
            </LinearGradient>
          </TouchableOpacity>
        </View>
      </VerticalScrollView>

      <ConfirmationModal
        visible={showConfirmSubmit}
        title="Submit Gate Pass Request"
        message="Are you sure you want to submit this gate pass request?"
        confirmText="Submit"
        onConfirm={() => { setShowConfirmSubmit(false); doSubmit(); }}
        onCancel={() => setShowConfirmSubmit(false)}
        icon="send-outline"
      />
      <ConfirmationModal
        visible={showBackConfirm}
        title="Discard Changes"
        message="You have unsaved changes. Are you sure you want to go back?"
        confirmText="Discard"
        onConfirm={() => { setShowBackConfirm(false); handleGoBack(); }}
        onCancel={() => setShowBackConfirm(false)}
        icon="arrow-back-outline"
      />
      <SuccessModal visible={showSuccessModal} title="Success" message="Submitted!" onClose={() => { setShowSuccessModal(false); handleGoBack(); }} />
      <ErrorModal visible={showErrorModal} title="Error" message={errorMessage} onClose={() => setShowErrorModal(false)} type="general" />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: '#F1F5F9' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 16 },
  infoCard: { padding: 12, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16, elevation: 2 },
  avatarContainer: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarText: { fontSize: 16, fontWeight: '700' },
  userName: { fontSize: 15, fontWeight: '700' },
  userDetail: { fontSize: 12 },
  activeBadge: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6 },
  activeText: { fontSize: 10, fontWeight: '700' },
  formSection: { marginBottom: 16 },
  label: { fontSize: 11, fontWeight: '700', marginBottom: 8, letterSpacing: 0.8 },
  purposeInput: { borderRadius: 12, padding: 12, fontSize: 14, borderWidth: 1 },
  textArea: { borderRadius: 12, padding: 12, minHeight: 90, fontSize: 14, borderWidth: 1, textAlignVertical: 'top' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 12, gap: 10, borderWidth: 1.5, borderStyle: 'dashed' },
  uploadText: { flex: 1, fontSize: 13 },
  attachmentPreview: { width: '100%', height: 140, borderRadius: 12, marginTop: 8 },
  filePreview: { marginTop: 8, borderWidth: 1, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
  filePreviewText: { flex: 1, fontSize: 13, fontWeight: '600' },
  submitBtn: { borderRadius: 14, overflow: 'hidden', marginTop: 8, elevation: 4 },
  btnGradient: { paddingVertical: 15, alignItems: 'center' },
  submitText: { color: '#FFF', fontSize: 15, fontWeight: '800' },
  btnContent: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalSheet: { borderTopLeftRadius: 20, borderTopRightRadius: 20, paddingTop: 16, paddingBottom: 32, maxHeight: '60%' },
  modalTitle: { fontSize: 14, fontWeight: '700', textAlign: 'center', marginBottom: 8, paddingHorizontal: 16 },
  modalOption: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  modalOptionText: { flex: 1, fontSize: 14 },
});

export default GatePassRequestScreen;
