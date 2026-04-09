import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, TextInput,
  StatusBar, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { Calendar } from 'react-native-calendars';
import { NonTeachingFaculty } from '../../types';
import { apiService } from '../../services/api';
import { notificationService } from '../../services/NotificationService';
import { formatDateTime } from '../../utils/dateUtils';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import { VerticalFlatList, VerticalScrollView } from '../../components/navigation/VerticalScrollViews';
import TopRefreshControl from '../../components/TopRefreshControl';

interface AdminScanHistoryScreenProps {
  admin: NonTeachingFaculty;
  onBack: () => void;
}

interface ScanRecord {
  id: number;
  name: string;
  type: string;
  purpose: string;
  inTime?: string;
  outTime?: string;
  entryTime?: string;
  exitTime?: string;
  status: string;
  regNo?: string;
  department?: string;
  reason?: string;
}

const toLocalDateKey = (d: Date) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
};

const AdminScanHistoryScreen: React.FC<AdminScanHistoryScreenProps> = ({ admin, onBack }) => {
  const { theme } = useTheme();
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ENTRY' | 'EXIT'>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  const [rangePickerPage, setRangePickerPage] = useState(false);
  const [rangeResultsVisible, setRangeResultsVisible] = useState(false);
  const [rangeMode, setRangeMode] = useState(false);
  const [fromDate, setFromDate] = useState<Date | null>(null);
  const [toDate, setToDate] = useState<Date | null>(null);
  const [selectingDateType, setSelectingDateType] = useState<'FROM' | 'TO'>('FROM');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => { loadScans(); }, []);
  const onRefresh = () => { setRefreshing(true); loadScans(); };

  const loadScans = async () => {
    try {
      const res = await apiService.getScanHistory('admin');
      if (res.success && res.data) {
        const mapped = res.data.map((scan: any) => {
          const inTime = scan.entryTime || scan.inTime;
          const outTime = scan.exitTime || scan.outTime;
          const isExitOnly = scan.status === 'EXITED' && inTime === outTime;
          let name = scan.name || scan.fullName || scan.studentName || scan.staffName;
          if (!name || name === 'Visitor-null' || name.includes('-null')) {
            name = scan.type === 'VISITOR' ? 'Visitor' : (name || 'User');
          }
          return { ...scan, name, inTime: isExitOnly ? undefined : inTime, outTime };
        });
        setScans(mapped);
      }
    } catch (e) { console.error('Admin scan history error:', e); }
    finally { setRefreshing(false); }
  };

  const formatTime = (t?: string) => {
    if (!t) return 'N/A';
    try { return formatDateTime(t); } catch { return t; }
  };

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);
  };

  const filteredScans = scans.filter(scan => {
    const eventDate = new Date(scan.outTime || scan.inTime || scan.entryTime || scan.exitTime || '');
    const inRange = (() => {
      if (!rangeMode) {
        const now = new Date();
        return eventDate.getFullYear() === now.getFullYear()
          && eventDate.getMonth() === now.getMonth()
          && eventDate.getDate() === now.getDate();
      }
      if (!fromDate && !toDate) return true;
      const fd = fromDate ?? new Date('1970-01-01');
      const td = toDate ?? new Date('2999-12-31');
      const from = new Date(fd.getFullYear(), fd.getMonth(), fd.getDate(), 0, 0, 0, 0);
      const to = new Date(td.getFullYear(), td.getMonth(), td.getDate(), 23, 59, 59, 999);
      return eventDate >= from && eventDate <= to;
    })();
    const matchesSearch = !searchQuery ||
      scan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.type?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.department?.toLowerCase().includes(searchQuery.toLowerCase());
    let matchesFilter = true;
    if (activeFilter === 'ENTRY') matchesFilter = scan.status === 'ENTERED' || (!scan.outTime && !!scan.inTime);
    else if (activeFilter === 'EXIT') matchesFilter = scan.status === 'EXITED' || !!scan.outTime;
    return inRange && matchesSearch && matchesFilter;
  });

  const exportPdf = async () => {
    setIsDownloading(true);
    try {
      const result = await notificationService.generatePdfReport({
        title: 'Campus Scan History Report',
        subtitle: rangeMode
          ? `From ${fromDate?.toLocaleDateString()} To ${toDate?.toLocaleDateString()}`
          : 'Today',
        sectionHeading: 'Scan records',
        brandFooterLine: 'RIT Gate Management System',
        filename: `Scan_History_${new Date().toISOString().slice(0, 10)}`,
        columns: [
          { key: 'name', label: 'NAME' },
          { key: 'type', label: 'TYPE' },
          { key: 'purpose', label: 'PURPOSE' },
          { key: 'status', label: 'STATUS' },
          { key: 'time', label: 'TIME' },
        ],
        rows: filteredScans.flatMap(scan => {
          const base = { name: scan.name, type: scan.type, purpose: scan.purpose || scan.reason || '-' };
          const rows: any[] = [];
          if (scan.inTime) rows.push({ ...base, status: 'ENTRY', time: formatTime(scan.inTime) });
          if (scan.outTime) rows.push({ ...base, status: 'EXIT', time: formatTime(scan.outTime) });
          if (rows.length === 0) rows.push({ ...base, status: scan.status, time: formatTime(scan.outTime || scan.inTime) });
          return rows;
        }),
      });
      if (result.success) { setSuccessMsg('PDF saved to Downloads.'); setShowSuccess(true); }
      else { setErrorMsg(result.message || 'Failed to generate PDF.'); setShowError(true); }
    } catch (e: any) { setErrorMsg(e?.message || 'Failed.'); setShowError(true); }
    finally { setIsDownloading(false); }
  };

  const applyDateRange = () => {
    if (!fromDate || !toDate) return;
    const from = new Date(fromDate.getFullYear(), fromDate.getMonth(), fromDate.getDate());
    const to = new Date(toDate.getFullYear(), toDate.getMonth(), toDate.getDate());
    if (from > to) return;
    setRangeMode(true);
    setRangePickerPage(false);
    setRangeResultsVisible(true);
  };

  const buildMarks = () => {
    const marks: Record<string, any> = {};
    if (!fromDate) return marks;
    const fromKey = toLocalDateKey(fromDate);
    const toKey = toDate ? toLocalDateKey(toDate) : null;
    if (!toKey || fromKey === toKey) {
      marks[fromKey] = { startingDay: true, endingDay: true, color: theme.primary, textColor: '#fff' };
    } else {
      marks[fromKey] = { startingDay: true, color: theme.primary, textColor: '#fff' };
      marks[toKey] = { endingDay: true, color: theme.primary, textColor: '#fff' };
      const cur = new Date(fromDate); cur.setDate(cur.getDate() + 1);
      const end = new Date(toDate!);
      while (cur < end) {
        marks[toLocalDateKey(cur)] = { color: '#E8F4FD', textColor: '#1a1a1a' };
        cur.setDate(cur.getDate() + 1);
      }
    }
    return marks;
  };

  const ScanCard = ({ scan }: { scan: ScanRecord }) => {
    const isExit = scan.status === 'EXITED' || !!scan.outTime;
    return (
      <View style={[styles.card, { backgroundColor: theme.surface }]}>
        <View style={[styles.cardAvatar, { backgroundColor: theme.primary + '20' }]}>
          <ThemedText style={[styles.cardAvatarText, { color: theme.primary }]}>{getInitials(scan.name)}</ThemedText>
        </View>
        <View style={styles.cardInfo}>
          <ThemedText style={[styles.cardName, { color: theme.text }]}>{scan.name}</ThemedText>
          <ThemedText style={[styles.cardType, { color: theme.primary }]}>{scan.type}</ThemedText>
          <ThemedText style={[styles.cardPurpose, { color: theme.textSecondary }]} numberOfLines={1}>{scan.purpose || scan.reason || '-'}</ThemedText>
        </View>
        <View style={styles.cardRight}>
          <View style={[styles.badge, { backgroundColor: (isExit ? theme.error : theme.success) + '15' }]}>
            <Ionicons name={isExit ? 'log-out' : 'log-in'} size={11} color={isExit ? theme.error : theme.success} />
            <ThemedText style={[styles.badgeText, { color: isExit ? theme.error : theme.success }]}>
              {isExit ? 'EXIT' : 'ENTRY'}
            </ThemedText>
          </View>
          <ThemedText style={[styles.cardTime, { color: theme.textTertiary }]}>
            {formatTime(scan.outTime || scan.inTime)}
          </ThemedText>
        </View>
      </View>
    );
  };

  // Range results page
  if (rangeResultsVisible) {
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.background} />
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={() => { setRangeResultsVisible(false); setRangeMode(false); }}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Date range results</ThemedText>
          <View style={[styles.countPill, { backgroundColor: theme.primary + '20' }]}>
            <ThemedText style={[styles.countPillText, { color: theme.primary }]}>{filteredScans.length}</ThemedText>
          </View>
        </View>
        <ScreenContentContainer style={{ flex: 1 }}>
          <VerticalFlatList
            style={{ flex: 1 }}
            data={filteredScans}
            keyExtractor={(s, i) => `${s.id}-${i}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadScans(); }} colors={[theme.primary]} />}
            ListHeaderComponent={
              <View style={[styles.rangeTop, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
                <ThemedText style={[styles.rangeTopSub, { color: theme.textSecondary }]}>
                  {fromDate?.toLocaleDateString()} — {toDate?.toLocaleDateString()}
                </ThemedText>
                <TouchableOpacity style={[styles.downloadBtn, { backgroundColor: theme.primary }]} onPress={exportPdf}>
                  <Ionicons name="download-outline" size={15} color="#fff" />
                  <ThemedText style={styles.downloadBtnText}>Download PDF</ThemedText>
                </TouchableOpacity>
              </View>
            }
            renderItem={({ item }) => <ScanCard scan={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={64} color={theme.border} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No records found</ThemedText>
              </View>
            }
          />
        </ScreenContentContainer>
        {isDownloading && (
          <View style={styles.overlay}>
            <View style={[styles.overlayBox, { backgroundColor: theme.surface }]}>
              <ActivityIndicator size="large" color={theme.primary} />
              <ThemedText style={[styles.overlayText, { color: theme.text }]}>Generating PDF...</ThemedText>
            </View>
          </View>
        )}
        <SuccessModal visible={showSuccess} title="Done" message={successMsg} onClose={() => setShowSuccess(false)} autoClose autoCloseDelay={3000} />
        <ErrorModal visible={showError} type="general" title="Error" message={errorMsg} onClose={() => setShowError(false)} />
      </SafeAreaView>
    );
  }

  // Date range picker page
  if (rangePickerPage) {
    const fromLabel = fromDate ? fromDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    const toLabel = toDate ? toDate.toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' }) : null;
    return (
      <SafeAreaView style={[styles.screen, { backgroundColor: '#ffffff' }]} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
        <View style={styles.skHeader}>
          <TouchableOpacity style={styles.skBackBtn} onPress={() => setRangePickerPage(false)}>
            <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
          </TouchableOpacity>
          <ThemedText style={styles.skHeaderTitle}>Select dates</ThemedText>
          <View style={{ width: 36 }} />
        </View>
        <View style={styles.skSummaryBar}>
          <TouchableOpacity style={[styles.skChip, selectingDateType === 'FROM' && styles.skChipActive]} onPress={() => setSelectingDateType('FROM')}>
            <ThemedText style={styles.skChipLabel}>FROM</ThemedText>
            <ThemedText style={[styles.skChipValue, selectingDateType === 'FROM' && { color: theme.primary }]}>{fromLabel ?? '—'}</ThemedText>
          </TouchableOpacity>
          <View style={styles.skDivider} />
          <TouchableOpacity style={[styles.skChip, selectingDateType === 'TO' && styles.skChipActive]} onPress={() => setSelectingDateType('TO')}>
            <ThemedText style={styles.skChipLabel}>TO</ThemedText>
            <ThemedText style={[styles.skChipValue, selectingDateType === 'TO' && { color: theme.primary }]}>{toLabel ?? '—'}</ThemedText>
          </TouchableOpacity>
        </View>
        <ThemedText style={styles.skInstruction}>{selectingDateType === 'FROM' ? 'Tap a start date' : 'Tap an end date'}</ThemedText>
        <ScreenContentContainer style={{ flex: 1 }}>
          <VerticalScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
            <Calendar
              onDayPress={(day) => {
                const selected = new Date(`${day.dateString}T00:00:00`);
                if (selectingDateType === 'FROM') {
                  setFromDate(selected); setSelectingDateType('TO');
                  if (toDate && toDate < selected) setToDate(null);
                } else {
                  if (fromDate && selected < fromDate) return;
                  setToDate(selected);
                }
              }}
              markedDates={buildMarks()}
              markingType="period"
              theme={{
                calendarBackground: '#ffffff', textSectionTitleColor: '#9CA3AF',
                selectedDayBackgroundColor: theme.primary, selectedDayTextColor: '#ffffff',
                todayTextColor: theme.primary, dayTextColor: '#1a1a1a', textDisabledColor: '#D1D5DB',
                arrowColor: '#1a1a1a', monthTextColor: '#1a1a1a',
                textMonthFontSize: 18, textMonthFontWeight: '800',
                textDayFontSize: 15, textDayFontWeight: '500',
                textDayHeaderFontSize: 12, textDayHeaderFontWeight: '700',
              }}
            />
          </VerticalScrollView>
        </ScreenContentContainer>
        <View style={styles.skBottomBar}>
          <TouchableOpacity style={styles.skClearBtn} onPress={() => { setFromDate(null); setToDate(null); setSelectingDateType('FROM'); }}>
            <ThemedText style={styles.skClearBtnText}>Clear</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.skApplyBtn, { backgroundColor: fromDate && toDate ? theme.primary : '#D1D5DB' }]}
            disabled={!fromDate || !toDate}
            onPress={applyDateRange}
          >
            <ThemedText style={styles.skApplyBtnText}>Apply</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // Main screen
  return (
    <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top']}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Scan History</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <TopRefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.primary} pullEnabled={false}>
        <ScreenContentContainer style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16 }}>
            <View style={[styles.searchBar, { backgroundColor: theme.surface, borderColor: theme.border }]}>
              <Ionicons name="search" size={18} color={theme.textTertiary} />
              <TextInput
                style={[styles.searchInput, { color: theme.text }]}
                placeholder="Search by name, type or department..."
                placeholderTextColor={theme.textTertiary}
                value={searchQuery}
                onChangeText={setSearchQuery}
              />
            </View>
            <View style={styles.actionsRow}>
              <TouchableOpacity style={[styles.rangeBtn, { backgroundColor: theme.surface, borderColor: theme.primary + '33' }]} onPress={() => setRangePickerPage(true)}>
                <Ionicons name="calendar-outline" size={15} color={theme.primary} />
                <ThemedText style={[styles.rangeBtnText, { color: theme.primary }]}>From / To</ThemedText>
              </TouchableOpacity>
            </View>
            <View style={styles.filterRow}>
              {(['ALL', 'ENTRY', 'EXIT'] as const).map(f => (
                <TouchableOpacity
                  key={f}
                  style={[styles.filterTab, { backgroundColor: theme.surface, borderColor: theme.border }, activeFilter === f && { backgroundColor: theme.primary, borderColor: theme.primary }]}
                  onPress={() => setActiveFilter(f)}
                >
                  <ThemedText style={[styles.filterTabText, { color: theme.textSecondary }, activeFilter === f && { color: '#fff' }]}>
                    {f === 'ALL' ? 'All' : f === 'ENTRY' ? 'Entry' : 'Exit'}
                  </ThemedText>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          <VerticalFlatList
            style={{ flex: 1 }}
            data={filteredScans}
            keyExtractor={(s, i) => `${s.id}-${i}`}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={[theme.primary]} />}
            renderItem={({ item }) => <ScanCard scan={item} />}
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="time-outline" size={64} color={theme.border} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No scan records for today</ThemedText>
              </View>
            }
          />
        </ScreenContentContainer>
      </TopRefreshControl>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  countPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  countPillText: { fontSize: 12, fontWeight: '700' },
  searchBar: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 12, paddingHorizontal: 14, paddingVertical: 11, borderWidth: 1, marginTop: 12, marginBottom: 10 },
  searchInput: { flex: 1, fontSize: 14 },
  actionsRow: { marginBottom: 10 },
  rangeBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderRadius: 10, borderWidth: 1, paddingVertical: 9 },
  rangeBtnText: { fontSize: 13, fontWeight: '700' },
  filterRow: { flexDirection: 'row', gap: 8, marginBottom: 12 },
  filterTab: { flex: 1, paddingVertical: 8, borderRadius: 8, alignItems: 'center', borderWidth: 1 },
  filterTabText: { fontSize: 13, fontWeight: '600' },
  listContent: { paddingHorizontal: 16, paddingBottom: 100 },
  card: { flexDirection: 'row', alignItems: 'center', borderRadius: 12, padding: 14, marginBottom: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  cardAvatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  cardAvatarText: { fontSize: 15, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardType: { fontSize: 12, fontWeight: '600', marginBottom: 1 },
  cardPurpose: { fontSize: 12 },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  badge: { flexDirection: 'row', alignItems: 'center', gap: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 10 },
  badgeText: { fontSize: 10, fontWeight: '700' },
  cardTime: { fontSize: 11 },
  rangeTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 10, borderBottomWidth: 1, marginBottom: 8 },
  rangeTopSub: { fontSize: 12, fontWeight: '600' },
  downloadBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 8 },
  downloadBtnText: { color: '#fff', fontSize: 12, fontWeight: '700' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 15, fontWeight: '600', marginTop: 16 },
  overlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.45)', justifyContent: 'center', alignItems: 'center', zIndex: 100 },
  overlayBox: { borderRadius: 20, paddingHorizontal: 32, paddingVertical: 28, alignItems: 'center', gap: 14 },
  overlayText: { fontSize: 15, fontWeight: '600' },
  // Skyscanner date picker styles
  skHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#ffffff' },
  skBackBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' },
  skHeaderTitle: { fontSize: 17, fontWeight: '700', color: '#1a1a1a' },
  skSummaryBar: { flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderRadius: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' },
  skChip: { flex: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' },
  skChipActive: { backgroundColor: '#EFF6FF' },
  skChipLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9CA3AF', marginBottom: 2 },
  skChipValue: { fontSize: 14, fontWeight: '700', color: '#1a1a1a' },
  skDivider: { width: 1, backgroundColor: '#E5E7EB', marginVertical: 8 },
  skInstruction: { fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 4 },
  skBottomBar: { flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E5E7EB' },
  skClearBtn: { flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' },
  skClearBtnText: { fontSize: 15, fontWeight: '700', color: '#6B7280' },
  skApplyBtn: { flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  skApplyBtnText: { fontSize: 15, fontWeight: '700', color: '#ffffff' },
});

export default AdminScanHistoryScreen;
