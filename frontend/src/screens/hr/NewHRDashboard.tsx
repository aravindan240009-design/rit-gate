import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { HR, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from '../../components/NotificationDropdown';
import BulkDetailsModal from '../../components/BulkDetailsModal';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

interface NewHRDashboardProps {
  hr: HR;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const NewHRDashboard: React.FC<NewHRDashboardProps> = ({
  hr,
  onLogout,
  onNavigate,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [bottomTab, setBottomTab] = useState<'HOME' | 'PROFILE'>('HOME');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedBulkId, setSelectedBulkId] = useState<number | null>(null);
  const [selectedBulkRequester, setSelectedBulkRequester] = useState<any>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalMessage, setModalMessage] = useState('');
  const { unreadCount, loadNotifications } = useNotifications();

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadRequests();
    loadNotifications(hr.hrCode, 'hr');
  }, []);

  const loadRequests = async () => {
    try {
      const hrCode = hr.hrCode;
      
      // HR only sees HOD bulk pass requests
      const bulkResult = await apiService.getHRPendingBulkPasses();
      
      let allRequests: any[] = [];
      
      if (bulkResult.success && bulkResult.requests) {
        allRequests = bulkResult.requests.map((req: any) => ({
          ...req,
          requestType: 'BULK',
        }));
      }
      
      setRequests(allRequests);
      
      const pending = allRequests.filter((r: any) =>
        r.hrApproval === 'PENDING_HR' || r.hrApproval === 'PENDING' || !r.hrApproval
      ).length;
      const approved = allRequests.filter((r: any) => r.hrApproval === 'APPROVED').length;
      const rejected = allRequests.filter((r: any) => r.hrApproval === 'REJECTED').length;
      
      setStats({ pending, approved, rejected });
    } catch (error) {
      console.error('Error loading requests:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadRequests();
  };

  const filteredRequests = requests.filter(request => {
    const matchesSearch = searchQuery === '' ||
      request.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.hodCode?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.regNo?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toString().includes(searchQuery);

    let matchesTab = false;
    if (activeTab === 'PENDING') {
      matchesTab = request.hrApproval === 'PENDING_HR' || request.hrApproval === 'PENDING' || !request.hrApproval;
    } else if (activeTab === 'APPROVED') {
      matchesTab = request.hrApproval === 'APPROVED';
    } else if (activeTab === 'REJECTED') {
      matchesTab = request.hrApproval === 'REJECTED';
    }

    return matchesSearch && matchesTab;
  });

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleApprove = async (id?: number, remark?: string) => {
    const targetId = id || selectedRequest?.id;
    if (!targetId) return;
    const req = selectedRequest;

    // Close modals immediately
    setShowDetailModal(false);
    setShowBulkModal(false);
    setSelectedRequest(null);

    try {
      if (req && req.requestType === 'SINGLE') {
        await apiService.approveRequestAsHR(targetId, hr.hrCode);
      } else {
        await apiService.approveHODBulkPass(targetId, hr.hrCode);
      }
      loadRequests();
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'An error occurred.');
      setShowErrorModal(true);
    }
  };

  const handleReject = async (id?: number, remark?: string) => {
    const targetId = id || selectedRequest?.id;
    if (!targetId) return;
    const req = selectedRequest;
    const targetRemark = remark || 'Rejected by HR';

    // Close modals immediately
    setShowDetailModal(false);
    setShowBulkModal(false);
    setSelectedRequest(null);

    try {
      if (req && req.requestType === 'SINGLE') {
        await apiService.rejectRequestAsHR(targetId, hr.hrCode, targetRemark);
      } else {
        await apiService.rejectHODBulkPass(targetId, hr.hrCode, targetRemark);
      }
      loadRequests();
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'An error occurred.');
      setShowErrorModal(true);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => {
            setBottomTab('PROFILE');
            onNavigate('PROFILE');
          }}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{getInitials(hr.name || 'HR')}</Text>
            </View>
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>GOOD MORNING,</Text>
            <Text style={styles.userName}>{(hr.name || 'HR').toUpperCase()}</Text>
          </View>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.iconButton}
            onPress={() => setShowNotificationDropdown(true)}
          >
            <Ionicons name="notifications-outline" size={24} color="#1F2937" />
            {unreadCount > 0 && (
              <View style={styles.notificationIndicator} />
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.iconButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={24} color="#EF4444" />
          </TouchableOpacity>
        </View>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search requests..."
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Stats Tabs */}
      <View style={styles.statsContainer}>
        <TouchableOpacity
          style={[styles.statTab, activeTab === 'PENDING' && styles.statTabActive]}
          onPress={() => setActiveTab('PENDING')}
        >
          <Text style={[styles.statLabel, activeTab === 'PENDING' && styles.statLabelActive]}>
            PENDING
          </Text>
          <Text style={[styles.statValue, activeTab === 'PENDING' && styles.statValueActive]}>
            {stats.pending}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statTab, activeTab === 'APPROVED' && styles.statTabActive]}
          onPress={() => setActiveTab('APPROVED')}
        >
          <Text style={[styles.statLabel, activeTab === 'APPROVED' && styles.statLabelActive]}>
            APPROVED
          </Text>
          <Text style={[styles.statValue, activeTab === 'APPROVED' && styles.statValueActive]}>
            {stats.approved}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.statTab, activeTab === 'REJECTED' && styles.statTabActive]}
          onPress={() => setActiveTab('REJECTED')}
        >
          <Text style={[styles.statLabel, activeTab === 'REJECTED' && styles.statLabelActive]}>
            REJECTED
          </Text>
          <Text style={[styles.statValue, activeTab === 'REJECTED' && styles.statValueActive]}>
            {stats.rejected}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Request List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done-circle-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No {activeTab.toLowerCase()} requests</Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <TouchableOpacity
              key={`${request.requestType}-${request.id}`}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                // HR only sees bulk passes
                setSelectedBulkId(request.id);
                setSelectedBulkRequester({
                  name: request.requestedByStaffName || request.hodCode || 'HOD',
                  role: request.userType || 'HOD',
                  department: request.department || 'Department'
                });
                setShowBulkModal(true);
              }}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.cardAvatarText}>
                    {getInitials(request.requestType === 'BULK' 
                      ? (request.hodCode || 'HOD')
                      : (request.studentName || 'ST'))}
                  </Text>
                </View>
                
                <View style={styles.headerMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.requestStudentName} numberOfLines={1}>
                      {request.requestType === 'SINGLE' 
                        ? (request.studentName || request.regNo || `Request #${request.id}`)
                        : `${request.requestedByStaffName || request.hodCode || 'Staff'}`}
                    </Text>
                    <Text style={styles.passTypeLabel}>
                      {request.requestType === 'BULK' ? '(Bulk Pass)' : '(Gatepass)'}
                    </Text>
                  </View>
                  <Text style={styles.studentIdSub}>
                    {request.requestType === 'SINGLE' 
                      ? `${request.regNo || 'N/A'} • ${request.department || 'Department'}`
                      : `${request.userType || 'HOD'} • ${request.department || 'N/A'}`}
                  </Text>
                </View>

                <View style={styles.timeAgoContainer}>
                  <Text style={styles.timeAgoText}>
                    {request.requestDate ? '2h ago' : ''} 
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons name="medical" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>{request.purpose || 'General'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>
                    Exit: {new Date(request.exitDateTime || request.requestDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {request.requestType === 'BULK' && (
                  <View style={styles.detailItem}>
                    <Ionicons name="people" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>
                      {(() => {
                        const parts: string[] = [];
                        
                        // Use participantCount if available for total
                        const total = request.participantCount || 0;
                        const students = request.studentCount || 0;
                        const staffCount = Math.max(0, total - students);
                        
                        if (staffCount > 0) parts.push(`Staff - ${staffCount}`);
                        if (students > 0) parts.push(`Students - ${students}`);
                        
                        return parts.join(', ') || `${total} Participants`;
                      })()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={[
                  styles.statusBadge,
                  (request.hrApproval === 'PENDING_HR' || request.hrApproval === 'PENDING' || !request.hrApproval) && styles.statusPending,
                  request.hrApproval === 'APPROVED' && styles.statusApproved,
                  request.hrApproval === 'REJECTED' && styles.statusRejected,
                ]}>
                  <Text style={[
                    styles.statusText,
                    (request.hrApproval === 'PENDING_HR' || request.hrApproval === 'PENDING' || !request.hrApproval) && styles.statusTextPending,
                    request.hrApproval === 'APPROVED' && styles.statusTextApproved,
                    request.hrApproval === 'REJECTED' && styles.statusTextRejected,
                  ]}>
                    {request.hrApproval === 'PENDING_HR' || request.hrApproval === 'PENDING' || !request.hrApproval ? 'PENDING' : request.hrApproval}
                  </Text>
                </View>
                {request.requestType === 'BULK' && (
                  <View style={styles.viewBadge}>
                    <Ionicons name="people" size={14} color="#4B5563" />
                    <Text style={[styles.viewBadgeText]}>Bulk Pass</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => setBottomTab('HOME')}
        >
          <Ionicons
            name={bottomTab === 'HOME' ? 'home' : 'home-outline'}
            size={22}
            color={bottomTab === 'HOME' ? '#1F2937' : '#9CA3AF'}
          />
          <Text style={[
            styles.navLabel,
            bottomTab === 'HOME' && styles.navLabelActive
          ]}>
            Home
          </Text>
          {bottomTab === 'HOME' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setBottomTab('PROFILE');
            onNavigate('PROFILE');
          }}
        >
          <Ionicons
            name={bottomTab === 'PROFILE' ? 'person' : 'person-outline'}
            size={22}
            color={bottomTab === 'PROFILE' ? '#1F2937' : '#9CA3AF'}
          />
          <Text style={[
            styles.navLabel,
            bottomTab === 'PROFILE' && styles.navLabelActive
          ]}>
            Profile
          </Text>
          {bottomTab === 'PROFILE' && <View style={styles.activeIndicator} />}
        </TouchableOpacity>
      </View>

      {/* Notification Dropdown */}
      <NotificationDropdown
        visible={showNotificationDropdown}
        onClose={() => setShowNotificationDropdown(false)}
        userId={hr.hrCode}
        userType="hr"
      />

      {/* Bulk Detail Modal */}
      <BulkDetailsModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        requestId={selectedBulkId || 0}
        requesterInfo={selectedBulkRequester}
        onApprove={(id, remark) => handleApprove(id, remark)}
        onReject={(id, remark) => handleReject(id, remark)}
        showActions={selectedRequest && (selectedRequest.hrApproval === 'PENDING_HR' || selectedRequest.hrApproval === 'PENDING' || !selectedRequest.hrApproval)}
        currentUserId={hr.hrCode}
      />

      {/* Request Detail Modal */}
      {/* Single Pass Detail Modal */}
      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => setShowDetailModal(false)}
        request={selectedRequest}
        onApprove={(id, remark) => handleApprove(id, remark)}
        onReject={(id, remark) => handleReject(id, remark)}
        showActions={selectedRequest && (selectedRequest.hrApproval === 'PENDING_HR' || selectedRequest.hrApproval === 'PENDING' || !selectedRequest.hrApproval)}
        viewerRole="hr"
      />

      {/* Success Modal */}
      <SuccessModal
        visible={showSuccessModal}
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2500}
      />

      {/* Error Modal */}
      <ErrorModal
        visible={showErrorModal}
        type="api"
        title={modalTitle}
        message={modalMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#0EA5E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  headerInfo: {
    gap: 2,
  },
  greeting: {
    fontSize: 13,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationIndicator: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#10b981',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  statsContainer: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginBottom: 16,
    borderRadius: 12,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  statTab: {
    flex: 1,
    paddingVertical: 16,
    alignItems: 'center',
    borderBottomWidth: 3,
    borderBottomColor: 'transparent',
  },
  statTabActive: {
    borderBottomColor: '#0EA5E9',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabelActive: {
    color: '#0EA5E9',
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#6B7280',
  },
  statValueActive: {
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#6B7280',
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#F3F4F6',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  cardTopRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  avatarContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#6B7280',
  },
  headerMainInfo: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingRight: 8,
  },
  requestStudentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
    flexShrink: 1,
  },
  passTypeLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
  },
  studentIdSub: {
    fontSize: 13,
    color: '#6B7280',
    marginTop: 2,
  },
  timeAgoContainer: {
    alignSelf: 'flex-start',
    paddingTop: 4,
  },
  timeAgoText: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  detailsBlock: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    padding: 12,
    gap: 8,
    marginBottom: 16,
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '600',
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  statusPending: {
    backgroundColor: '#FEF3C7',
  },
  statusApproved: {
    backgroundColor: '#D1FAE5',
  },
  statusRejected: {
    backgroundColor: '#FEE2E2',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
  },
  statusTextPending: {
    color: '#F59E0B',
  },
  statusTextApproved: {
    color: '#10B981',
  },
  statusTextRejected: {
    color: '#EF4444',
  },
  viewBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3F4F6',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 6,
  },
  viewBadgeText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#4B5563',
  },
  bottomNav: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 12,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 4,
  },
  navLabelActive: {
    color: '#1F2937',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 3,
    backgroundColor: '#0EA5E9',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  closeButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    maxHeight: '100%',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 12,
    letterSpacing: 0.5,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 16,
    marginBottom: 8,
  },
  rejectButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  approveButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  approveButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  remarkBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#0EA5E9',
  },
  remarkLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
  },
  remarkValue: {
    fontSize: 14,
    color: '#111827',
    fontWeight: '500',
  },


});

export default NewHRDashboard;
