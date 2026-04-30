import React, { useState } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  ScrollView, ActivityIndicator, Platform,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { HOD } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

interface Props {
  hod: HOD;
  onBack: () => void;
  onCreated: () => void;
}

const HODCreateEventScreen: React.FC<Props> = ({ hod, onBack, onCreated }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [eventName, setEventName] = useState('');
  const [venue, setVenue] = useState('');
  const [eventDate, setEventDate] = useState<Date>(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const formatDateDisplay = (d: Date) =>
    d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });

  const formatDateISO = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  const handleSubmit = async () => {
    if (!eventName.trim()) { setErrorMessage('Event name is required.'); setErrorVisible(true); return; }
    if (!venue.trim()) { setErrorMessage('Venue is required.'); setErrorVisible(true); return; }

    const today = new Date(); today.setHours(0, 0, 0, 0);
    const selected = new Date(eventDate); selected.setHours(0, 0, 0, 0);
    if (selected < today) { setErrorMessage('Event date must be today or in the future.'); setErrorVisible(true); return; }

    setLoading(true);
    const hodCode = hod.hodCode || (hod as any).hod_code || '';
    const res = await apiService.createEvent(hodCode, eventName.trim(), formatDateISO(eventDate), venue.trim());
    setLoading(false);

    if (res.success) {
      setSuccessVisible(true);
    } else {
      setErrorMessage(res.message || 'Failed to create event.');
      setErrorVisible(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Create Event</ThemedText>
      </View>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <ThemedText style={styles.label}>Event Name *</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={eventName}
            onChangeText={setEventName}
            placeholder="e.g. National Level Symposium 2026"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={[styles.label, { marginTop: 16 }]}>Venue *</ThemedText>
          <TextInput
            style={[styles.input, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
            value={venue}
            onChangeText={setVenue}
            placeholder="e.g. Seminar Hall, Block A"
            placeholderTextColor={theme.textSecondary}
          />

          <ThemedText style={[styles.label, { marginTop: 16 }]}>Event Date *</ThemedText>
          <TouchableOpacity
            style={[styles.dateBtn, { borderColor: theme.border, backgroundColor: theme.inputBackground }]}
            onPress={() => setShowDatePicker(true)}
          >
            <Ionicons name="calendar-outline" size={18} color={theme.primary} />
            <ThemedText style={[styles.dateText, { color: theme.text }]}>{formatDateDisplay(eventDate)}</ThemedText>
          </TouchableOpacity>

          {showDatePicker && (
            <DateTimePicker
              value={eventDate}
              mode="date"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              minimumDate={new Date()}
              onChange={(_, selected) => {
                setShowDatePicker(Platform.OS === 'ios');
                if (selected) setEventDate(selected);
              }}
            />
          )}
        </View>

        <TouchableOpacity
          style={[styles.submitBtn, { backgroundColor: loading ? theme.textSecondary : theme.primary }]}
          onPress={handleSubmit}
          disabled={loading}
        >
          {loading
            ? <ActivityIndicator color="#fff" size="small" />
            : <ThemedText style={styles.submitText}>Create Event</ThemedText>}
        </TouchableOpacity>
      </ScrollView>

      <SuccessModal
        visible={successVisible}
        title="Event Created!"
        message={`"${eventName}" has been created. You can now assign coordinators.`}
        onClose={() => { setSuccessVisible(false); onCreated(); }}
      />
      <ErrorModal type="general"
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  scroll: { flex: 1 },
  content: { padding: 16, gap: 16 },
  section: { borderRadius: 12, padding: 16, borderWidth: 1 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  input: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 15 },
  dateBtn: { flexDirection: 'row', alignItems: 'center', gap: 8, borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 12 },
  dateText: { fontSize: 15 },
  submitBtn: { borderRadius: 12, paddingVertical: 16, alignItems: 'center' },
  submitText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default HODCreateEventScreen;
