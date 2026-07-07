import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
  TextInput, KeyboardAvoidingView, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DocumentPicker from 'react-native-document-picker';
import { Staff, RITGateEvent, EventPassRow } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import ErrorModal from '../../components/ErrorModal';

interface Props {
  staff: Staff;
  event: RITGateEvent;
  onBack: () => void;
  onPreview: (rows: EventPassRow[], event: RITGateEvent) => void;
  /** Called when a single entry is confirmed directly (bypasses preview) */
  onSingleIssued: (result: { total: number; issued: number; failed: number; skipped: number }) => void;
}

interface SingleForm {
  fullName: string;
  email: string;
  collegeName: string;
  phone: string;
  studentId: string;
  department: string;
  course: string;
}

const EMPTY_FORM: SingleForm = {
  fullName: '', email: '', collegeName: '', phone: '',
  studentId: '', department: '', course: '',
};

const EventCsvUploadScreen: React.FC<Props> = ({
  staff, event, onBack, onPreview, onSingleIssued,
}) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  // ── file upload state ──────────────────────────────────────────────────────
  const [fileName, setFileName]   = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  // ── single-entry state ─────────────────────────────────────────────────────
  const [form, setForm]               = useState<SingleForm>(EMPTY_FORM);
  const [submitting, setSubmitting]   = useState(false);
  const [formErrors, setFormErrors]   = useState<Partial<SingleForm>>({});

  // ── shared ─────────────────────────────────────────────────────────────────
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const staffCode = staff.staffCode || (staff as any).staff_code || '';

  // ── file pick ──────────────────────────────────────────────────────────────
  const pickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.csv,
          'text/csv',
          'text/comma-separated-values',
          // Excel MIME types
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
      });
      const file = result[0];
      if (!file) return;

      const nameLower = file.name?.toLowerCase() ?? '';
      if (!nameLower.endsWith('.csv') && !nameLower.endsWith('.xlsx')) {
        setErrorMessage('Only .csv or .xlsx files are accepted.');
        setErrorVisible(true);
        return;
      }

      setFileName(file.name);
      setUploading(true);

      const res = await apiService.uploadEventCsvPreview(
        event.id, staffCode, file.uri, file.name || 'upload.csv',
      );
      setUploading(false);

      if (res.success && res.rows) {
        onPreview(res.rows as EventPassRow[], event);
      } else {
        setErrorMessage(res.message || 'Failed to parse file. Please check the format.');
        setErrorVisible(true);
        setFileName(null);
      }
    } catch (e: any) {
      setUploading(false);
      if (!DocumentPicker.isCancel(e)) {
        setErrorMessage(e.message || 'File selection failed.');
        setErrorVisible(true);
      }
      setFileName(null);
    }
  };

  // ── single form validation ─────────────────────────────────────────────────
  const validateForm = (): boolean => {
    const errs: Partial<SingleForm> = {};
    if (!form.fullName.trim())    errs.fullName    = 'Required';
    if (!form.collegeName.trim()) errs.collegeName = 'Required';
    if (!form.phone.trim())       errs.phone       = 'Required';
    if (!form.email.trim()) {
      errs.email = 'Required';
    } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(form.email.trim())) {
      errs.email = 'Invalid email';
    }
    setFormErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSingleSubmit = async () => {
    if (!validateForm()) return;
    setSubmitting(true);
    try {
      const res = await apiService.addSingleEventPass(event.id, {
        fullName:    form.fullName.trim(),
        email:       form.email.trim(),
        collegeName: form.collegeName.trim(),
        phone:       form.phone.trim(),
        studentId:   form.studentId.trim() || undefined,
        department:  form.department.trim() || undefined,
        course:      form.course.trim() || undefined,
      });
      if (res.success && res.result) {
        setForm(EMPTY_FORM);
        setFormErrors({});
        onSingleIssued(res.result as any);
      } else {
        setErrorMessage(res.message || 'Failed to issue pass.');
        setErrorVisible(true);
      }
    } catch (e: any) {
      setErrorMessage(e.message || 'Failed to issue pass.');
      setErrorVisible(true);
    } finally {
      setSubmitting(false);
    }
  };

  const setField = (key: keyof SingleForm) => (val: string) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (formErrors[key]) setFormErrors(prev => ({ ...prev, [key]: undefined }));
  };

  // ── render ─────────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Upload Participants</ThemedText>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

          {/* Event info card */}
          <View style={[styles.eventCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>Event</ThemedText>
            <ThemedText style={styles.cardValue}>{event.eventName}</ThemedText>
            <ThemedText style={[styles.cardMeta, { color: theme.textSecondary }]}>
              {event.eventDate} · {event.venue || 'No venue'}
            </ThemedText>
          </View>

          {/* ── SECTION 1: File upload ── */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="cloud-upload-outline" size={18} color={theme.primary} />
              <ThemedText style={styles.sectionTitle}>Upload CSV or Excel</ThemedText>
            </View>

            <View style={styles.columnList}>
              {['full_name *', 'email *', 'college_name *', 'phone *', 'student_id', 'department', 'course'].map(col => (
                <View key={col} style={[styles.colChip, {
                  backgroundColor: col.includes('*') ? theme.primary + '15' : theme.border + '40',
                  borderColor: col.includes('*') ? theme.primary : theme.border,
                }]}>
                  <ThemedText style={[styles.colChipText, { color: col.includes('*') ? theme.primary : theme.textSecondary }]}>
                    {col}
                  </ThemedText>
                </View>
              ))}
            </View>

            <ThemedText style={[styles.formatNote, { color: theme.textSecondary }]}>
              Max 500 rows · Can upload multiple times · Duplicate emails are skipped automatically
            </ThemedText>

            <TouchableOpacity
              style={[styles.uploadArea, {
                borderColor: uploading ? theme.textSecondary : theme.primary,
                backgroundColor: theme.primary + '08',
              }]}
              onPress={pickFile}
              disabled={uploading}
              activeOpacity={0.7}
            >
              {uploading ? (
                <>
                  <ActivityIndicator size="large" color={theme.primary} />
                  <ThemedText style={[styles.uploadText, { color: theme.primary }]}>
                    Parsing {fileName}…
                  </ThemedText>
                </>
              ) : (
                <>
                  <Ionicons name="document-attach-outline" size={36} color={theme.primary} />
                  <ThemedText style={[styles.uploadText, { color: theme.primary }]}>
                    {fileName ? `Selected: ${fileName}` : 'Tap to select file'}
                  </ThemedText>
                  <View style={styles.fileTypePills}>
                    <View style={[styles.fileTypePill, { backgroundColor: theme.primary + '20', borderColor: theme.primary }]}>
                      <ThemedText style={[styles.fileTypeText, { color: theme.primary }]}>.csv</ThemedText>
                    </View>
                    <View style={[styles.fileTypePill, { backgroundColor: '#16a34a20', borderColor: '#16a34a' }]}>
                      <ThemedText style={[styles.fileTypeText, { color: '#16a34a' }]}>.xlsx</ThemedText>
                    </View>
                  </View>
                </>
              )}
            </TouchableOpacity>
          </View>

          {/* ── SECTION 2: Add single participant ── */}
          <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
            <View style={styles.sectionHeader}>
              <Ionicons name="person-add-outline" size={18} color={theme.primary} />
              <ThemedText style={styles.sectionTitle}>Add Single Participant</ThemedText>
            </View>
            <ThemedText style={[styles.formatNote, { color: theme.textSecondary }]}>
              Type in details directly to issue a single QR pass. Duplicate emails are rejected.
            </ThemedText>

            {/* Required fields */}
            {([
              { key: 'fullName',    label: 'Full Name *',     keyboard: 'default' },
              { key: 'email',       label: 'Email *',         keyboard: 'email-address' },
              { key: 'collegeName', label: 'College Name *',  keyboard: 'default' },
              { key: 'phone',       label: 'Phone *',         keyboard: 'phone-pad' },
            ] as { key: keyof SingleForm; label: string; keyboard: any }[]).map(({ key, label, keyboard }) => (
              <View key={key} style={styles.fieldWrap}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
                <TextInput
                  style={[
                    styles.fieldInput,
                    {
                      borderColor: formErrors[key] ? '#dc2626' : theme.border,
                      backgroundColor: theme.inputBackground,
                      color: theme.text,
                    },
                  ]}
                  value={form[key]}
                  onChangeText={setField(key)}
                  placeholder={label.replace(' *', '')}
                  placeholderTextColor={theme.textSecondary}
                  keyboardType={keyboard}
                  autoCapitalize={key === 'email' ? 'none' : 'words'}
                  autoCorrect={false}
                />
                {formErrors[key] && (
                  <ThemedText style={styles.fieldError}>{formErrors[key]}</ThemedText>
                )}
              </View>
            ))}

            {/* Optional fields */}
            {([
              { key: 'studentId',  label: 'Student ID'  },
              { key: 'department', label: 'Department'  },
              { key: 'course',     label: 'Course'      },
            ] as { key: keyof SingleForm; label: string }[]).map(({ key, label }) => (
              <View key={key} style={styles.fieldWrap}>
                <ThemedText style={[styles.fieldLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
                <TextInput
                  style={[styles.fieldInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
                  value={form[key]}
                  onChangeText={setField(key)}
                  placeholder={`${label} (optional)`}
                  placeholderTextColor={theme.textSecondary}
                  autoCorrect={false}
                />
              </View>
            ))}

            <TouchableOpacity
              style={[styles.singleBtn, { backgroundColor: submitting ? theme.textSecondary : theme.primary }]}
              onPress={handleSingleSubmit}
              disabled={submitting}
              activeOpacity={0.8}
            >
              {submitting
                ? <ActivityIndicator color="#fff" size="small" />
                : (
                  <>
                    <Ionicons name="send-outline" size={16} color="#fff" />
                    <ThemedText style={styles.singleBtnText}>Issue Pass &amp; Send Email</ThemedText>
                  </>
                )}
            </TouchableOpacity>
          </View>

        </ScrollView>
      </KeyboardAvoidingView>

      <ErrorModal
        type="general"
        visible={errorVisible}
        title="Error"
        message={errorMessage}
        onClose={() => setErrorVisible(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 18, borderBottomWidth: 1,
  },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  content: { padding: 16, gap: 16 },
  eventCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, marginTop: 4 },
  section: { borderRadius: 14, padding: 16, borderWidth: 1, gap: 12 },
  sectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  sectionTitle: { fontSize: 15, fontWeight: '700' },
  columnList: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
  colChip: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 8, borderWidth: 1 },
  colChipText: { fontSize: 11, fontWeight: '600' },
  formatNote: { fontSize: 12, lineHeight: 18 },
  uploadArea: {
    borderRadius: 14, borderWidth: 2, borderStyle: 'dashed',
    paddingVertical: 36, alignItems: 'center', gap: 10,
  },
  uploadText: { fontSize: 14, fontWeight: '700', textAlign: 'center' },
  fileTypePills: { flexDirection: 'row', gap: 8, marginTop: 2 },
  fileTypePill: { paddingHorizontal: 10, paddingVertical: 3, borderRadius: 20, borderWidth: 1 },
  fileTypeText: { fontSize: 11, fontWeight: '700' },
  fieldWrap: { gap: 4 },
  fieldLabel: { fontSize: 12, fontWeight: '600' },
  fieldInput: {
    borderWidth: 1, borderRadius: 10,
    paddingHorizontal: 12, paddingVertical: 10,
    fontSize: 14,
  },
  fieldError: { fontSize: 11, color: '#dc2626', marginTop: 2 },
  singleBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 8, borderRadius: 12, paddingVertical: 14, marginTop: 4,
  },
  singleBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default EventCsvUploadScreen;
