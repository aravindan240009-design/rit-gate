import React, { useState, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, FlatList,
  TextInput, ActivityIndicator, Modal, ScrollView,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Staff, RITGateEvent, EventPassRow } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';

interface Props {
  staff: Staff;
  event: RITGateEvent;
  initialRows: EventPassRow[];
  onBack: () => void;
  onConfirmed: (result: { total: number; issued: number; failed: number }) => void;
}

const validateRow = (row: EventPassRow, allRows: EventPassRow[]): EventPassRow => {
  const errors: string[] = [];
  if (!row.fullName?.trim()) errors.push('full_name required');
  if (!row.collegeName?.trim()) errors.push('college_name required');
  if (!row.phone?.trim()) errors.push('phone required');
  if (!row.email?.trim()) {
    errors.push('email required');
  } else if (!/^[A-Za-z0-9+_.-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(row.email.trim())) {
    errors.push('invalid email format');
  } else {
    const dupes = allRows.filter(r => r.rowIndex !== row.rowIndex && r.email?.trim().toLowerCase() === row.email?.trim().toLowerCase());
    if (dupes.length > 0) errors.push('duplicate email');
  }
  return { ...row, valid: errors.length === 0, errorMessage: errors.length > 0 ? errors.join('; ') : undefined };
};

const revalidateAll = (rows: EventPassRow[]): EventPassRow[] => rows.map(r => validateRow(r, rows));

const EventCsvPreviewScreen: React.FC<Props> = ({ staff, event, initialRows, onBack, onConfirmed }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [rows, setRows] = useState<EventPassRow[]>(() => revalidateAll(initialRows));
  const [confirming, setConfirming] = useState(false);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [editRow, setEditRow] = useState<EventPassRow | null>(null);
  const [errorVisible, setErrorVisible] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const staffCode = staff.staffCode || (staff as any).staff_code || '';
  const validCount = rows.filter(r => r.valid).length;
  const invalidCount = rows.filter(r => !r.valid).length;

  const deleteRow = useCallback((rowIndex: number) => {
    setRows(prev => revalidateAll(prev.filter(r => r.rowIndex !== rowIndex)));
  }, []);

  const saveEdit = useCallback((updated: EventPassRow) => {
    setRows(prev => revalidateAll(prev.map(r => r.rowIndex === updated.rowIndex ? updated : r)));
    setEditRow(null);
  }, []);

  const handleConfirm = async () => {
    setConfirmVisible(false);
    if (invalidCount > 0) {
      setErrorMessage(`Cannot confirm: ${invalidCount} invalid row${invalidCount > 1 ? 's' : ''} present. Please fix or remove them.`);
      setErrorVisible(true);
      return;
    }
    setConfirming(true);
    const res = await apiService.confirmEventCsvUpload(event.id, staffCode, rows.filter(r => r.valid));
    setConfirming(false);
    if (res.success && res.result) {
      onConfirmed(res.result as any);
    } else {
      setErrorMessage(res.message || 'Failed to confirm upload.');
      setErrorVisible(true);
    }
  };

  const renderItem = ({ item }: { item: EventPassRow }) => (
    <View style={[
      styles.rowCard,
      { backgroundColor: item.valid ? theme.cardBackground : '#fef2f2', borderColor: item.valid ? theme.border : '#fca5a5' },
    ]}>
      <View style={styles.rowTop}>
        <View style={{ flex: 1 }}>
          <ThemedText style={[styles.rowName, { color: item.valid ? theme.text : '#dc2626' }]}>{item.fullName || '—'}</ThemedText>
          <ThemedText style={[styles.rowSub, { color: theme.textSecondary }]}>{item.email || '—'}</ThemedText>
          <ThemedText style={[styles.rowSub, { color: theme.textSecondary }]}>{item.collegeName || '—'} · {item.phone || '—'}</ThemedText>
        </View>
        <View style={styles.rowActions}>
          <TouchableOpacity onPress={() => setEditRow({ ...item })} style={styles.actionBtn}>
            <Ionicons name="pencil-outline" size={18} color={theme.primary} />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => deleteRow(item.rowIndex)} style={styles.actionBtn}>
            <Ionicons name="trash-outline" size={18} color="#dc2626" />
          </TouchableOpacity>
        </View>
      </View>
      {!item.valid && item.errorMessage && (
        <View style={styles.errorRow}>
          <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
          <ThemedText style={styles.errorText}>{item.errorMessage}</ThemedText>
        </View>
      )}
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <TouchableOpacity onPress={onBack} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={styles.headerTitle}>Preview Participants</ThemedText>
      </View>

      <View style={[styles.summary, { backgroundColor: theme.cardBackground, borderBottomColor: theme.border }]}>
        <View style={styles.summaryItem}>
          <ThemedText style={styles.summaryCount}>{rows.length}</ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Total</ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryCount, { color: '#16a34a' }]}>{validCount}</ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Valid</ThemedText>
        </View>
        <View style={[styles.divider, { backgroundColor: theme.border }]} />
        <View style={styles.summaryItem}>
          <ThemedText style={[styles.summaryCount, { color: invalidCount > 0 ? '#dc2626' : theme.textSecondary }]}>{invalidCount}</ThemedText>
          <ThemedText style={[styles.summaryLabel, { color: theme.textSecondary }]}>Invalid</ThemedText>
        </View>
      </View>

      <FlatList
        data={rows}
        keyExtractor={(item) => item.rowIndex.toString()}
        renderItem={renderItem}
        contentContainerStyle={styles.list}
        style={{ flex: 1 }}
      />

      <View style={[styles.footer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
        {invalidCount > 0 && (
          <ThemedText style={styles.footerWarning}>Fix or remove {invalidCount} invalid row{invalidCount > 1 ? 's' : ''} before confirming.</ThemedText>
        )}
        <TouchableOpacity
          style={[styles.confirmBtn, { backgroundColor: (confirming || invalidCount > 0) ? theme.textSecondary : '#16a34a' }]}
          onPress={() => setConfirmVisible(true)}
          disabled={confirming || invalidCount > 0 || validCount === 0}
        >
          {confirming
            ? <ActivityIndicator color="#fff" size="small" />
            : <ThemedText style={styles.confirmBtnText}>Confirm &amp; Issue {validCount} QR Pass{validCount !== 1 ? 'es' : ''}</ThemedText>}
        </TouchableOpacity>
      </View>

      {/* Edit modal */}
      <Modal visible={!!editRow} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.editModal, { backgroundColor: theme.cardBackground }]}>
            <ThemedText style={styles.editTitle}>Edit Row {editRow?.rowIndex}</ThemedText>
            <ScrollView contentContainerStyle={{ gap: 10 }}>
              {([
                { key: 'fullName', label: 'Full Name *' },
                { key: 'email', label: 'Email *' },
                { key: 'collegeName', label: 'College Name *' },
                { key: 'phone', label: 'Phone *' },
                { key: 'studentId', label: 'Student ID' },
                { key: 'department', label: 'Department' },
                { key: 'course', label: 'Course' },
              ] as { key: keyof EventPassRow; label: string }[]).map(({ key, label }) => (
                <View key={key}>
                  <ThemedText style={[styles.editLabel, { color: theme.textSecondary }]}>{label}</ThemedText>
                  <TextInput
                    style={[styles.editInput, { borderColor: theme.border, backgroundColor: theme.inputBackground, color: theme.text }]}
                    value={(editRow?.[key] as string) || ''}
                    onChangeText={(v) => setEditRow(prev => prev ? { ...prev, [key]: v } : prev)}
                    placeholder={label}
                    placeholderTextColor={theme.textSecondary}
                  />
                </View>
              ))}
            </ScrollView>
            <View style={styles.editActions}>
              <TouchableOpacity onPress={() => setEditRow(null)} style={[styles.editCancelBtn, { borderColor: theme.border }]}>
                <ThemedText>Cancel</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => editRow && saveEdit(editRow)}
                style={[styles.editSaveBtn, { backgroundColor: theme.primary }]}
              >
                <ThemedText style={{ color: '#fff', fontWeight: '700' }}>Save</ThemedText>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <ConfirmationModal
        visible={confirmVisible}
        title="Confirm Upload"
        message={`Issue QR passes and send emails to ${validCount} participants? This cannot be undone.`}
        onConfirm={handleConfirm}
        onCancel={() => setConfirmVisible(false)}
      />
      <ErrorModal type="general" visible={errorVisible} title="Error" message={errorMessage} onClose={() => setErrorVisible(false)} />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { padding: 4, marginRight: 8 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  summary: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1 },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryCount: { fontSize: 22, fontWeight: '800' },
  summaryLabel: { fontSize: 12 },
  divider: { width: 1, height: 32 },
  list: { padding: 12, gap: 10 },
  rowCard: { borderRadius: 10, padding: 14, borderWidth: 1 },
  rowTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  rowName: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  rowActions: { flexDirection: 'row', gap: 4 },
  actionBtn: { padding: 6 },
  errorRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 8, paddingTop: 8, borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: '#fca5a5' },
  errorText: { fontSize: 12, color: '#dc2626', flex: 1 },
  footer: { padding: 16, borderTopWidth: 1, gap: 8 },
  footerWarning: { fontSize: 13, color: '#dc2626', textAlign: 'center' },
  confirmBtn: { borderRadius: 12, paddingVertical: 14, alignItems: 'center' },
  confirmBtnText: { color: '#fff', fontWeight: '700', fontSize: 15 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  editModal: { borderTopLeftRadius: 20, borderTopRightRadius: 20, padding: 20, maxHeight: '90%' },
  editTitle: { fontSize: 17, fontWeight: '700', marginBottom: 16 },
  editLabel: { fontSize: 12, fontWeight: '600', marginBottom: 4 },
  editInput: { borderWidth: 1, borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, fontSize: 14 },
  editActions: { flexDirection: 'row', gap: 12, marginTop: 16 },
  editCancelBtn: { flex: 1, borderRadius: 10, borderWidth: 1, paddingVertical: 12, alignItems: 'center' },
  editSaveBtn: { flex: 1, borderRadius: 10, paddingVertical: 12, alignItems: 'center' },
});

export default EventCsvPreviewScreen;
