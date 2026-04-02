import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, RefreshControl,
  StatusBar, Image, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty, ScreenName } from '../../types';
import { apiService } from '../../services/api.service';
import { useNotifications } from '../../context/NotificationContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { getRelativeTime, formatDateShort } from '../../utils/dateUtils';
import NotificationDropdown from '../../components/NotificationDropdown';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import GatePassQRModal from '../../components/GatePassQRModal';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import ConfirmationModal from '../../components/ConfirmationModal';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import ThemedText from '../../components/ThemedText';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';

interface NTFDashboardProps {
  ntf: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const NTFDashboard: React.FC<NTFDashboardProps> = ({ ntf, onLogout, onNavigate }) => {
  const { theme } = useTheme();
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [bottomTab, setBottomTab] = useState<'HOME' | 'NEW_PASS' | 'MY_REQUESTS' | 'PROFILE'>('HOME');
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualCode, setManualCode] = useState<string | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const { unreadCount, loadNotifications } = useNotifications();
  const { profileImage } = useProfile();

  useEffect(() => {
    loadRequests();
    loadNotifications(ntf.staffCode, 'staff');
  }, []);

  const loadRequests = async () => {
    try {
      const res = await apiService.getNTFOwnGatePassRequests(ntf.staffCode);
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
      console.error('NTF load requests error:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => { setRefreshing(true); loadRequests(); };

  const getInitials = (name: string) =>
    name.split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

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
      const res = await apiService.getGatePassQRCode(request.id, ntf.staffCode, true);
      if (res.success && res.qrCode) {
        setQrCodeData(res.qrCode.startsWith('data:image') ? res.qrCode : `data:image/png;base64,${res.qrCode}`);
        if (res.manualCode) setManualCode(res.manualCode);
      } else {
        setShowQRModal(false);
        setModalMessage(res.message || 'Could not fetch QR code.');
        setShowErrorModal(true);
      }
    } catch {
      setShowQRModal(false);
      setModalMessage('Failed to load QR code.');
      setShowErrorModal(true);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      {/* Header */}
      <View style={[styles.header, { backgroundColor: theme.surface }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => { setBottomTab('PROFILE'); onNavigate('PROFILE'); }}>
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={[styles.avatar, { backgroundColor: '#3B82F6' }]}>
                <ThemedText style={styles.avatarText}>{getInitials(ntf.staffName || 'NF')}</ThemedText>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>NON-TEACHING FACULTY</ThemedText>
            <ThemedText style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
              {(ntf.staffName || '').toUpperCase()}
            </ThemedText>
          </View>
        </View>
        <TouchableOpacity
          style={[styles.iconButton, { backgroundColor: theme.surfaceHighlight }]}
          onPress={() => onNavigate('NOTIFICATIONS')}
        >
          <Ionicons name="notifications-outline" size={24} color={theme.text} />
          {unreadCount > 0 && (
            <View style={[styles.notifDot, { backgroundColor: theme.success, borderColor: theme.surface }]} />
          )}
        </TouchableOpacity>
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
            ListHeaderComponent={
              <ThemedText style={[styles.sectionTitle, { color: theme.textSecondary }]}>
                MY REQUESTS
              </ThemedText>
            }
            renderItem={({ item: req }) => (
              <TouchableOpacity
                style={[styles.card, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                onPress={() => {
                  if (req.status === 'APPROVED') {
                    handleViewQR(req);
                  } else {
                    setSelectedRequest(req);
                    setShowDetailModal(true);
                  }
                }}
              >
                <View style={styles.cardRow}>
                  <View style={[styles.cardAvatar, { backgroundColor: theme.surfaceHighlight }]}>
                    <ThemedText style={[styles.cardAvatarText, { color: theme.textSecondary }]}>
                      {getInitials(ntf.staffName)}
                    </ThemedText>
                  </View>
                  <View style={styles.cardInfo}>
                    <ThemedText style={[styles.cardPurpose, { color: theme.text }]} numberOfLines={1}>
                      {req.purpose || 'Gate Pass'}
                    </ThemedText>
                    <ThemedText style={[styles.cardDate, { color: theme.textSecondary }]}>
                      {formatDateShort(req.requestDate || req.createdAt)}
                    </ThemedText>
                  </View>
                  <View style={[styles.statusBadge, { backgroundColor: getStatusColor(req.status) }]}>
                    <ThemedText style={styles.statusText}>{getStatusLabel(req.status)}</ThemedText>
                  </View>
                </View>
                {req.status === 'APPROVED' && (
                  <View style={[styles.qrHint, { borderTopColor: theme.border }]}>
                    <Ionicons name="qr-code-outline" size={14} color={theme.primary} />
                    <ThemedText style={[styles.qrHintText, { color: theme.primary }]}>Tap to view QR</ThemedText>
                  </View>
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.emptyState}>
                <Ionicons name="document-outline" size={56} color={theme.border} />
                <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No requests yet</ThemedText>
                <ThemedText style={[styles.emptySubText, { color: theme.textTertiary }]}>
                  Tap New Pass to create a gate pass
                </ThemedText>
              </View>
            }
          />
        )}
      </ScreenContentContainer>

      {/* Bottom Navigation */}
      <View style={[styles.bottomNav, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
        <TouchableOpacity style={styles.navItem} onPress={() => setBottomTab('HOME')}>
          <Ionicons name={bottomTab === 'HOME' ? 'home' : 'home-outline'} size={22}
            color={bottomTab === 'HOME' ? theme.primary : theme.textTertiary} />
          <ThemedText style={[styles.navLabel, bottomTab === 'HOME' && { color: theme.primary }, { color: theme.textTertiary }]}>Home</ThemedText>
          {bottomTab === 'HOME' && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setBottomTab('NEW_PASS'); setShowPassTypeModal(true); }}>
          <Ionicons name="add-circle-outline" size={32} color={theme.textSecondary} />
          <ThemedText style={[styles.navLabel, { color: theme.textTertiary }]}>New Pass</ThemedText>
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setBottomTab('MY_REQUESTS'); onNavigate('NTF_MY_REQUESTS'); }}>
          <Ionicons name={bottomTab === 'MY_REQUESTS' ? 'list' : 'list-outline'} size={22}
            color={bottomTab === 'MY_REQUESTS' ? theme.primary : theme.textTertiary} />
          <ThemedText style={[styles.navLabel, bottomTab === 'MY_REQUESTS' && { color: theme.primary }, { color: theme.textTertiary }]}>My Requests</ThemedText>
          {bottomTab === 'MY_REQUESTS' && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>

        <TouchableOpacity style={styles.navItem} onPress={() => { setBottomTab('PROFILE'); onNavigate('PROFILE'); }}>
          <Ionicons name={bottomTab === 'PROFILE' ? 'person' : 'person-outline'} size={22}
            color={bottomTab === 'PROFILE' ? theme.primary : theme.textTertiary} />
          <ThemedText style={[styles.navLabel, bottomTab === 'PROFILE' && { color: theme.primary }, { color: theme.textTertiary }]}>Profile</ThemedText>
          {bottomTab === 'PROFILE' && <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />}
        </TouchableOpacity>
      </View>

      <NotificationDropdown
        visible={showNotificationDropdown}
        onClose={() => setShowNotificationDropdown(false)}
        userId={ntf.staffCode}
        userType="staff"
      />

      {/* Pass Type Selection Modal — Single Pass + Guest Pre-Request (no bulk for NTF) */}
      <PassTypeBottomSheet
        visible={showPassTypeModal}
        onClose={() => {
          setShowPassTypeModal(false);
          setBottomTab('HOME');
        }}
        onSelectSingle={() => {
          setShowPassTypeModal(false);
          onNavigate('NEW_PASS_REQUEST');
        }}
        onSelectGuest={() => {
          setShowPassTypeModal(false);
          onNavigate('GUEST_PRE_REQUEST');
        }}
      />

      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onApprove={undefined}
        onReject={undefined}
      />

      <GatePassQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        qrCodeData={qrCodeData}
        manualCode={manualCode}
        personName={ntf.staffName}
        personId={ntf.staffCode}
        reason={selectedRequest?.reason}
      />

      <SuccessModal visible={showSuccessModal} title="Success" message={modalMessage} onClose={() => setShowSuccessModal(false)} />
      <ErrorModal visible={showErrorModal} title="Error" message={modalMessage} onClose={() => setShowErrorModal(false)} type="general" />
      <ConfirmationModal
        visible={showLogoutModal}
        title="Logout"
        message="Are you sure you want to logout?"
        onConfirm={onLogout}
        onCancel={() => setShowLogoutModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16, paddingVertical: 12, elevation: 2 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 10, flex: 1 },
  avatar: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  avatarImage: { width: 40, height: 40, borderRadius: 20 },
  avatarText: { color: '#FFF', fontSize: 15, fontWeight: '700' },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 10, fontWeight: '700', letterSpacing: 0.5 },
  userName: { fontSize: 14, fontWeight: '800' },
  iconButton: { width: 40, height: 40, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
  notifDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, borderWidth: 1.5 },
  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { flex: 1 },
  listContent: { padding: 16, paddingBottom: 20 },
  sectionTitle: { fontSize: 11, fontWeight: '700', letterSpacing: 0.8, marginBottom: 12 },
  card: { borderRadius: 14, borderWidth: 1, marginBottom: 10, overflow: 'hidden' },
  cardRow: { flexDirection: 'row', alignItems: 'center', padding: 14, gap: 12 },
  cardAvatar: { width: 38, height: 38, borderRadius: 19, alignItems: 'center', justifyContent: 'center' },
  cardAvatarText: { fontSize: 13, fontWeight: '700' },
  cardInfo: { flex: 1 },
  cardPurpose: { fontSize: 14, fontWeight: '700' },
  cardDate: { fontSize: 12, marginTop: 2 },
  statusBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8 },
  statusText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  qrHint: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 14, paddingVertical: 8, borderTopWidth: 1 },
  qrHintText: { fontSize: 12, fontWeight: '600' },
  emptyState: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyText: { fontSize: 16, fontWeight: '700' },
  emptySubText: { fontSize: 13 },
  bottomNav: { flexDirection: 'row', borderTopWidth: 1, paddingBottom: 8, paddingTop: 6 },
  navItem: { flex: 1, alignItems: 'center', gap: 2, position: 'relative', paddingVertical: 4 },
  navLabel: { fontSize: 10, fontWeight: '600' },
  activeIndicator: { position: 'absolute', bottom: 0, width: 20, height: 3, borderRadius: 2 },
});

export default NTFDashboard;
