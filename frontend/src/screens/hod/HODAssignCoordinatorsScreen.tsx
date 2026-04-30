import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HOD, RITGateEvent, EventCoordinator } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';

interface Props {
  hod: HOD;
  event: RITGateEvent;
  onBack: () => void;
}

const HODAssignCoordinatorsScreen: React.FC<Props> = ({ hod, event, onBack }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [allStaff, setAllStaff] = useState<any[]>([]);
  const [coordinators, setCoordinators] = useState<EventCoordinator[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(true);
  const [assigning, setAssigning] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [removeTarget, setRemoveTarget] = useState<string | null>(null);

  const hodCode = hod.hodCode || (hod as any).hod_code || '';

  const load = useCallback(async () => {
    setLoading(true);
    const [staffRes, coordRes] = await Promise.all([
      apiService.getHODDepartmentStaff(hodCode),
      apiService.getEventCoordinators(event.id),
    ]);
    if (staffRes.success) setAllStaff(staffRes.staff || []);
    if (coordRes.success) setCoordinators(coordRes.coordinators as EventCoordinator[]);
    setLoading(false);
  }, [hodCode, event.id]);

  useEffect(() => { load(); }, [load]);

  const assignedCodes = new Set(coordinators.map(c => c.staffCode));
  const filtered = allStaff.filter(s => {
    const name = (s.staffName || s.name || '').toLowerCase();
    const code = (s.staffCode || '').toLowerCase();
    return name.includes(search.toLowerCase()) || code.includes(search.toLowerCase());
  });

  const toggle = (code: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      if (next.has(code)) next.delete(code); else next.add(code);
      return next;
    });
  };

  const handleAssign = async () => {
    const toAssign = [...selected].filter(c => !assignedCodes.has(c));
    if (toAssign.length === 0) { setErrorMessage('No new staff selected to assign.'); setErrorVisible(true); return; }
    setAssigning(true);
    const res = await apiService.assignCoordinators(event.id, hodCode, toAssign);
    setAssigning(false);
    if (res.success) {
      setSelected(new Set());
      setSuccessVisible(true);
      await load();
    } else {
      setErrorMessage(res.message || 'Failed to assign coordinators.');
      setErrorVisible(true);
    }
  };

  const confirmRemove = (staffCode: string) => { setRemoveTarget(staffCode); setConfirmVisible(true); };

  const handleRemove = async () => {
    if (!removeTarget) return;
    setConfirmVisible(false);
    const res = await apiService.removeCoordinator(event.id, removeTarget);
    if (res.success) { await load(); }
    else { setErrorMessage(res.message || 'Failed to remove coordinator.'); setErrorVisible(true); }
    setRemoveTarget(null);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <View style={{ flex: 1, minWidth: 0 }}>
          <ThemedText style={styles.headerTitle} numberOfLines={1}>Assign Coordinators</ThemedText>
          <ThemedText style={[styles.headerSub, { color: theme.textSecondary }]} numberOfLines={1}>{event.eventName}</ThemedText>
        </View>
      </View>

      {loading ? (
        <View style={styles.centered}><ActivityIndicator size="large" color={theme.primary} /></View>
      ) : (
        <>
          {coordinators.length > 0 && (
            <View style={[styles.section, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
              <ThemedText style={styles.sectionTitle}>Assigned Coordinators</ThemedText>
              {coordinators.map(c => {
                const staffInfo = allStaff.find(s => s.staffCode === c.staffCode);
                const displayName = staffInfo?.staffName || staffInfo?.name || c.staffCode;
                return (
                  <View key={c.id} style={styles.coordRow}>
                    <Ionicons name="checkmark-circle" size={18} color="#16a34a" />
                    <View style={{ flex: 1 }}>
                      <ThemedText style={[styles.coordText, { color: theme.text }]}>{displayName}</ThemedText>
                      <ThemedText style={[styles.staffCode, { color: theme.textSecondary }]}>{c.staffCode}</ThemedText>
                    </View>
                    <TouchableOpacity onPress={() => confirmRemove(c.staffCode)} style={styles.removeBtn}>
                      <Ionicons name="trash-outline" size={18} color="#dc2626" />
                    </TouchableOpacity>
                  </View>
                );
              })}
            </View>
          )}

          <View style={[styles.searchWrap, { borderColor: theme.border, backgroundColor: theme.cardBackground }]}>
            <Ionicons name="search-outline" size={18} color={theme.textSecondary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              value={search}
              onChangeText={setSearch}
              placeholder="Search staff by name or code"
              placeholderTextColor={theme.textSecondary}
            />
          </View>

          <FlatList
            data={filtered}
            keyExtractor={(item) => item.staffCode}
            style={{ flex: 1 }}
            renderItem={({ item }) => {
              const code = item.staffCode || '';
              const isAssigned = assignedCodes.has(code);
              const isSelected = selected.has(code);
              return (
                <TouchableOpacity
                  style={[styles.staffRow, { borderBottomColor: theme.border }]}
                  onPress={() => !isAssigned && toggle(code)}
                  activeOpacity={isAssigned ? 1 : 0.7}
                >
                  <View style={[styles.checkbox, {
                    borderColor: isAssigned ? '#16a34a' : isSelected ? theme.primary : theme.border,
                    backgroundColor: isAssigned ? '#16a34a' : isSelected ? theme.primary : 'transparent',
                  }]}>
                    {(isAssigned || isSelected) && <Ionicons name="checkmark" size={14} color="#fff" />}
                  </View>
                  <View style={{ flex: 1 }}>
                    <ThemedText style={styles.staffName}>{item.staffName || item.name || code}</ThemedText>
                    <ThemedText style={[styles.staffCode, { color: theme.textSecondary }]}>{code} · {item.department || ''}</ThemedText>
                  </View>
                  {isAssigned && (
                    <View style={styles.assignedTag}>
                      <ThemedText style={styles.assignedTagText}>Assigned</ThemedText>
                    </View>
                  )}
                </TouchableOpacity>
              );
            }}
          />

          {selected.size > 0 && (
            <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
              <TouchableOpacity
                style={[styles.assignBtn, { backgroundColor: assigning ? theme.textSecondary : theme.primary }]}
                onPress={handleAssign}
                disabled={assigning}
              >
                {assigning
                  ? <ActivityIndicator color="#fff" size="small" />
                  : <ThemedText style={styles.assignBtnText}>Assign {selected.size} Coordinator{selected.size > 1 ? 's' : ''}</ThemedText>}
              </TouchableOpacity>
            </View>
          )}
        </>
      )}

      <SuccessModal
        visible={successVisible}
        title="Coordinators Assigned"
        message="Selected staff members have been notified."
        onClose={() => setSuccessVisible(false)}
      />
      <ErrorModal type="general" visible={errorVisible} title="Error" message={errorMessage} onClose={() => setErrorVisible(false)} />
      <ConfirmationModal
        visible={confirmVisible}
        title="Remove Coordinator"
        message={`Remove ${removeTarget} as Event Coordinator?`}
        onConfirm={handleRemove}
        onCancel={() => { setConfirmVisible(false); setRemoveTarget(null); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8, flexShrink: 0 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  headerSub: { fontSize: 13 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  section: { margin: 16, borderRadius: 12, padding: 14, borderWidth: 1 },
  sectionTitle: { fontSize: 13, fontWeight: '700', marginBottom: 10, opacity: 0.7 },
  coordRow: { flexDirection: 'row', alignItems: 'center', gap: 8, paddingVertical: 6 },
  coordText: { flex: 1, fontSize: 14, fontWeight: '600' },
  removeBtn: { padding: 4 },
  searchWrap: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 8, borderRadius: 10, borderWidth: 1, paddingHorizontal: 12, paddingVertical: 10 },
  searchInput: { flex: 1, fontSize: 15 },
  staffRow: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: StyleSheet.hairlineWidth },
  checkbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, alignItems: 'center', justifyContent: 'center' },
  staffName: { fontSize: 15, fontWeight: '600' },
  staffCode: { fontSize: 12, marginTop: 2 },
  assignedTag: { backgroundColor: '#16a34a20', paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  assignedTagText: { color: '#16a34a', fontSize: 11, fontWeight: '700' },
  footer: { padding: 16, borderTopWidth: 1 },
  assignBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  assignBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
});

export default HODAssignCoordinatorsScreen;
