import React, { useState, useEffect } from 'react';
import {
  View, StyleSheet, TouchableOpacity, StatusBar, Image,
  TextInput,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { NonTeachingFaculty, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useRefresh } from '../../context/RefreshContext';
import { useProfile } from '../../context/ProfileContext';
import { useTheme } from '../../context/ThemeContext';
import { getRelativeTimeLocal, formatDateShortLocal, isTodayLocal, toTimestampLocal } from '../../utils/dateUtils';
import ErrorModal from '../../components/ErrorModal';
import SuccessModal from '../../components/SuccessModal';
import ScreenContentContainer from '../../components/ScreenContentContainer';
import ThemedText from '../../components/ThemedText';
import TopRefreshControl from '../../components/TopRefreshControl';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import { VerticalFlatList } from '../../components/navigation/VerticalScrollViews';
import { SkeletonList } from '../../components/SkeletonCard';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import BottomNavBar from '../../components/BottomNavBar';

const ADMIN_TABS = [
  { key: 'HOME', label: 'Home', icon: 'home-outline', iconActive: 'home' },
  { key: 'NEW_PASS', label: 'New Pass', icon: 'add-circle-outline', isAdd: true },
  { key: 'MY_REQUESTS', label: 'My Requests', icon: 'list-outline', iconActive: 'list' },
  { key: 'SCAN_HISTORY', label: 'Gate Logs', icon: 'time-outline', iconActive: 'time' },
  { key: 'PROFILE', label: 'Profile', icon: 'person-outline', iconActive: 'person' },
];

interface AdminDashboardProps {
  admin: NonTeachingFaculty;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ admin, onLogout, onNavigate }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const [refreshing, setRefreshing] = useState(false);
  const [allRequests, setAllRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [bottomTab, setBottomTab] = useState<'HOME' | 'NEW_PASS' | 'MY_REQUESTS' | 'SCAN_HISTORY' | 'PROFILE'>('HOME');
  const [showPassSheet, setShowPassSheet] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSuccess, setShowSuccess] = useState(false);
  const [showError, setShowError] = useState(false);
  const [modalMsg, setModalMsg] = useState('');
  const [selectedVisitor, setSelectedVisitor] = useState<any>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { unreadCount, loadNotifications } = useNotifications();
  const { refreshCount } = useRefresh();
  const { profileImage } = useProfile();

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'GOOD MORNING,';
    if (h < 17) return 'GOOD AFTERNOON,';
    return 'GOOD EVENING,';
  };

  const getInitials = (name: string) =>
    (name || 'AO').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  useEffect(() => {
    loadData();
    loadNotifications(admin.staffCode, 'staff');
    const interval = setInterval(loadData, 10000);
    return () => clearInterval(interval);
  }, []);
  useEffect(() => { if (refreshCount > 0) loadData(); }, [refreshCount]);

  const loadData = async () => {
    try {
      const res = await apiService.getVisitorRequestsForStaff(admin.staffCode);
      const all: any[] = res.requests || [];
      const isTodayRequest = (r: any) => {
        const d = r.createdAt || r.visitDate || r.requestDate;
        if (!d) return false;
        return isTodayLocal(d);
      };
      const websiteOnly = all.filter((r: any) => {
        const rb = (r.registeredBy || r.registered_by || '').toString();
        return (rb === 'WEBSITE' || rb.toUpperCase().startsWith('WEB-')) && isTodayRequest(r);
      });
      setAllRequests(websiteOnly);
    } catch (e) { console.error('Admin visitor load error:', e); }
    finally { setLoading(false); setRefreshing(false); }
  };

  const onRefresh = () => { setRefreshing(true); loadData(); };

  const filtered = allRequests.filter(r => {
    const matchesTab = activeTab === 'PENDING' ? r.status === 'PENDING'
      : activeTab === 'APPROVED' ? r.status === 'APPROVED'
      : r.status === 'REJECTED';
    const q = searchQuery.toLowerCase();
    const matchesSearch = !q || (r.requesterName || r.name || '').toLowerCase().includes(q)
      || (r.purpose || '').toLowerCase().includes(q);
    return matchesTab && matchesSearch;
  }).sort((a, b) => toTimestampLocal(b.createdAt || b.requestDate) - toTimestampLocal(a.createdAt || a.requestDate));

  const stats = {
    pending: allRequests.filter(r => r.status === 'PENDING').length,
    approved: allRequests.filter(r => r.status === 'APPROVED').length,
    rejected: allRequests.filter(r => r.status === 'REJECTED').length,
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <StatusBar barStyle={theme.type === 'dark' ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

      <TopRefreshControl refreshing={refreshing} onRefresh={onRefresh} color={theme.primary}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface }]}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => { setBottomTab('PROFILE'); onNavigate('PROFILE'); }}>
              {profileImage ? (
                <Image source={{ uri: profileImage }} style={styles.avatarImage} />
              ) : (
                <View style={[styles.avatar, { backgroundColor: theme.primary }]}>
                  <ThemedText style={styles.avatarText}>{getInitials(admin.staffName || admin.name || 'AO')}</ThemedText>
                </View>
              )}
            </TouchableOpacity>
            <View style={styles.headerInfo}>
              <ThemedText style={[styles.greeting, { color: theme.textSecondary }]}>{getGreeting()}</ThemedText>
              <ThemedText style={[styles.userName, { color: theme.text }]} numberOfLines={1}>
                {(admin.staffName || admin.name || 'ADMIN').toUpperCase()}
              </ThemedText>
            </View>
          </View>
          <TouchableOpacity style={[styles.iconButton, { backgroundColor: theme.surfaceHighlight }]} onPress={() => onNavigate('NOTIFICATIONS')}>
            <Ionicons name="notifications-outline" size={24} color={theme.text} />
            {unreadCount > 0 && <View style={[styles.notifDot, { backgroundColor: theme.error, borderColor: theme.surface }]} />}
          </TouchableOpacity>
        </View>

        <View style={{ paddingHorizontal: 20 }}>
          <View style={[styles.searchContainer, { backgroundColor: theme.surface }]}>
            <Ionicons name="search" size={20} color={theme.textTertiary} />
            <TextInput
              style={[styles.searchInput, { color: theme.text }]}
              placeholder="Search visitor requests..."
              placeholderTextColor={theme.textTertiary}
              value={searchQuery}
              onChangeText={setSearchQuery}
            />
          </View>
          <View style={[styles.statsContainer, { backgroundColor: theme.surface }]}>
            {(['PENDING', 'APPROVED', 'REJECTED'] as const).map(tab => (
              <TouchableOpacity
                key={tab}
                style={[styles.statTab, activeTab === tab && {
                  borderBottomColor: tab === 'PENDING' ? theme.warning : tab === 'APPROVED' ? theme.success : theme.error
                }]}
                onPress={() => setActiveTab(tab)}
              >
                <ThemedText style={[styles.statLabel, { color: theme.textTertiary },
                  activeTab === tab && { color: tab === 'PENDING' ? theme.warning : tab === 'APPROVED' ? theme.success : theme.error }
                ]}>{tab}</ThemedText>
                <ThemedText style={[styles.statValue, { color: theme.textSecondary }, activeTab === tab && { color: theme.text }]}>
                  {stats[tab.toLowerCase() as keyof typeof stats]}
                </ThemedText>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <ScreenContentContainer style={{ flex: 1 }}>
          {(loading || refreshing) ? <SkeletonList count={5} /> : (
            <VerticalFlatList
              style={styles.content}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
              decelerationRate="normal"
              data={filtered}
              keyExtractor={(item) => (item.requestId || item.id)?.toString()}
              renderItem={({ item: req }) => (
                <TouchableOpacity
                  style={[styles.requestCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
                  onPress={() => { setSelectedVisitor(req); setShowDetailModal(true); }}
                >
                  <View style={styles.cardTopRow}>
                    <View style={[styles.avatarContainer, { backgroundColor: theme.surfaceHighlight }]}>
                      <ThemedText style={[styles.requestAvatarText, { color: theme.textSecondary }]}>
                        {getInitials(req.requesterName || req.name || 'VR')}
                      </ThemedText>
                    </View>
                    <View style={styles.headerMainInfo}>
                      <ThemedText style={[styles.requestStudentName, { color: theme.text }]} numberOfLines={1}>
                        {req.requesterName || req.name || 'Visitor'}
                      </ThemedText>
                      <ThemedText style={[styles.studentIdSub, { color: theme.textSecondary }]}>
                        {req.visitorEmail || req.email || ''}{req.visitorPhone ? ` • ${req.visitorPhone}` : ''}
                      </ThemedText>
                    </View>
                    <ThemedText style={[styles.timeAgoText, { color: theme.textTertiary }]}>
                      {getRelativeTimeLocal(req.createdAt)}
                    </ThemedText>
                  </View>
                  <View style={[styles.detailsBlock, { backgroundColor: theme.inputBackground }]}>
                    {req.purpose && (
                      <View style={styles.detailItem}>
                        <Ionicons name="document-text-outline" size={14} color={theme.textSecondary} />
                        <ThemedText style={[styles.detailText, { color: theme.text }]} numberOfLines={1}>{req.purpose}</ThemedText>
                      </View>
                    )}
                    <View style={styles.detailItem}>
                      <Ionicons name="calendar-outline" size={14} color={theme.textSecondary} />
                      <ThemedText style={[styles.detailText, { color: theme.text }]}>
                        {req.visitDate ? `${req.visitDate}${req.visitTime ? ` at ${req.visitTime}` : ''}` : formatDateShortLocal(req.createdAt)}
                      </ThemedText>
                    </View>
                  </View>
                  <View style={[styles.statusBadge, {
                    backgroundColor: req.status === 'APPROVED' ? theme.success : req.status === 'REJECTED' ? theme.error : theme.warning
                  }]}>
                    <ThemedText style={[styles.statusText, { color: '#FFFFFF' }]}>{req.status}</ThemedText>
                  </View>
                </TouchableOpacity>
              )}
              ListEmptyComponent={
                <View style={styles.emptyState}>
                  <Ionicons name="people-outline" size={64} color={theme.border} />
                  <ThemedText style={[styles.emptyText, { color: theme.textSecondary }]}>No {activeTab.toLowerCase()} visitor requests</ThemedText>
                </View>
              }
            />
          )}
        </ScreenContentContainer>
      </TopRefreshControl>

      {/* Bottom Navigation */}
      <BottomNavBar
        tabs={ADMIN_TABS}
        activeKey={bottomTab}
        onPress={(key) => {
          setBottomTab(key as typeof bottomTab);
          if (key === 'NEW_PASS') setShowPassSheet(true);
          else if (key === 'MY_REQUESTS') onNavigate('ADMIN_MY_REQUESTS');
          else if (key === 'SCAN_HISTORY') onNavigate('ADMIN_SCAN_HISTORY');
          else if (key === 'PROFILE') onNavigate('PROFILE');
        }}
      />

      <PassTypeBottomSheet
        visible={showPassSheet}
        onClose={() => { setShowPassSheet(false); setBottomTab('HOME'); }}
        onSelectSingle={() => { setShowPassSheet(false); onNavigate('NEW_PASS_REQUEST'); }}
        onSelectGuest={() => { setShowPassSheet(false); onNavigate('GUEST_PRE_REQUEST'); }}
      />

      <SuccessModal visible={showSuccess} title="Done" message={modalMsg} onClose={() => setShowSuccess(false)} autoClose autoCloseDelay={2000} />
      <ErrorModal visible={showError} type="general" title="Error" message={modalMsg} onClose={() => setShowError(false)} />

      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        request={selectedVisitor ? {
          id: selectedVisitor.requestId || selectedVisitor.id,
          studentName: selectedVisitor.requesterName || selectedVisitor.name || 'Visitor',
          regNo: selectedVisitor.visitorPhone || selectedVisitor.phone || '',
          department: selectedVisitor.department || '',
          purpose: selectedVisitor.purpose || '',
          reason: selectedVisitor.purpose || '',
          requestDate: selectedVisitor.visitDate || selectedVisitor.createdAt,
          visitDate: selectedVisitor.visitDate,
          status: selectedVisitor.status,
          requestType: 'VISITOR',
          role: selectedVisitor.role || selectedVisitor.type || 'VISITOR',
          staffApproval: selectedVisitor.status,
        } : null}
        showActions={false}
        viewerRole="staff"
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 15 },
  headerLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  avatar: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center' },
  avatarImage: { width: 44, height: 44, borderRadius: 22 },
  avatarText: { fontSize: 18, fontWeight: '700', color: '#FFFFFF' },
  headerInfo: { flex: 1 },
  greeting: { fontSize: 10, fontWeight: '700', letterSpacing: 1, marginBottom: 2 },
  userName: { fontSize: 16, fontWeight: '800' },
  iconButton: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', position: 'relative' },
  notifDot: { position: 'absolute', top: 6, right: 6, width: 10, height: 10, borderRadius: 5, borderWidth: 2 },
  searchContainer: { flexDirection: 'row', alignItems: 'center', marginTop: 16, marginBottom: 12, paddingHorizontal: 16, paddingVertical: 12, borderRadius: 12, gap: 10, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  searchInput: { flex: 1, fontSize: 16 },
  statsContainer: { flexDirection: 'row', marginBottom: 16, borderRadius: 12, overflow: 'hidden', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 2 },
  statTab: { flex: 1, paddingVertical: 16, alignItems: 'center', borderBottomWidth: 3, borderBottomColor: 'transparent' },
  statLabel: { fontSize: 11, fontWeight: '700', marginBottom: 4, letterSpacing: 0.5 },
  statValue: { fontSize: 24, fontWeight: '700' },
  content: { flex: 1 },
  scrollContent: { paddingHorizontal: 20, paddingBottom: 120 },
  emptyState: { paddingVertical: 80, alignItems: 'center' },
  emptyText: { fontSize: 16, fontWeight: '600', marginTop: 16 },
  requestCard: { borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.05, shadowRadius: 4 },
  cardTopRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 12 },
  avatarContainer: { width: 44, height: 44, borderRadius: 22, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  requestAvatarText: { fontSize: 16, fontWeight: '700' },
  headerMainInfo: { flex: 1 },
  requestStudentName: { fontSize: 16, fontWeight: '700', marginBottom: 2 },
  studentIdSub: { fontSize: 12 },
  timeAgoText: { fontSize: 12 },
  detailsBlock: { borderRadius: 12, padding: 12, gap: 8, marginBottom: 12 },
  detailItem: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  detailText: { fontSize: 13, fontWeight: '600', flex: 1 },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  statusText: { fontSize: 12, fontWeight: '700' },
});

export default AdminDashboard;
