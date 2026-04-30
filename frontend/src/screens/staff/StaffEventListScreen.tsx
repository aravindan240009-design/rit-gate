import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl, Linking,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Staff, RITGateEvent } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import ErrorModal from '../../components/ErrorModal';

interface Props {
  staff: Staff;
  onBack: () => void;
  onUploadCsv: (event: RITGateEvent) => void;
}

const StaffEventListScreen: React.FC<Props> = ({ staff, onBack, onUploadCsv }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [events, setEvents] = useState<RITGateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const staffCode = staff.staffCode || (staff as any).staff_code || '';

  const loadEvents = useCallback(async () => {
    const res = await apiService.getStaffEvents(staffCode);
    if (res.success) setEvents(res.events as RITGateEvent[]);
    else { setErrorMessage(res.message || 'Failed to load events'); setErrorVisible(true); }
  }, [staffCode]);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const onRefresh = async () => { setRefreshing(true); await loadEvents(); setRefreshing(false); };

  const downloadTemplate = () => {
    const url = apiService.getCsvTemplateUrl();
    Linking.openURL(url).catch(() => {
      setErrorMessage('Could not open template URL. Please try from a browser.');
      setErrorVisible(true);
    });
  };

  const statusColor = (status: string) =>
    status === 'ACTIVE' ? '#16a34a' : status === 'COMPLETED' ? '#6b7280' : '#dc2626';

  const renderItem = ({ item }: { item: RITGateEvent }) => (
    <View style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
      <View style={styles.cardTop}>
        <View style={{ flex: 1 }}>
          <ThemedText style={styles.eventName}>{item.eventName}</ThemedText>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]}>
            {item.eventDate} · {item.venue || 'No venue'}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20', borderColor: statusColor(item.status) }]}>
          <ThemedText style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</ThemedText>
        </View>
      </View>
      {item.status === 'ACTIVE' && (
        <TouchableOpacity
          style={[styles.uploadBtn, { backgroundColor: theme.primary }]}
          onPress={() => onUploadCsv(item)}
        >
          <Ionicons name="cloud-upload-outline" size={16} color="#fff" />
          <ThemedText style={styles.uploadBtnText}>Upload Participant CSV</ThemedText>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>My Assigned Events</ThemedText>
        <TouchableOpacity onPress={downloadTemplate} style={styles.templateBtn}>
          <Ionicons name="download-outline" size={20} color={theme.primary} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.templateBanner, { backgroundColor: theme.primary + '15', borderColor: theme.primary + '40' }]}
        onPress={downloadTemplate}
      >
        <Ionicons name="document-text-outline" size={16} color={theme.primary} />
        <ThemedText style={[styles.templateBannerText, { color: theme.primary }]}>
          Download CSV Template for participant upload
        </ThemedText>
        <Ionicons name="download-outline" size={16} color={theme.primary} />
      </TouchableOpacity>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderItem}
          contentContainerStyle={events.length === 0 ? styles.centered : styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={theme.primary} />}
          ListEmptyComponent={
            <View style={styles.emptyWrap}>
              <Ionicons name="calendar-outline" size={48} color={theme.textSecondary} />
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No events assigned to you</ThemedText>
            </View>
          }
        />
      )}

      <ErrorModal type="general" visible={errorVisible} title="Error" message={errorMessage} onClose={() => setErrorVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '700' },
  templateBtn: { padding: 4 },
  templateBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1 },
  templateBannerText: { flex: 1, fontSize: 13, fontWeight: '600' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, gap: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start' },
  eventName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subText: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  uploadBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, borderRadius: 10, paddingVertical: 10 },
  uploadBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 15 },
});

export default StaffEventListScreen;
