import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
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

interface NTFMyRequestsScreenProps {
  user: NonTeachingFaculty;
  onBack?: () => void;
}

const NTFMyRequestsScreen: React.FC<NTFMyRequestsScreenProps> = ({ user, onBack }) => {
  const { theme } = useTheme();
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedBulkId, setSelectedBulkId] = useState<number | null>(null);

  const getRequestDate = (r: any) =>
    r.passType === 'BULK' ? (r.exitDateTime || r.createdAt || r.requestDate) : (r.requestDate || r.createdAt);
  const isUsedRequest = (r: any) => r.qrUsed === true || r.status === 'USED' || r.status === 'EXITED';

  const fetchRequests = async () => {
    try {
      const res = await apiService.getNTFOwnGatePassRequests(user.staffCode);
      const all: any[] = (res as any).requests || res.data || [];
      const filtered = all
        .filter(r => !isUsedRequest(r))
        .sort((a, b) => new Date(getRequestDate(b)).getTime() - new Date(getRequestDate(a)).getTime());
      setAllRequests(filtered);
    } catch (e) {
      console.error('NTF my requests error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => { fetchRequests(); }, []);

  const onRefresh = useCallback(() => {
    console.log('🔄 [REFRESH] NTF/MyRequests');
    setRefreshing(true);
    setLoading(false);
    fetchRequests();
  }, []);

  const getStatusBadge = (status: string) => {
    if (status === 'APPROVED') return { text: 'ACTIVE', bgColor: theme.success };
    if (status === 'REJECTED') return { text: 'REJECTED', bgColor: theme.error };
    return { text: 'PENDING', bgColor: theme.warning };
  };

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true });

  const getTimeAgo = (d: string) => {
    const diffMs = new Date().getTime() - new Date(d).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    return `${Math.floor(diffHours / 24)}d ago`;
  };

  const handleViewQR = async (req: any) => {
    setSelectedRequest(req);
    setQrCodeData(null);
    setManualCode(null);
    setShowQRModal(true);
    try {
      const res = await apiService.getGatePassQRCode(req.id, user.staffCode, true);
      if (res.success && res.qrCode) { setQrCodeData(res.qrCode); setManualCode(res.manualCode || null); }
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
          <View style={[styles.avatarCircle, { backgroundColor: theme.warning + '22' }]}>
            <ThemedText style={[styles.avatarText, { color: theme.warning }]}>{initials}</ThemedText>
          </View>
          <View style={styles.cardNameBlock}>
            <View style={styles.cardNameRow}>
              <ThemedText style={[styles.cardName, { color: theme.text }]} numberOfLines={1}>{name}</ThemedText>
              <View style={[styles.typePillInline, { backgroundColor: theme.inputBackground }]}>
                <ThemedText style={[styles.typePillInlineText, { color: theme.textSecondary }]}>{isBulk ? 'Bulk Pass' : 'Single Pass'}</ThemedText>
              </View>
            </View>
            <ThemedText style={[styles.cardSubtitle, { color: theme.textSecondary }]}>NTF • {user.department || 'Department'}</ThemedText>
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
            <ThemedText style={[styles.infoBoxText, { color: theme.text }]}>{formatDate(dateStr)}</ThemedText>
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
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <ThemedText style={[styles.headerTitle, { color: theme.text }]}>My Requests</ThemedText>
        </View>
        <SkeletonList count={5} />
        <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
          <TouchableOpacity style={styles.navItem} onPress={onBack}>
            <Ionicons name="home-outline" size={22} color={theme.textTertiary} />
            <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>Home</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="add-circle-outline" size={28} color={theme.textTertiary} />
            <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>New Pass</ThemedText>
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="list" size={22} color={theme.primary} />
            <ThemedText style={[styles.navLabel, { color: theme.primary, fontWeight: '700' }]}>My Requests</ThemedText>
            <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
          </TouchableOpacity>
          <TouchableOpacity style={styles.navItem}>
            <Ionicons name="person-outline" size={22} color={theme.textTertiary} />
            <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>Profile</ThemedText>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>My Requests</ThemedText>
      </View>

      <TopRefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.primary} pullEnabled={true}>
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
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={onBack}>
          <Ionicons name="home-outline" size={22} color={theme.textTertiary} />
          <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>Home</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="add-circle-outline" size={28} color={theme.textTertiary} />
          <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>New Pass</ThemedText>
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="list" size={22} color={theme.primary} />
          <ThemedText style={[styles.navLabel, { color: theme.primary, fontWeight: '700' }]}>My Requests</ThemedText>
          <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
        </TouchableOpacity>
        <TouchableOpacity style={styles.navItem}>
          <Ionicons name="person-outline" size={22} color={theme.textTertiary} />
          <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>Profile</ThemedText>
        </TouchableOpacity>
      </View>

      {/* NTF: direct to HR — no HOD step */}
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
          return [
            { label: 'Request Submitted', status: 'done' as const },
            { label: 'HR Approval', status: approved ? 'done' as const : rejected ? 'rejected' as const : 'pending' as const, remark: selectedRequest.hrRemark || (rejected ? selectedRequest.rejectionReason : undefined) },
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
        reason={selectedRequest?.reason || selectedRequest?.purpose}
      />

      <MyRequestsBulkModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        requestId={selectedBulkId || 0}
        userRole="STAFF"
        viewerRole="STAFF"
        currentUserId={user.staffCode}
        requesterInfo={{ name: user.staffName || 'Staff', role: 'NTF', department: user.department || '' }}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  bottomNav: { position: 'absolute', bottom: 0, left: 0, right: 0, flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, elevation: 8 },
  navItem: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  navLabel: { fontSize: 11, marginTop: 3, fontWeight: '500' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 28, height: 3, borderRadius: 2 },
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
});

export default NTFMyRequestsScreen;
