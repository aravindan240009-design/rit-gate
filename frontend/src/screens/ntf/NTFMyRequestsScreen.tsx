import React, { useState, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, RefreshControl, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty } from '../../types';
import { apiService } from '../../services/api.service';
import { useTheme } from '../../context/ThemeContext';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import GatePassQRModal from '../../components/GatePassQRModal';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import ThemedText from '../../components/ThemedText';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';
import { formatDateShort } from '../../utils/dateUtils';

interface NTFMyRequestsScreenProps {
  user: NonTeachingFaculty;
  onBack?: () => void;
}

const NTFMyRequestsScreen: React.FC<NTFMyRequestsScreenProps> = ({ user, onBack }) => {
  const { theme } = useTheme();
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);

  useEffect(() => { fetchRequests(); }, []);

  const fetchRequests = async () => {
    try {
      const res = await apiService.getNTFOwnGatePassRequests(user.staffCode);
      const all: any[] = (res as any).requests || res.data || [];
      const isUsed = (r: any) => r.qrUsed === true || r.status === 'USED' || r.status === 'EXITED';
      const isToday = (v?: string) => {
        if (!v) return false;
        const d = new Date(v);
        const n = new Date();
        return d.getFullYear() === n.getFullYear() && d.getMonth() === n.getMonth() && d.getDate() === n.getDate();
      };
      const filtered = all
        .filter(r => !isUsed(r))
        .filter(r =>
          r.status === 'PENDING' || r.status === 'PENDING_HR' || r.status === 'REJECTED' ||
          r.status === 'APPROVED' || isToday(r.requestDate || r.createdAt)
        )
        .sort((a, b) => new Date(b.requestDate || b.createdAt).getTime() - new Date(a.requestDate || a.createdAt).getTime());
      setRequests(filtered);
    } catch (e) {
      console.error('NTF my requests error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); fetchRequests(); };

  const getStatusColor = (status: string) => {
    if (status === 'APPROVED') return theme.success;
    if (status === 'REJECTED') return theme.error;
    return theme.warning;
  };

  const getStatusLabel = (status: string) => {
    if (status === 'PENDING_HR') return 'Pending HR';
    if (status === 'APPROVED') return 'Approved';
    if (status === 'REJECTED') return 'Rejected';
    return status;
  };

  const handleViewQR = async (request: any) => {
    setSelectedRequest(request);
    setQrCodeData(null);
    setManualCode(null);
    setShowQRModal(true);
    try {
      const res = await apiService.getGatePassQRCode(request.id, user.staffCode, true);
      if (res.success && res.qrCode) {
        setQrCodeData(res.qrCode.startsWith('data:image') ? res.qrCode : `data:image/png;base64,${res.qrCode}`);
        if (res.manualCode) setManualCode(res.manualCode);
      } else {
        setShowQRModal(false);
      }
    } catch {
      setShowQRModal(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <TouchableOpacity style={[styles.backBtn, { backgroundColor: theme.surfaceHighlight }]} onPress={onBack}>
          <Ionicons name="arrow-back" size={22} color={theme.text} />
        </TouchableOpacity>
        <ThemedText style={[styles.headerTitle, { color: theme.text }]}>My Requests</ThemedText>
        <View style={{ width: 40 }} />
      </View>

      <ScreenContentContainer>
        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={theme.primary} />
          </View>
        ) : (
          <VerticalFlatList
            style={styles.list}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
            contentContainerStyle={styles.listContent}
            showsVerticalScrollIndicator={false}
            decelerationRate="normal"
            data={requests}
            keyExtractor={(item) => item.id?.toString()}
            renderItem={({ item: req }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => {
                  if (req.status === 'APPROVED') handleViewQR(req);
                  else { setSelectedRequest(req); setShowDetailModal(true); }
                }}
              >
                <View style={styles.cardRow}>
                  <View style={styles.cardInfo}>
                    <ThemedText style={[styles.cardPurpose, { color: theme.text }]} numberOfLines={1}>
                      {req.purpose || 'Gate Pass'}
                    </ThemedText>
                    <ThemedText style={[styles.cardReason, { color: theme.textSecondary }]} numberOfLines={1}>
                      {req.reason || ''}
                    </ThemedText>
                    <ThemedText style={[styles.cardDate, { color: theme.textTertiary }]}>
                      {formatDateShort(req.requestDate || req.createdAt)}
                    </ThemedText>
                  </View>
                  <View>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) }]}>
                      <ThemedText style={styles.statusText}>{getStatusLabel(req.status)}</ThemedText>
                    </View>
                    {req.status === 'APPROVED' && (
                      <View style={styles.qrHint}>
                        <Ionicons name="qr-code-outline" size={12} color={theme.primary} />
                        <ThemedText style={[styles.qrHintText, { color: theme.primary }]}>View QR</ThemedText>
                      </View>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={56} color={theme.border} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No requests found</ThemedText>
              </View>
            }
          />
        )}
      </ScreenContentContainer>

      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onApprove={undefined}
        onReject={undefined}
        userRole="NTF"
      />

      <GatePassQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCodeData={qrCodeData}
        manualCode={manualCode}
        personName={user.staffName}
        personId={user.staffCode}
        reason={selectedRequest?.reason}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 10 },
  backBtn: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 17, fontWeight: '700' },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 20 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, padding: 14 },
  cardRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  cardInfo: { flex: 1 },
  cardPurpose: { fontSize: 14, fontWeight: '700' },
  cardReason: { fontSize: 12, marginTop: 2 },
  cardDate: { fontSize: 11, marginTop: 4 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: 'flex-end' },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 4, alignSelf: 'flex-end' },
  qrHintText: { fontSize: 11, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
});

export default NTFMyRequestsScreen;
