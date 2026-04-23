import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty } from '../../types';
import { apiService } from '../../services/api.service';
import { useTheme } from '../../context/ThemeContext';
import GatePassQRModal from '../../components/GatePassQRModal';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import MyRequestsBulkModal from '../../components/MyRequestsBulkModal';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import ThemedText from '../../components/ThemedText';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';
import TopRefreshControl from '../../components/TopRefreshControl';
import { SkeletonList } from '../../components/SkeletonCard';
import { formatDateTimeShort, formatDateTimeIST, getRelativeTime, isToday as isTodayUtil } from '../../utils/dateUtils';
import BottomNavBar from '../../components/BottomNavBar';
import PageHeader from '../../components/PageHeader';

const NCI_TABS = [
  { key: 'HOME', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'NEW_PASS', label: 'New Pass', icon: 'add-circle-outline', isAdd: true },
  { key: 'MY_REQUESTS', label: 'My Requests', icon: 'list-outline', iconActive: 'list' },
  { key: 'PROFILE', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

interface NCIMyRequestsScreenProps {
  user: NonTeachingFaculty;
  onBack?: () => void;
  onNavigate?: (screen: 'HOME' | 'NEW_PASS' | 'PROFILE') => void;
}

const NCIMyRequestsScreen: React.FC<NCIMyRequestsScreenProps> = ({ user, onBack, onNavigate }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [qrExpiresAt, setQrExpiresAt] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedBulkId, setSelectedBulkId] = useState<number | null>(null);


  const isToday = (dateValue?: string) => {
    if (!dateValue) return false;
    return isTodayUtil(dateValue);
  };
  const getRequestDate = (r: any) =>
    r.passType === 'BULK' ? (r.exitDateTime || r.createdAt || r.requestDate) : (r.requestDate || r.createdAt);
  const isUsedRequest = (r: any) => r.qrUsed === true || r.status === 'USED' || r.status === 'EXITED';

  const fetchIdRef = React.useRef(0);

  const fetchRequests = async () => {
    const myFetchId = ++fetchIdRef.current;
    try {
      const res = await apiService.getNonClassInchargeOwnRequests(user.staffCode);
      if (myFetchId !== fetchIdRef.current) return;
      const all: any[] = (res as any).requests || res.data || [];
      const filtered = all
        .filter(r => !isUsedRequest(r))
        .filter(r => isToday(r.requestDate || r.createdAt || 0))
        .sort((a, b) => new Date(getRequestDate(b)).getTime() - new Date(getRequestDate(a)).getTime());
      setAllRequests(filtered);
    } catch (e) {
      if (myFetchId !== fetchIdRef.current) return;
      console.error('NCI my requests error:', e);
    } finally {
      // Always clear loading/refreshing — even if superseded by a newer fetch
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const onRefresh = useCallback(() => {
    console.log('🔄 [REFRESH] NCI/MyRequests');
    setRefreshing(true);
    setLoading(true);
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return { text: 'ACTIVE', bgColor: theme.success };
    if (status === 'REJECTED') return { text: 'REJECTED', bgColor: theme.error };
    return { text: 'PENDING', bgColor: theme.warning };
  };

  const formatDate = (d: string, isBulk = false) => isBulk ? formatDateTimeIST(d) : formatDateTimeShort(d);
  const getTimeAgo = (d: string) => getRelativeTime(d);

  const handleViewQR = async (req: any) => {
    setSelectedRequest(req);
    setQrCodeData(null);
    setManualCode(null);
    setShowQRModal(true);
    try {
      const res = await apiService.getGatePassQRCode(req.id, user.staffCode, true);
      if (res.success && res.qrCode) { setQrCodeData(res.qrCode); setManualCode(res.manualCode || null); setQrExpiresAt(res.qrExpiresAt || null); }
      else setShowQRModal(false);
    } catch { setShowQRModal(false); }
  };

  const handleReviewRequest = (req: any) => {
    if (req.passType === 'BULK') { setSelectedBulkId(req.id); setShowBulkModal(true); }
    else { setSelectedRequest(req); setShowDetailModal(true); }
  };

  const renderCard = (request: any) => {
    const badge = getStatusBadge(request.status);
    const isBulk = request.passType === 'BULK';
    const name = user.staffName || 'Staff';
    const initials = name.split(' ').map((w: string) => w[0]).join('').slice(0, 2).toUpperCase();
    const dateStr = getRequestDate(request);

    return (
      <TouchableOpacity style={[styles.requestCard, { backgroundColor: theme.surface }]} onPress={() => handleReviewRequest(request)} activeOpacity={0.85}>
        <View style={styles.cardTopRow}>
          <View style={[styles.avatarCircle, { backgroundColor: theme.primary + '22' }]}>
            <ThemedText style={[styles.avatarText, { color: theme.primary }]}>{initials}</ThemedText>
          </View>
          <View style={styles.cardNameBlock}>
            <View style={styles.cardNameRow}>
              <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{name}</ThemedText>
              <View style={[styles.typePillInline, { backgroundColor: theme.inputBackground }]}>
                <ThemedText style={[styles.typePillInlineText, { color: theme.textSecondary }]}>{isBulk ? 'Bulk Pass' : 'Single Pass'}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>NCI • {user.department || 'Department'}</ThemedText>
          </View>
          <ThemedText style={[styles.cardTimeAgo, { color: theme.textTertiary }]}>{getTimeAgo(dateStr)}</ThemedText>
        </View>

        <View style={[styles.infoBox, { backgroundColor: theme.inputBackground }]}>
          <View style={styles.infoBoxRow}>
            <Ionicons name="document-text-outline" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.infoBoxText, { color: theme.text }]} numberOfLines={1}>{request.purpose || request.reason || 'Gate Pass Request'}</ThemedText>
          </View>
          <View style={styles.infoBoxRow}>
            <Ionicons name="calendar-outline" size={16} color={theme.textSecondary} />
            <ThemedText style={[styles.infoBoxText, { color: theme.text }]}>{formatDate(dateStr, isBulk)}</ThemedText>
          </View>
          {isBulk && (
            <View style={styles.infoBoxRow}>
              <Ionicons name="people-outline" size={16} color={theme.textSecondary} />
              <ThemedText style={[styles.infoBoxText, { color: theme.text }]}>
                {(() => {
                  const parts: string[] = [];
                  if ((request.staffCount ?? 0) > 0) parts.push(`Staff - ${request.staffCount}`);
                  if ((request.studentCount ?? 0) > 0) parts.push(`Students - ${request.studentCount}`);
                  return parts.length > 0 ? parts.join(', ') : `${request.participantCount || 0} Participants`;
                })()}
              </ThemedText>
            </View>
          )}
        </View>

        <View style={styles.cardBottomRow}>
          <View style={[styles.statusTag, { backgroundColor: badge.bgColor + '22' }]}>
            <View style={[styles.statusDot, { backgroundColor: badge.bgColor }]} />
            <ThemedText style={[styles.statusTagText, { color: badge.bgColor }]}>{badge.text}</ThemedText>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <PageHeader title="My Requests" />
        <SkeletonList count={5} />
      <BottomNavBar tabs={NCI_TABS} activeKey="MY_REQUESTS" onPress={(key) => {
        if (key === 'HOME') onBack && onBack();
        else if (key === 'NEW_PASS') onNavigate && onNavigate('NEW_PASS');
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
            style={[styles.content, { backgroundColor: theme.background }]}
            data={allRequests}
            keyExtractor={(r, i) => `${r.passType === 'BULK' ? 'bulk' : 'single'}-${r.id}-${i}`}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            contentContainerStyle={styles.scrollContent}
            renderItem={({ item }) => <View>{renderCard(item)}</View>}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-text-outline" size={64} color={theme.textTertiary} />
                <ThemedText style={[styles.emptyStateText, { color: theme.text }]}>No requests found</ThemedText>
                <ThemedText style={[styles.emptyStateSubtext, { color: theme.textSecondary }]}>Your requests will appear here</ThemedText>
              </View>
            }
          />
        )}
      </ScreenContentContainer>
      </TopRefreshControl>

      {/* Bottom Navigation */}
      <BottomNavBar tabs={NCI_TABS} activeKey="MY_REQUESTS" onPress={(key) => {
        if (key === 'HOME') onBack && onBack();
        else if (key === 'NEW_PASS') onNavigate && onNavigate('NEW_PASS');
        else if (key === 'PROFILE') onNavigate && onNavigate('PROFILE');
      }} />

      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        request={selectedRequest}
        viewerRole="staff"
        onViewQR={(req) => handleViewQR(req)}
        timelineSteps={selectedRequest ? (() => {
          const s = selectedRequest.status;
          const approved = s === 'APPROVED';
          const rejected = s === 'REJECTED';
          const hodDone = s === 'PENDING_HR' || approved;
          const hodRejected = rejected && selectedRequest.hodApproval === 'REJECTED';
          // Principal/Director: direct to HR (no HOD step)
          const isDirectHR = !selectedRequest.assignedHodCode;
          if (isDirectHR) {
            return [
              { label: 'Request Submitted', status: 'done' as const },
              { label: 'HR Approval', status: approved ? 'done' as const : rejected ? 'rejected' as const : 'pending' as const, remark: selectedRequest.hrRemark || (rejected ? selectedRequest.rejectionReason : undefined) },
            ];
          }
          return [
            { label: 'Request Submitted', status: 'done' as const },
            { label: 'HOD Approval', status: hodDone ? 'done' as const : hodRejected ? 'rejected' as const : 'pending' as const, remark: selectedRequest.hodRemark },
            { label: 'HR Approval', status: approved ? 'done' as const : (rejected && !hodRejected) ? 'rejected' as const : 'pending' as const, remark: selectedRequest.hrRemark || (rejected && !hodRejected ? selectedRequest.rejectionReason : undefined) },
          ];
        })() : []}
      />

      <GatePassQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        personName={user.staffName || 'Staff'}
        personId={user.staffCode}
        qrCodeData={qrCodeData}
        manualCode={manualCode}
        qrExpiresAt={qrExpiresAt}
        reason={selectedRequest?.reason || selectedRequest?.purpose}
      />

      <MyRequestsBulkModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        requestId={selectedBulkId || 0}
        userRole="STAFF"
        viewerRole="STAFF"
        currentUserId={user.staffCode}
        requesterInfo={{ name: user.staffName || 'Staff', role: 'NCI', department: user.department || '' }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },

  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingTop: 20, paddingBottom: 100 },
  emptyState: { paddingVertical: 80, alignItems: 'center' },
  emptyStateText: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyStateSubtext: { fontSize: 14, marginTop: 8 },
  requestCard: { borderRadius: 16, padding: 16, marginBottom: 12, elevation: 2 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, gap: 12 },
  avatarCircle: { width: 48, height: 48, borderRadius: 24, justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '700' },
  cardNameBlock: { flex: 1 },
  cardNameRow: { flexDirection: 'row', alignItems: 'center', gap: 8, flexWrap: 'wrap' },
  cardName: { fontSize: 16, fontWeight: '700', flexShrink: 1 },
  typePillInline: { borderRadius: 6, paddingHorizontal: 8, paddingVertical: 3 },
  typePillInlineText: { fontSize: 10, fontWeight: '700', letterSpacing: 0.2 },
  cardSubtitle: { fontSize: 13, marginTop: 2 },
  cardTimeAgo: { fontSize: 12, flexShrink: 0 },
  infoBox: { borderRadius: 12, padding: 16, marginBottom: 12, gap: 12 },
  infoBoxRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  infoBoxText: { fontSize: 15, fontWeight: '500', flexShrink: 1 },
  cardBottomRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  statusTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20, gap: 6 },
  statusDot: { width: 6, height: 6, borderRadius: 3 },
  statusTagText: { fontSize: 12, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.4 },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  navLabel: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 28, height: 3, borderRadius: 2 },
});

export default NCIMyRequestsScreen;
