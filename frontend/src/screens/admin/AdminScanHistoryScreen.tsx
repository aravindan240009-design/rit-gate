import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ScrollView,
  StatusBar, BackHandler, RefreshControl, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar } from 'react-native-calendars';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import { notificationService } from '../../services/NotificationService';
import { formatDateShortLocal } from '../../utils/dateUtils';
import ThemedText from '../../components/ThemedText';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import { GateLogSkeletonList } from '../../components/SkeletonCard';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import BottomNavBar from '../../components/BottomNavBar';

const ADMIN_TABS = [
  { key: 'HOME', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'NEW_PASS', label: 'New Pass', icon: 'add-circle-outline', isAdd: true },
  { key: 'MY_REQUESTS', label: 'My Requests', icon: 'list-outline', iconActive: 'list' },
  { key: 'SCAN_HISTORY', label: 'Gate Logs', icon: 'time-outline', iconActive: 'time' },
  { key: 'PROFILE', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

interface AdminScanHistoryScreenProps {
  admin: NonTeachingFaculty;
  onBack: () => void;
  onNavigate?: (screen: ScreenName) => void;
}

const getInitials = (name: string) =>
  (name || 'NA').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

const AdminScanHistoryScreen: React.FC<AdminScanHistoryScreenProps> = ({ admin, onBack, onNavigate }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [gateLogs, setGateLogs] = useState<any[]>([]);
  const [refreshing, setRefreshing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [rangeModalVisible, setRangeModalVisible] = useState(false);
  const [fromDate, setFromDate] = useState('');
  const [toDate, setToDate] = useState('');
  const [selectingDateType, setSelectingDateType] = useState<'FROM' | 'TO'>('FROM');
  const [isDownloading, setIsDownloading] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [rangeLabel, setRangeLabel] = useState("Today's gate logs");
  const [bottomTab, setBottomTab] = useState<'HOME' | 'NEW_PASS' | 'MY_REQUESTS' | 'SCAN_HISTORY' | 'PROFILE'>('SCAN_HISTORY');
  const [showPassSheet, setShowPassSheet] = useState(false);

  // Keep a ref to cancel stale responses when a newer fetch starts
  const fetchSeqRef = React.useRef(0);

  useEffect(() => {
    loadGateLogs();
    const sub = BackHandler.addEventListener('hardwareBackPress', () => { onBack(); return true; });
    const interval = setInterval(() => loadGateLogs(fromDate || undefined, toDate || undefined), 30000);
    return () => { sub.remove(); clearInterval(interval); };
  }, []);

  const loadGateLogs = async (rangeFrom?: string, rangeTo?: string) => {
    // Increment sequence so any in-flight older fetch is ignored
    const seq = ++fetchSeqRef.current;
    setLoading(true);
    setFetchError(null);
    try {
      const response = await apiService.getAdminGateLogs(rangeFrom, rangeTo);
      // Discard result if a newer fetch has already started
      if (seq !== fetchSeqRef.current) return;
      if (response.success) {
        setGateLogs(response.logs || []);
      } else {
        // Server returned success:false — keep existing data and show error
        setFetchError(response.message || 'Failed to load gate logs. Pull down to retry.');
        console.error('Gate logs fetch returned success:false', response.message);
      }
    } catch (e: any) {
      if (seq !== fetchSeqRef.current) return;
      setFetchError(e?.message || 'Network error. Pull down to retry.');
      console.error('Error loading admin gate logs:', e);
    } finally {
      if (seq === fetchSeqRef.current) {
        setLoading(false);
        setRefreshing(false);
      }
    }
  };

  const onRefresh = () => {
    console.log('🔄 [REFRESH] Admin/ScanHistory');
    setRefreshing(true);
    loadGateLogs(fromDate || undefined, toDate || undefined);
  };

  const exportPdf = async () => {
    if (gateLogs.length === 0) {
      setModalMsg('No gate log records to download.');
      setShowError(true);
      return;
    }
    setIsDownloading(true);
    const filename = `Gate_Logs_${new Date().toISOString().slice(0, 10)}`;
    try {
      const result = await notificationService.generatePdfReport({
        title: 'Campus Gate Log Report',
        subtitle: rangeLabel,
        sectionHeading: 'Entry & Exit records',
        brandFooterLine: 'RIT Gate Management System',
        filename,
        columns: [
          { key: 'scanType', label: 'TYPE' },
          { key: 'userType', label: 'ROLE' },
          { key: 'userId', label: 'ID' },
          { key: 'name', label: 'NAME' },
          { key: 'department', label: 'DEPARTMENT' },
          { key: 'purpose', label: 'PURPOSE' },
          { key: 'time', label: 'TIME' },
        ],
        rows: gateLogs.map((r: any) => ({
          scanType: r.scanType || '-',
          userType: r.userType || '-',
          userId: r.userId || '-',
          name: r.name || '-',
          department: r.department || '-',
          purpose: r.purpose || '-',
          time: formatDateShortLocal(r.time),
        })),
      });
      if (result.success) {
        setModalMsg('PDF saved to Downloads.');
        setShowSuccess(true);
      } else {
        setModalMsg(result.message || 'Failed to generate PDF.');
        setShowError(true);
      }
    } catch (e: any) {
      setModalMsg(e?.message || 'Failed to generate PDF.');
      setShowError(true);
    } finally {
      setIsDownloading(false);
    }
  };

  const isEntry = (item: any) => item.scanType === 'ENTRY';

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]} edges={['top', 'left', 'right']}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <View style={{ width: 40 }} />
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>Gate Logs</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScreenContentContainer style={{ flex: 1 }}>
          <View style={{ paddingHorizontal: 16, paddingTop: 16 }}>
            <ThemedText style={[styles.hint, { color: theme.textSecondary }]}>
              {rangeLabel} — {loading ? 'Loading…' : `${gateLogs.length} record${gateLogs.length !== 1 ? 's' : ''}`}
            </ThemedText>
            <View style={styles.actions}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.primary }]} onPress={() => setRangeModalVisible(true)}>
                <Ionicons name="calendar-outline" size={16} color="#fff" />
                <ThemedText style={[styles.actionBtnText, { color: '#FFF' }]}>Date Range</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.actionBtn, { backgroundColor: gateLogs.length > 0 ? theme.success : theme.border }]}
                onPress={exportPdf}
                disabled={isDownloading}
              >
                {isDownloading
                  ? <ActivityIndicator size="small" color="#fff" />
                  : <Ionicons name="download-outline" size={16} color="#fff" />}
                <ThemedText style={[styles.actionBtnText, { color: '#FFF' }]}>Download PDF</ThemedText>
              </TouchableOpacity>
            </View>
          </View>

          {fetchError ? (
            <TouchableOpacity
              style={[styles.errorBanner, { backgroundColor: theme.error + '18', borderColor: theme.error + '40' }]}
              onPress={onRefresh}
              activeOpacity={0.7}
            >
              <Ionicons name="alert-circle-outline" size={16} color={theme.error} />
              <ThemedText style={[styles.errorBannerText, { color: theme.error }]} numberOfLines={2}>
                {fetchError}
              </ThemedText>
              <Ionicons name="refresh-outline" size={16} color={theme.error} />
            </TouchableOpacity>
          ) : null}

          {loading ? (
            <GateLogSkeletonList count={6} />
          ) : (
          <VerticalFlatList
            data={gateLogs}
            keyExtractor={(item, index) => `log-${item.id ?? item.userId ?? ''}-${item.scanType ?? ''}-${index}`}
            contentContainerStyle={[styles.listContent, { paddingBottom: 100 }]}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={[theme.primary]}
                tintColor={theme.primary}
              />
            }
            renderItem={({ item }) => {
              const entry = isEntry(item);
              const badgeColor = entry ? theme.success : theme.error;
              return (
                <View style={[styles.card, { backgroundColor: theme.surface, borderColor: theme.border, marginHorizontal: 4 }]}>
                  <View style={styles.cardTop}>
                    <View style={[styles.avatar, { backgroundColor: badgeColor + '18' }]}>
                      <ThemedText style={[styles.avatarText, { color: badgeColor }]}>{getInitials(item.name || item.userId)}</ThemedText>
                    </View>
                    <View style={styles.cardInfo}>
                      <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{item.name || item.userId || 'Unknown'}</ThemedText>
                      <ThemedText style={[styles.cardSub, { color: theme.textSecondary }]} numberOfLines={1}>
                        {item.userId}{item.department ? ` • ${item.department}` : ''}
                      </ThemedText>
                    </View>
                    <View style={[styles.badge, { backgroundColor: badgeColor + '15' }]}>
                      <ThemedText style={[styles.badgeText, { color: badgeColor }]}>{item.scanType || '-'}</ThemedText>
                    </View>
                  </View>
                  <View style={[styles.cardDetails, { backgroundColor: theme.inputBackground }]}>
                    <View style={styles.detailRow}>
                      <Ionicons name="person-outline" size={13} color={theme.textTertiary} />
                      <ThemedText style={[styles.detailText, { color: theme.text }]} numberOfLines={1}>{item.userType || '-'}</ThemedText>
                    </View>
                    {item.purpose && item.purpose !== '-' ? (
                      <View style={styles.detailRow}>
                        <Ionicons name="document-text-outline" size={13} color={theme.textTertiary} />
                        <ThemedText style={[styles.detailText, { color: theme.text }]} numberOfLines={1}>{item.purpose}</ThemedText>
                      </View>
                    ) : null}
                    <View style={styles.detailRow}>
                      <Ionicons name="time-outline" size={13} color={badgeColor} />
                      <ThemedText style={[styles.detailText, { color: badgeColor }]}>{formatDateShortLocal(item.time)}</ThemedText>
                    </View>
                  </View>
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.emptyCard}>
                <View style={[styles.emptyIconWrap, { backgroundColor: theme.border + '40' }]}>
                  <Ionicons name="swap-vertical-outline" size={40} color={theme.textTertiary} />
                </View>
                <ThemedText style={[styles.emptyTitle, { color: theme.text }]}>No gate log records</ThemedText>
                <ThemedText style={[styles.emptySub, { color: theme.textSecondary }]}>
                  No entry or exit records found for the selected period.
                </ThemedText>
              </View>
            }
          />
          )}
        </ScreenContentContainer>

      {/* Date Range Picker — full screen Skyscanner style */}
      {rangeModalVisible && (
        <View style={[StyleSheet.absoluteFillObject, { backgroundColor: '#ffffff', zIndex: 999 }]}>
          <SafeAreaView style={{ flex: 1, backgroundColor: '#ffffff' }} edges={['top', 'bottom']}>
            <StatusBar barStyle="dark-content" backgroundColor="#ffffff" />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 14 }}>
              <TouchableOpacity style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', alignItems: 'center', justifyContent: 'center' }} onPress={() => setRangeModalVisible(false)}>
                <Ionicons name="arrow-back" size={22} color="#1a1a1a" />
              </TouchableOpacity>
              <ThemedText style={{ fontSize: 17, fontWeight: '700', color: '#1a1a1a' }}>Select dates</ThemedText>
              <View style={{ width: 36 }} />
            </View>
            <View style={{ flexDirection: 'row', marginHorizontal: 16, marginBottom: 4, borderRadius: 14, backgroundColor: '#F9FAFB', borderWidth: 1, borderColor: '#E5E7EB', overflow: 'hidden' }}>
              <TouchableOpacity style={[{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' }, selectingDateType === 'FROM' && { backgroundColor: '#EFF6FF' }]} onPress={() => setSelectingDateType('FROM')}>
                <ThemedText style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9CA3AF', marginBottom: 2 }}>FROM</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '700', color: selectingDateType === 'FROM' ? theme.primary : '#1a1a1a' }}>{fromDate || '—'}</ThemedText>
              </TouchableOpacity>
              <View style={{ width: 1, backgroundColor: '#E5E7EB', marginVertical: 8 }} />
              <TouchableOpacity style={[{ flex: 1, paddingVertical: 12, paddingHorizontal: 16, alignItems: 'center' }, selectingDateType === 'TO' && { backgroundColor: '#EFF6FF' }]} onPress={() => setSelectingDateType('TO')}>
                <ThemedText style={{ fontSize: 10, fontWeight: '700', letterSpacing: 1, color: '#9CA3AF', marginBottom: 2 }}>TO</ThemedText>
                <ThemedText style={{ fontSize: 14, fontWeight: '700', color: selectingDateType === 'TO' ? theme.primary : '#1a1a1a' }}>{toDate || '—'}</ThemedText>
              </TouchableOpacity>
            </View>
            <ThemedText style={{ fontSize: 13, color: '#6B7280', textAlign: 'center', marginTop: 8, marginBottom: 4 }}>
              {selectingDateType === 'FROM' ? 'Tap a start date' : 'Tap an end date'}
            </ThemedText>
            <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 120 }}>
              <Calendar
                onDayPress={(day) => {
                  const d = day.dateString;
                  if (selectingDateType === 'FROM') {
                    setFromDate(d); setSelectingDateType('TO');
                    if (toDate && toDate < d) setToDate('');
                  } else {
                    if (fromDate && d < fromDate) return;
                    setToDate(d);
                  }
                }}
                markedDates={(() => {
                  const marks: Record<string, any> = {};
                  if (!fromDate) return marks;
                  if (!toDate || fromDate === toDate) {
                    marks[fromDate] = { startingDay: true, endingDay: true, color: theme.primary, textColor: '#fff' };
                  } else {
                    marks[fromDate] = { startingDay: true, color: theme.primary, textColor: '#fff' };
                    marks[toDate] = { endingDay: true, color: theme.primary, textColor: '#fff' };
                    const cur = new Date(fromDate + 'T00:00:00');
                    cur.setDate(cur.getDate() + 1);
                    const end = new Date(toDate + 'T00:00:00');
                    while (cur < end) {
                      const y = cur.getFullYear();
                      const mo = String(cur.getMonth() + 1).padStart(2, '0');
                      const d2 = String(cur.getDate()).padStart(2, '0');
                      marks[`${y}-${mo}-${d2}`] = { color: '#E8F4FD', textColor: '#1a1a1a' };
                      cur.setDate(cur.getDate() + 1);
                    }
                  }
                  return marks;
                })()}
                markingType="period"
                theme={{
                  calendarBackground: '#ffffff',
                  textSectionTitleColor: '#9CA3AF',
                  selectedDayBackgroundColor: theme.primary,
                  selectedDayTextColor: '#ffffff',
                  todayTextColor: theme.primary,
                  dayTextColor: '#1a1a1a',
                  textDisabledColor: '#D1D5DB',
                  arrowColor: '#1a1a1a',
                  monthTextColor: '#1a1a1a',
                  textMonthFontSize: 18,
                  textMonthFontWeight: '800',
                  textDayFontSize: 15,
                  textDayFontWeight: '500',
                  textDayHeaderFontSize: 12,
                  textDayHeaderFontWeight: '700',
                }}
              />
            </ScrollView>
            <View style={{ flexDirection: 'row', gap: 12, paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#E5E7EB' }}>
              <TouchableOpacity style={{ flex: 1, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: '#F3F4F6' }} onPress={() => { setFromDate(''); setToDate(''); setSelectingDateType('FROM'); setRangeLabel("Today's gate logs"); loadGateLogs(); setRangeModalVisible(false); }}>
                <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#6B7280' }}>Clear</ThemedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ flex: 2, paddingVertical: 14, borderRadius: 12, alignItems: 'center', backgroundColor: fromDate && toDate ? theme.primary : '#D1D5DB' }}
                disabled={!fromDate || !toDate}
                onPress={() => { setRangeModalVisible(false); setRangeLabel(`${fromDate} → ${toDate}`); loadGateLogs(fromDate, toDate); }}
              >
                <ThemedText style={{ fontSize: 15, fontWeight: '700', color: '#ffffff' }}>Apply</ThemedText>
              </TouchableOpacity>
            </View>
          </SafeAreaView>
        </View>
      )}

      <SuccessModal visible={showSuccess} title="Done" message={modalMsg} onClose={() => setShowSuccess(false)} autoClose autoCloseDelay={2500} />
      <ErrorModal visible={showError} type="general" title="Cannot Download" message={modalMsg} onClose={() => setShowError(false)} />

      {/* Bottom Navigation */}
      <BottomNavBar
        tabs={ADMIN_TABS}
        activeKey={bottomTab}
        onPress={(key) => {
          setBottomTab(key as typeof bottomTab);
          if (key === 'HOME') onBack();
          else if (key === 'NEW_PASS') setShowPassSheet(true);
          else if (key === 'MY_REQUESTS') onNavigate?.('ADMIN_MY_REQUESTS');
          else if (key === 'PROFILE') onNavigate?.('PROFILE');
        }}
      />

      <PassTypeBottomSheet
        visible={showPassSheet}
        onClose={() => { setShowPassSheet(false); setBottomTab('SCAN_HISTORY'); }}
        onSelectSingle={() => { setShowPassSheet(false); onNavigate?.('NEW_PASS_REQUEST'); }}
        onSelectGuest={() => { setShowPassSheet(false); onNavigate?.('GUEST_PRE_REQUEST'); }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safe: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  backBtn: { width: 40, height: 40, borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  listContent: { padding: 16, paddingBottom: 40 },
  hint: { fontSize: 14, marginBottom: 16 },
  actions: { flexDirection: 'row', gap: 12, marginBottom: 20 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 13, borderRadius: 12 },
  actionBtnText: { fontSize: 14, fontWeight: '700' },
  centered: { paddingVertical: 60, alignItems: 'center' },
  emptyCard: { borderRadius: 16, padding: 32, alignItems: 'center', gap: 12, marginTop: 8 },
  emptyIconWrap: { width: 72, height: 72, borderRadius: 36, justifyContent: 'center', alignItems: 'center', marginBottom: 4 },
  emptyTitle: { fontSize: 18, fontWeight: '700', textAlign: 'center' },
  emptySub: { fontSize: 14, textAlign: 'center', lineHeight: 22 },
  card: { borderRadius: 14, marginBottom: 12, borderWidth: 1, overflow: 'hidden', elevation: 2 },
  cardTop: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 15, fontWeight: '800' },
  cardInfo: { flex: 1, minWidth: 0 },
  cardName: { fontSize: 15, fontWeight: '700', marginBottom: 2 },
  cardSub: { fontSize: 12 },
  badge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, flexShrink: 0 },
  badgeText: { fontSize: 11, fontWeight: '700' },
  cardDetails: { paddingHorizontal: 14, paddingVertical: 10, gap: 6 },
  detailRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  detailText: { fontSize: 13, flex: 1 },
  errorBanner: { flexDirection: 'row', alignItems: 'center', gap: 8, marginHorizontal: 16, marginBottom: 12, padding: 12, borderRadius: 10, borderWidth: 1 },
  errorBannerText: { flex: 1, fontSize: 13, fontWeight: '500' },
});

export default AdminScanHistoryScreen;
