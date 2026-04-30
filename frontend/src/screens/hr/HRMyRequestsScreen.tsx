import React, { useState, useEffect, useCallback } from 'react';
import {
  View, StyleSheet, TouchableOpacity, ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { HR } from '../../types';
import { apiService } from '../../services/api';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';
import GatePassQRModal from '../../components/GatePassQRModal';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';
import TopRefreshControl from '../../components/TopRefreshControl';
import { SkeletonList } from '../../components/SkeletonCard';
import { formatDateTimeShortLocal, getRelativeTimeLocal, isTodayLocal, toTimestampLocal } from '../../utils/dateUtils';
import BottomNavBar from '../../components/BottomNavBar';
import PageHeader from '../../components/PageHeader';

const HR_TABS = [
  { key: 'HOME', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'NEW_PASS', label: 'New Pass', icon: 'add-circle-outline', isAdd: true },
  { key: 'MY_REQUESTS', label: 'My Requests', icon: 'list-outline', iconActive: 'list' },
  { key: 'EXITS', label: 'Gate Logs', icon: 'swap-vertical-outline', iconActive: 'swap-vertical' },
  { key: 'PROFILE', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

interface HRMyRequestsScreenProps {
  hr: HR;
  onBack: () => void;
  onNavigate?: (screen: 'HOME' | 'NEW_PASS' | 'MY_REQUESTS' | 'EXITS' | 'PROFILE') => void;
}

const HRMyRequestsScreen: React.FC<HRMyRequestsScreenProps> = ({ hr, onBack, onNavigate }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetail, setShowDetail] = useState(false);
  const [showQR, setShowQR] = useState(false);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);

  const fetchIdRef = React.useRef(0);

  const isToday = (dateValue?: string) => {
    if (!dateValue) return false;
    return isTodayLocal(dateValue);
  };

  const fetchRequests = useCallback(async () => {
    const myFetchId = ++fetchIdRef.current;
    try {
      const res = await apiService.getStaffOwnGatePassRequests(hr.hrCode);
      if (myFetchId !== fetchIdRef.current) return;
      const all: any[] = (res as any).requests || (res as any).data || [];
      const filtered = all
        .filter(r => r.status !== 'USED' && r.status !== 'EXITED')
        .filter(r => isToday(r.requestDate || r.createdAt))
        .sort((a, b) => toTimestampLocal(b.requestDate || b.createdAt) - toTimestampLocal(a.requestDate || a.createdAt));
      setRequests(filtered);
    } catch (e) {
      if (myFetchId !== fetchIdRef.current) return;
      console.error('HR my requests error:', e);
    } finally {
      // Always clear loading/refreshing — even if superseded by a newer fetch
      setLoading(false);
      setRefreshing(false);
    }
  }, [hr.hrCode]);

  useEffect(() => {
    fetchRequests();
    const interval = setInterval(fetchRequests, 5000);
    return () => clearInterval(interval);
  }, []);
  const onRefresh = () => {
    console.log('🔄 [REFRESH] HR/MyRequests'); setRefreshing(true); fetchRequests(); };

  const handleViewQR = async (req: any) => {
    if (req.status !== 'APPROVED') return;
    setSelectedRequest(req);
    setQrCode(null);
    setManualCode(null);
    setShowQR(true);
    try {
      const res = await apiService.getGatePassQRCode(req.id, hr.hrCode, true);
      if (res.success) { setQrCode(res.qrCode || null); setManualCode(res.manualCode || null); setQrExpiresAt(res.qrExpiresAt || null); }
    } catch { setShowQR(false); }
  };

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return { text: 'APPROVED', bg: theme.success };
    if (status === 'REJECTED') return { text: 'REJECTED', bg: theme.error };
    return { text: 'PENDING', bg: theme.warning };
  };

  const formatDate = (d: string) => formatDateTimeShortLocal(d);
  const getTimeAgo = (d: string) => getRelativeTimeLocal(d);

  const initials = (hr.hrName || hr.name || 'HR').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <PageHeader title="My Requests" />
        <SkeletonList count={5} />
        <BottomNavBar tabs={HR_TABS} activeKey="MY_REQUESTS" onPress={(key) => {
          if (key === 'HOME') onBack && onBack();
          else if (key === 'NEW_PASS') onNavigate && onNavigate('NEW_PASS');
          else if (key === 'EXITS') onNavigate && onNavigate('EXITS');
          else if (key === 'PROFILE') onNavigate && onNavigate('PROFILE');
        }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <TopRefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.primary} pullEnabled={true}>
      <PageHeader title="My Requests" />

        <ScreenContentContainer>
          {refreshing ? <SkeletonList count={5} /> : (
            <VerticalFlatList
              style={{ flex: 1 }}
              data={requests}
              keyExtractor={(item, i) => `${item.id}-${i}`}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
              decelerationRate="normal"
              renderItem={({ item: req }) => {
                const badge = getStatusBadge(req.status);
                const dateStr = req.requestDate || req.createdAt;
                return (
                  <TouchableOpacity
                    style={[styles.card, { backgroundColor: theme.surface }]}
                    onPress={() => { setSelectedRequest(req); setShowDetail(true); }}
                    activeOpacity={0.85}
                  >
                    <View style={styles.cardTop}>
                      <View style={[styles.avatar, { backgroundColor: theme.warning + '22' }]}>
                        <ThemedText style={[styles.avatarText, { color: theme.warning }]}>{initials}</ThemedText>
                      </View>
                      <View style={styles.cardInfo}>
                        <View style={styles.nameRow}>
                          <ThemedText style={[styles.name, { color: theme.text }]} numberOfLines={1}>
                            {hr.hrName || hr.name || 'HR'}
                          </ThemedText>
                          <View style={[styles.typePill, { backgroundColor: theme.inputBackground }]}>
                            <ThemedText style={[styles.typePillText, { color: theme.textSecondary }]}>Single Pass</ThemedText>
                          </View>
                        </View>
                        <ThemedText style={[styles.sub, { color: theme.textSecondary }]}>
                          HR • {hr.department || 'HR Department'}
                        </ThemedText>
                      </View>
                      <ThemedText style={[styles.timeAgo, { color: theme.textTertiary }]}>{getTimeAgo(dateStr)}</ThemedText>
                    </View>

                    <View style={[styles.infoBox, { backgroundColor: theme.inputBackground }]}>
                      <View style={styles.infoRow}>
                        <Ionicons name="document-text-outline" size={15} color={theme.textSecondary} />
                        <ThemedText style={[styles.infoText, { color: theme.text }]} numberOfLines={1}>
                          {req.purpose || req.reason || 'Gate Pass'}
                        </ThemedText>
                      </View>
                      <View style={styles.infoRow}>
                        <Ionicons name="calendar-outline" size={15} color={theme.textSecondary} />
                        <ThemedText style={[styles.infoText, { color: theme.text }]}>{formatDate(dateStr)}</ThemedText>
                      </View>
                    </View>

                    <View style={styles.cardBottom}>
                      <View style={[styles.statusTag, { backgroundColor: badge.bg + '22' }]}>
                        <View style={[styles.statusDot, { backgroundColor: badge.bg }]} />
                        <ThemedText style={[styles.statusText, { color: badge.bg }]}>{badge.text}</ThemedText>
                      </View>
                    </View>
                  </TouchableOpacity>
                );
              }}
              ListEmptyComponent={
                <View style={styles.empty}>
                  <Ionicons name="document-text-outline" size={64} color={theme.textTertiary} />
                  <ThemedText style={[styles.emptyText, { color: theme.text }]}>No requests found</ThemedText>
                  <ThemedText style={[styles.emptySub, { color: theme.textSecondary }]}>Your gate pass requests will appear here</ThemedText>
                </View>
              }
            />
          )}
        </ScreenContentContainer>
      </TopRefreshControl>

      {/* Bottom Navigation — 5 tabs for HR */}
      <BottomNavBar tabs={HR_TABS} activeKey="MY_REQUESTS" onPress={(key) => {
        if (key === 'HOME') onBack && onBack();
        else if (key === 'NEW_PASS') onNavigate && onNavigate('NEW_PASS');
        else if (key === 'EXITS') onNavigate && onNavigate('EXITS');
        else if (key === 'PROFILE') onNavigate && onNavigate('PROFILE');
      }} />

      <SinglePassDetailsModal
        visible={showDetail}
        onClose={() => setShowDetail(false)}
        request={selectedRequest}
        viewerRole="staff"
        onViewQR={(req) => { setShowDetail(false); handleViewQR(req); }}
        timelineSteps={[]}
      />

      <GatePassQRModal
        visible={showQR}
        onClose={() => setShowQR(false)}
        personName={hr.hrName || hr.name || 'HR'}
        personId={hr.hrCode}
        qrCodeData={qrCode}
        manualCode={manualCode}
        qrExpiresAt={qrExpiresAt}
        reason={selectedRequest?.purpose || selectedRequest?.reason}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1 },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 8, borderTopWidth: 1, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 8, position: 'relative' },
  navLabel: { fontSize: 12, marginTop: 4, fontWeight: '500' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 28, height: 3, borderRadius: 2 },
  listContent: { paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 },
  card: { borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.08, shadowRadius: 3 },
  cardTop: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatar: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 17, fontWeight: '700' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  name: { fontSize: 15, fontWeight: '700', flexShrink: 1 },
  typePill: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typePillText: { fontSize: 10, fontWeight: '700' },
  sub: { fontSize: 12, marginTop: 2 },
  timeAgo: { fontSize: 11, flexShrink: 0 },
  infoBox: { borderRadius: 10, padding: 12, gap: 8, marginBottom: 12 },
  infoRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoText: { fontSize: 13, fontWeight: '500', flex: 1 },
  cardBottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, gap: 5 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  qrBtn: { flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 12, paddingVertical: 7, borderRadius: 10 },
  qrBtnText: { fontSize: 12, fontWeight: '700', color: '#fff' },
  empty: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 17, fontWeight: '600', marginTop: 16 },
  emptySub: { fontSize: 13, marginTop: 6 },
});

export default HRMyRequestsScreen;
