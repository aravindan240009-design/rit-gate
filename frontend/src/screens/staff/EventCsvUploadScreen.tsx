import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
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
}

const EventCsvUploadScreen: React.FC<Props> = ({ staff, event, onBack, onPreview }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [fileName, setFileName] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const staffCode = staff.staffCode || (staff as any).staff_code || '';

  const pickFile = async () => {
    try {
      const result = await DocumentPicker.pick({ type: [DocumentPicker.types.csv, 'text/csv', 'text/comma-separated-values'] });
      const file = result[0];
      if (!file) return;
      if (!file.name?.toLowerCase().endsWith('.csv')) {
        setErrorMessage('Only .csv files are accepted.');
        setErrorVisible(true);
        return;
      }
      setFileName(file.name);
      setUploading(true);

      const res = await apiService.uploadEventCsvPreview(event.id, staffCode, file.uri, file.name || 'upload.csv');
      setUploading(false);

      if (res.success && res.rows) {
        onPreview(res.rows as EventPassRow[], event);
      } else {
        setErrorMessage(res.message || 'Failed to parse CSV. Please check the file format.');
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

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Upload Participants</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={[styles.eventCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={[styles.cardLabel, { color: theme.textSecondary }]}>Event</ThemedText>
          <ThemedText style={styles.cardValue}>{event.eventName}</ThemedText>
          <ThemedText style={[styles.cardMeta, { color: theme.textSecondary }]}>{event.eventDate} · {event.venue || 'No venue'}</ThemedText>
        </View>

        <View style={[styles.formatCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={styles.formatTitle}>Required CSV Format</ThemedText>
          <View style={styles.columnList}>
            {['full_name ✓', 'email ✓', 'college_name ✓', 'phone ✓', 'student_id', 'department', 'course'].map(col => (
              <View key={col} style={[styles.colChip, {
                backgroundColor: col.includes('✓') ? theme.primary + '15' : theme.border + '40',
                borderColor: col.includes('✓') ? theme.primary : theme.border,
              }]}>
                <ThemedText style={[styles.colChipText, { color: col.includes('✓') ? theme.primary : theme.textSecondary }]}>
                  {col.replace(' ✓', '')}
                  {col.includes('✓') && ' *'}
                </ThemedText>
              </View>
            ))}
          </View>
          <ThemedText style={[styles.formatNote, { color: theme.textSecondary }]}>
            Max 500 rows per upload. Only one upload per event is allowed.
          </ThemedText>
        </View>

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
              <ThemedText style={[styles.uploadText, { color: theme.primary }]}>Parsing {fileName}...</ThemedText>
            </>
          ) : (
            <>
              <Ionicons name="cloud-upload-outline" size={40} color={theme.primary} />
              <ThemedText style={[styles.uploadText, { color: theme.primary }]}>
                {fileName ? `Selected: ${fileName}` : 'Tap to select CSV file'}
              </ThemedText>
              <ThemedText style={[styles.uploadSub, { color: theme.textSecondary }]}>
                Only .csv files accepted
              </ThemedText>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>

      <ErrorModal type="general" visible={errorVisible} title="Upload Error" message={errorMessage} onClose={() => setErrorVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 16, gap: 16 },
  eventCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  cardLabel: { fontSize: 11, fontWeight: '700', textTransform: 'uppercase', marginBottom: 4 },
  cardValue: { fontSize: 17, fontWeight: '700' },
  cardMeta: { fontSize: 13, marginTop: 4 },
  formatCard: { borderRadius: 12, padding: 16, borderWidth: 1 },
  formatTitle: { fontSize: 14, fontWeight: '700', marginBottom: 12 },
  columnList: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  colChip: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 8, borderWidth: 1 },
  colChipText: { fontSize: 12, fontWeight: '600' },
  formatNote: { fontSize: 12, lineHeight: 18 },
  uploadArea: { borderRadius: 16, borderWidth: 2, borderStyle: 'dashed', paddingVertical: 48, alignItems: 'center', gap: 12 },
  uploadText: { fontSize: 15, fontWeight: '700', textAlign: 'center' },
  uploadSub: { fontSize: 13 },
});

export default EventCsvUploadScreen;
