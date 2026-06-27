import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HOD, RITGateEvent } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import SuccessModal from '../../components/SuccessModal';

interface Props {
  hod: HOD;
  onBack: () => void;
  onCreateEvent: () => void;
  onSelectEvent: (event: RITGateEvent) => void;
}

const HODEventListScreen: React.FC<Props> = ({ hod, onBack, onCreateEvent, onSelectEvent }) => {
  const { theme } = useTheme();
  const [events, setEvents] = useState<RITGateEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [deleteTarget, setDeleteTarget] = useState<RITGateEvent | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const loadEvents = useCallback(async () => {
    const hodCode = hod.hodCode || (hod as any).hod_code || '';
    const res = await apiService.getHODEvents(hodCode);
    if (res.success) {
      setEvents(res.events as RITGateEvent[]);
    } else {
      setErrorMessage(res.message || 'Failed to load events');
      setErrorVisible(true);
    }
  }, [hod]);

  useEffect(() => {
    setLoading(true);
    loadEvents().finally(() => setLoading(false));
    const interval = setInterval(loadEvents, 30000);
    return () => clearInterval(interval);
  }, [loadEvents]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadEvents();
    setRefreshing(false);
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    const res = await apiService.deleteEvent(deleteTarget.id);
    setDeleting(false);
    setDeleteTarget(null);
    if (res.success) {
      await loadEvents();
      setSuccessVisible(true);
    } else {
      setErrorMessage(res.message || 'Failed to delete event');
      setErrorVisible(true);
    }
  };

  const statusColor = (status: string) => {
    if (status === 'ACTIVE') return '#16a34a';
    if (status === 'COMPLETED') return '#6b7280';
    return '#dc2626';
  };

  const renderItem = ({ item }: { item: RITGateEvent }) => (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
      onPress={() => onSelectEvent(item)}
      activeOpacity={0.7}
    >
      <View style={styles.cardRow}>
        <View style={styles.cardLeft}>
          <ThemedText style={styles.eventName}>{item.eventName}</ThemedText>
          <ThemedText style={[styles.subText, { color: theme.textSecondary }]}>
            {item.eventDate} · {item.venue || 'No venue'}
          </ThemedText>
        </View>
        <View style={[styles.badge, { backgroundColor: statusColor(item.status) + '20', borderColor: statusColor(item.status) }]}>
          <ThemedText style={[styles.badgeText, { color: statusColor(item.status) }]}>{item.status}</ThemedText>
        </View>
      </View>
      <View style={styles.cardFooter}>
        <Ionicons name="people-outline" size={14} color={theme.textSecondary} />
        <ThemedText style={[styles.footerText, { color: theme.textSecondary }]}> Tap to manage coordinators</ThemedText>
        <View style={{ flex: 1 }} />
        <TouchableOpacity
          onPress={() => setDeleteTarget(item)}
          style={styles.deleteBtn}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons name="trash-outline" size={16} color="#dc2626" />
          <ThemedText style={styles.deleteText}>Delete</ThemedText>
        </TouchableOpacity>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle} numberOfLines={1}>My Events</ThemedText>
        <View style={styles.createBtnWrap}>
          <TouchableOpacity onPress={onCreateEvent} style={[styles.createBtn, { backgroundColor: theme.primary }]}>
            <Ionicons name="add" size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

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
              <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No events yet</ThemedText>
              <TouchableOpacity onPress={onCreateEvent} style={[styles.emptyBtn, { backgroundColor: theme.primary }]}>
                <ThemedText style={styles.emptyBtnText}>Create First Event</ThemedText>
              </TouchableOpacity>
            </View>
          }
        />
      )}

      <ConfirmationModal
        visible={deleteTarget !== null}
        title="Delete Event"
        message={deleteTarget
          ? `Delete "${deleteTarget.eventName}"? Any assigned coordinators will be notified, and all event passes will be removed. This cannot be undone.`
          : ''}
        confirmText={deleting ? 'Deleting…' : 'Delete'}
        onConfirm={handleDelete}
        onCancel={() => !deleting && setDeleteTarget(null)}
      />

      <SuccessModal
        visible={successVisible}
        title="Event Deleted"
        message="The event was removed and its coordinators have been notified."
        onClose={() => setSuccessVisible(false)}
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
  header: { alignItems: 'center', justifyContent: 'center', paddingHorizontal: 56, paddingVertical: 18, borderBottomWidth: 1 },
  backBtn: { position: 'absolute', left: 12, top: 0, bottom: 0, justifyContent: 'center', paddingHorizontal: 4, zIndex: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700', textAlign: 'center', textTransform: 'uppercase' },
  createBtnWrap: { position: 'absolute', right: 12, top: 0, bottom: 0, justifyContent: 'center', zIndex: 1 },
  createBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  list: { padding: 16, gap: 12 },
  card: { borderRadius: 12, padding: 16, borderWidth: 1, gap: 8 },
  cardRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between' },
  cardLeft: { flex: 1, marginRight: 12 },
  eventName: { fontSize: 16, fontWeight: '700', marginBottom: 4 },
  subText: { fontSize: 13 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20, borderWidth: 1 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardFooter: { flexDirection: 'row', alignItems: 'center', marginTop: 4 },
  footerText: { fontSize: 12 },
  deleteBtn: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 4 },
  deleteText: { color: '#dc2626', fontSize: 12, fontWeight: '700' },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  emptyWrap: { alignItems: 'center', gap: 12, paddingTop: 80 },
  emptyText: { fontSize: 15 },
  emptyBtn: { paddingHorizontal: 24, paddingVertical: 10, borderRadius: 24 },
  emptyBtnText: { color: '#fff', fontWeight: '700', fontSize: 14 },
});

export default HODEventListScreen;
