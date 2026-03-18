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
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Staff, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import { useNotifications } from '../../context/NotificationContext';
import { useProfile } from '../../context/ProfileContext';
import PassTypeBottomSheet from '../../components/PassTypeBottomSheet';
import StaffRequestTimeline from '../../components/StaffRequestTimeline';
import NotificationDropdown from '../../components/NotificationDropdown';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';

interface NewStaffDashboardProps {
  staff: Staff;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const NewStaffDashboard: React.FC<NewStaffDashboardProps> = ({
  staff,
  onLogout,
  onNavigate,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'PENDING' | 'APPROVED' | 'REJECTED'>('PENDING');
  const [bottomTab, setBottomTab] = useState<'HOME' | 'NEW_PASS' | 'MY_REQUESTS' | 'PROFILE'>('HOME');
  const [showPassTypeModal, setShowPassTypeModal] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualEntryCode, setManualEntryCode] = useState<string | null>(null);
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [modalTitle, setModalTitle] = useState('');
  const { unreadCount, loadNotifications } = useNotifications();
  const { profileImage } = useProfile();

  const [stats, setStats] = useState({
    pending: 0,
    approved: 0,
    rejected: 0,
  });

  useEffect(() => {
    loadRequests();
    loadNotifications(staff.staffCode, 'staff');
  }, []);

  const loadRequests = async () => {
    try {
      const [ownRequestsResponse, assignedRequestsResponse, visitorRequestsResponse] = await Promise.all([
        apiService.getStaffOwnGatePassRequests(staff.staffCode),
        apiService.getAllStaffRequests(staff.staffCode),
        apiService.getVisitorRequestsForStaff(staff.staffCode)
      ]);

      // Combine all types of requests
      let allRequests: any[] = [];

      if (ownRequestsResponse.success && ownRequestsResponse.requests) {
        // Mark own requests
        allRequests = ownRequestsResponse.requests.map((req: any) => ({
          ...req,
          isOwnRequest: true,
          requestType: 'GATEPASS'
        }));
      }

      if (assignedRequestsResponse.success && assignedRequestsResponse.requests) {
        // Mark assigned requests (student requests needing approval)
        const assignedReqs = assignedRequestsResponse.requests.map((req: any) => ({
          ...req,
          isOwnRequest: false,
          requestType: 'GATEPASS'
        }));
        allRequests = [...allRequests, ...assignedReqs];
      }

      // Add visitor requests
      if (visitorRequestsResponse.success && visitorRequestsResponse.requests && Array.isArray(visitorRequestsResponse.requests)) {
        const visitorReqs = visitorRequestsResponse.requests.map((req: any) => ({
          id: `VISITOR-${req.requestId}`,
          requestType: 'VISITOR',
          isOwnRequest: false,
          studentName: req.requesterName,
          visitorEmail: req.visitorEmail,
          visitorPhone: req.visitorPhone,
          purpose: req.purpose,
          visitDate: req.visitDate,
          visitTime: req.visitTime,
          staffApproval: req.status,
          createdAt: req.createdAt,
          reason: req.purpose,
          requestDate: req.createdAt,
          originalId: req.requestId,
        }));
        
        allRequests = [...allRequests, ...visitorReqs];
      }

      // Remove duplicates based on ID
      const uniqueRequests = allRequests.filter((req, index, self) =>
        index === self.findIndex((r) => r.id === req.id)
      ).sort((a: any, b: any) => {
        const dateB = new Date(b.requestDate || b.createdAt).getTime();
        const dateA = new Date(a.requestDate || a.createdAt).getTime();
        if (dateB !== dateA) return dateB - dateA;
        
        // Extract numeric part of ID for robust sorting (e.g., "GP-47" -> 47)
        const idB = parseInt(b.id?.toString().split('-')[1]) || 0;
        const idA = parseInt(a.id?.toString().split('-')[1]) || 0;
        return idB - idA;
      });

      setRequests(uniqueRequests);
      
      // Calculate stats from ALL requests assigned to staff (student gate pass + visitor requests, exclude staff's own requests)
      const assignedPending = uniqueRequests.filter((r: any) => !r.isOwnRequest && r.status === 'PENDING_STAFF').length;
      const assignedApproved = uniqueRequests.filter((r: any) => !r.isOwnRequest && r.staffApproval === 'APPROVED').length;
      const assignedRejected = uniqueRequests.filter((r: any) => !r.isOwnRequest && r.staffApproval === 'REJECTED').length;
      
      setStats({
        pending: assignedPending,
        approved: assignedApproved,
        rejected: assignedRejected,
      });
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
    // EXCLUDE staff's own requests from home page - they only appear in "My Requests" page
    if (request.isOwnRequest) {
      return false;
    }

    const matchesSearch = searchQuery === '' ||
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.studentName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toString().includes(searchQuery);

    let matchesTab = false;
    if (activeTab === 'PENDING') {
      // Only show requests waiting for staff approval (strict stage enforcement)
      matchesTab = request.status === 'PENDING_STAFF';
    } else if (activeTab === 'APPROVED') {
      matchesTab = request.staffApproval === 'APPROVED';
    } else if (activeTab === 'REJECTED') {
      matchesTab = request.staffApproval === 'REJECTED';
    }

    const passes = matchesSearch && matchesTab;

    return passes;
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
    if (!selectedRequest) return;
    const req = selectedRequest;

    // Close modal immediately
    setShowDetailModal(false);
    setSelectedRequest(null);

    try {
      if (req.requestType === 'VISITOR') {
        const visitorId = req.originalId || req.id.replace('VISITOR-', '');
        await apiService.approveVisitorRequest(visitorId);
      } else {
        await apiService.approveGatePassByStaff(staff.staffCode, req.id, remark || '');
      }
      loadRequests();
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'An error occurred.');
      setShowErrorModal(true);
    }
  };

  const handleReject = async (id?: number, remark?: string) => {
    if (!selectedRequest) return;
    const req = selectedRequest;

    // Close modal immediately
    setShowDetailModal(false);
    setSelectedRequest(null);

    try {
      if (req.requestType === 'VISITOR') {
        const visitorId = req.originalId || req.id.replace('VISITOR-', '');
        await apiService.rejectVisitorRequest(visitorId, remark || 'Rejected by staff');
      } else {
        await apiService.rejectGatePassByStaff(staff.staffCode, req.id, remark || 'Rejected by staff');
      }
      loadRequests();
    } catch (error: any) {
      setModalTitle('Error');
      setModalMessage(error.message || 'An error occurred.');
      setShowErrorModal(true);
    }
  };

  const handleViewQR = async (request: any) => {
    if (!request.id) return;
    setSelectedRequest(request);
    setQrCodeData(null);
    setManualEntryCode(null);
    setShowQRModal(true);

    try {
      const response = await apiService.getGatePassQRCode(request.id, staff.staffCode, true);

      if (response.success && response.qrCode) {
        const qrCodeWithPrefix = response.qrCode.startsWith('data:image')
          ? response.qrCode
          : `data:image/png;base64,${response.qrCode}`;
        setQrCodeData(qrCodeWithPrefix);
        
        // Get manual entry code from response (works for both single and bulk passes)
        if (response.manualCode) {
          setManualEntryCode(response.manualCode);
        } else {
          // Fallback: try to fetch from bulk gate pass details (for bulk passes)
          try {
            const detailsResponse = await apiService.getBulkGatePassDetails(request.id);
            if (detailsResponse.success && detailsResponse.request?.qrData?.manualEntryCode) {
              setManualEntryCode(detailsResponse.request.qrData.manualEntryCode);
            }
          } catch (err) {
            // Could not fetch manual entry code
          }
        }
      } else {
        setModalTitle('QR Code Error');
        setModalMessage(response.message || 'Could not fetch QR code. Please try again.');
        setShowErrorModal(true);
        setShowQRModal(false);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      setModalTitle('QR Code Error');
      setModalMessage('Failed to load QR code. Please check your connection.');
      setShowErrorModal(true);
      setShowQRModal(false);
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
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{getInitials(staff.staffName || 'DR')}</Text>
              </View>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>GOOD MORNING,</Text>
            <Text style={styles.userName}>{(staff.staffName || 'Divya Rao').toUpperCase()}</Text>
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
              key={request.id}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                setShowDetailModal(true);
              }}
            >
              <View style={styles.cardTopRow}>
                <View style={[styles.avatarContainer, { backgroundColor: request.requestType === 'VISITOR' ? '#E0F2FE' : '#F3F4F6' }]}>
                  <Text style={styles.requestAvatarText}>
                    {getInitials(request.studentName || 'ST')}
                  </Text>
                </View>
                
                <View style={styles.headerMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.requestStudentName} numberOfLines={1}>
                      {request.studentName || 'Unknown'}
                    </Text>
                    {request.requestType === 'VISITOR' ? (
                      <View style={styles.passTypePill}>
                        <Text style={styles.passTypePillText}>Visitor</Text>
                      </View>
                    ) : (
                      <View style={styles.passTypePill}>
                        <Text style={styles.passTypePillText}>
                          {request.passType === 'BULK' ? 'Bulk Pass' : 'Gatepass'}
                        </Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.studentIdSub}>
                    {request.requestType === 'VISITOR'
                      ? `Visitor • ${request.visitorPhone || ''}`
                      : `${request.regNo || 'N/A'} • ${request.department || 'Department'}`}
                  </Text>
                </View>

                <View style={styles.timeAgoContainer}>
                  <Text style={styles.timeAgoText}>
                    {(() => {
                      const d = new Date(request.requestDate || request.createdAt);
                      const diffMs = Date.now() - d.getTime();
                      const mins = Math.floor(diffMs / 60000);
                      if (mins < 60) return `${mins}m ago`;
                      const hrs = Math.floor(mins / 60);
                      if (hrs < 24) return `${hrs}h ago`;
                      return `${Math.floor(hrs / 24)}d ago`;
                    })()}
                  </Text>
                </View>
              </View>

              <View style={styles.detailsBlock}>
                <View style={styles.detailItem}>
                  <Ionicons name="document-text-outline" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>{request.purpose || 'General'}</Text>
                </View>
                <View style={styles.detailItem}>
                  <Ionicons name="calendar-outline" size={16} color="#4B5563" />
                  <Text style={styles.detailText}>
                    {request.requestType === 'VISITOR' && request.visitDate
                      ? `${request.visitDate}${request.visitTime ? ` at ${request.visitTime}` : ''}`
                      : new Date(request.requestDate || request.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </Text>
                </View>
                {request.passType === 'BULK' && (
                  <View style={styles.detailItem}>
                    <Ionicons name="people-outline" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>
                      {(() => {
                        const parts: string[] = [];
                        const sc = request.staffCount ?? 0;
                        const stc = request.studentCount ?? 0;
                        if (sc > 0) parts.push(`Staff - ${sc}`);
                        if (stc > 0) parts.push(`Students - ${stc}`);
                        return parts.join(', ') || `${request.participantCount || 0} Participants`;
                      })()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={[
                  styles.statusBadge,
                  request.staffApproval === 'PENDING' && styles.statusPending,
                  request.staffApproval === 'APPROVED' && styles.statusApproved,
                  request.staffApproval === 'REJECTED' && styles.statusRejected,
                ]}>
                  <Text style={[
                    styles.statusText,
                    request.staffApproval === 'PENDING' && styles.statusTextPending,
                    request.staffApproval === 'APPROVED' && styles.statusTextApproved,
                    request.staffApproval === 'REJECTED' && styles.statusTextRejected,
                  ]}>
                    {request.staffApproval}
                  </Text>
                </View>
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
            setBottomTab('NEW_PASS');
            setShowPassTypeModal(true);
          }}
        >
          <Ionicons name="add-circle-outline" size={32} color="#6B7280" />
          <Text style={styles.navLabel}>New Pass</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => {
            setBottomTab('MY_REQUESTS');
            onNavigate('MY_REQUESTS');
          }}
        >
          <Ionicons
            name={bottomTab === 'MY_REQUESTS' ? 'list' : 'list-outline'}
            size={22}
            color={bottomTab === 'MY_REQUESTS' ? '#1F2937' : '#9CA3AF'}
          />
          <Text style={[
            styles.navLabel,
            bottomTab === 'MY_REQUESTS' && styles.navLabelActive
          ]}>
            My Requests
          </Text>
          {bottomTab === 'MY_REQUESTS' && <View style={styles.activeIndicator} />}
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
        userId={staff.staffCode}
        userType="staff"
      />

      {/* Pass Type Selection Modal */}
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
        onSelectBulk={() => {
          setShowPassTypeModal(false);
          onNavigate('STAFF_BULK_GATE_PASS');
        }}
      />

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.qrModalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gate Pass QR Code</Text>
              <TouchableOpacity
                onPress={() => setShowQRModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            <ScrollView 
              style={styles.qrModalContent}
              contentContainerStyle={styles.qrModalScrollContent}
              showsVerticalScrollIndicator={false}
            >
              {/* Staff Info */}
              <View style={styles.qrStaffInfo}>
                <Text style={styles.qrStaffName}>{staff.staffName}</Text>
                <Text style={styles.qrStaffCode}>{staff.staffCode}</Text>
              </View>

              {/* QR Code Display */}
              <View style={styles.qrCodeContainer}>
                {qrCodeData ? (
                  <View style={styles.qrCodeWrapper}>
                    <Image source={{ uri: qrCodeData }} style={styles.qrCodeImage} />
                  </View>
                ) : (
                  <View style={styles.qrLoadingContainer}>
                    <Text style={styles.qrLoadingText}>Loading QR...</Text>
                  </View>
                )}
              </View>

              {/* Manual Entry Code */}
              {manualEntryCode && (
                <View style={styles.manualCodeContainer}>
                  <Text style={styles.manualCodeLabel}>Manual Entry Code</Text>
                  <Text style={styles.manualCodeText}>{manualEntryCode}</Text>
                </View>
              )}

              {/* Instructions */}
              <Text style={styles.qrInstructions}>
                Scan at Main Gate Exit
              </Text>

              {/* Request Details */}
              {selectedRequest && (
                <View style={styles.qrRequestDetails}>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Reason:</Text>
                    <Text style={styles.qrDetailValue}>
                      {selectedRequest.reason || 'Staff Exit'}
                    </Text>
                  </View>
                  <View style={styles.qrDetailRow}>
                    <Text style={styles.qrDetailLabel}>Valid Until:</Text>
                    <Text style={styles.qrDetailValue}>One time</Text>
                  </View>
                </View>
              )}

              {/* Close Button */}
              <TouchableOpacity
                style={styles.qrCloseButton}
                onPress={() => setShowQRModal(false)}
              >
                <Text style={styles.qrCloseButtonText}>Close</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Single Pass Details Modal */}
      <SinglePassDetailsModal
        visible={showDetailModal}
        onClose={() => { setShowDetailModal(false); setSelectedRequest(null); }}
        request={selectedRequest}
        onApprove={handleApprove}
        onReject={handleReject}
        showActions={selectedRequest?.status === 'PENDING_STAFF'}
        viewerRole="staff"
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
    justifyContent: 'space-between',
    alignItems: 'center',
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
    backgroundColor: '#8B5CF6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarImage: {
    width: 48,
    height: 48,
    borderRadius: 24,
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
    fontSize: 12,
    color: '#6B7280',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
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
    marginBottom: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 12,
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
    borderBottomColor: '#F59E0B',
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#9CA3AF',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  statLabelActive: {
    color: '#F59E0B',
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
  requestAvatarText: {
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
  },
  requestStudentName: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111827',
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
  passTypePill: {
    backgroundColor: '#F3F4F6',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  passTypePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#000000',
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
  bottomNav: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    paddingBottom: 4,
    paddingTop: 4,
    height: 60,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    position: 'relative',
  },
  addButtonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 2,
    borderWidth: 2,
    borderColor: '#D1D5DB',
  },
  navLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginTop: 2,
  },
  navLabelActive: {
    color: '#1F2937',
    fontWeight: '600',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    left: '25%',
    right: '25%',
    height: 3,
    backgroundColor: '#6B7280',
    borderRadius: 2,
  },
  requestStudent: {
    fontSize: 15,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 4,
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
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
    paddingTop: 10,
  },
  modalSection: {
    marginTop: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  modalLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  modalValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 12,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 24,
    marginBottom: 20,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectButton: {
    backgroundColor: '#EF4444',
  },
  approveButton: {
    backgroundColor: '#10B981',
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  requestTypeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  ownRequestBadge: {
    backgroundColor: '#8B5CF6',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  ownRequestText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  visitorBadge: {
    backgroundColor: '#00BCD4',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  visitorBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  visitorContact: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 4,
  },
  visitorVisitInfo: {
    fontSize: 13,
    color: '#00BCD4',
    fontWeight: '600',
    marginBottom: 4,
  },
  qrModalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    marginTop: 60,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 40,
  },
  qrModalContent: {
    flex: 1,
  },
  qrModalScrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 40,
  },
  qrStaffInfo: {
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 24,
  },
  qrStaffName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  qrStaffCode: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  qrCodeContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.1,
    shadowRadius: 20,
  },
  qrCodeImage: {
    width: 220,
    height: 220,
  },
  qrLoadingContainer: {
    height: 260,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingText: {
    fontSize: 14,
    color: '#6B7280',
  },
  manualCodeContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 16,
    paddingVertical: 12,
    paddingHorizontal: 24,
    marginBottom: 15,
    borderWidth: 2,
    borderColor: '#8B5CF6',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  manualCodeLabel: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 4,
    color: '#6B7280',
  },
  manualCodeText: {
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 4,
    color: '#8B5CF6',
    fontFamily: 'monospace',
  },
  qrInstructions: {
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1,
    marginBottom: 25,
    textTransform: 'uppercase',
    textAlign: 'center',
    color: '#6B7280',
  },
  qrRequestDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 20,
    padding: 20,
    marginBottom: 30,
  },
  qrDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  qrDetailLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: '#6B7280',
  },
  qrDetailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#1F2937',
    flex: 1,
    textAlign: 'right',
    marginLeft: 20,
  },
  qrCloseButton: {
    paddingVertical: 18,
    backgroundColor: '#8B5CF6',
    borderRadius: 16,
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#8B5CF6',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  qrCloseButtonText: {
    color: '#FFFFFF',
    fontWeight: '900',
    fontSize: 16,
  },
  attachmentPreviewOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentPreviewClose: {
    position: 'absolute',
    top: 52,
    right: 20,
    zIndex: 10,
    backgroundColor: 'rgba(255,255,255,0.15)',
    borderRadius: 20,
    padding: 10,
  },
  attachmentPreviewImage: {
    width: '95%',
    height: '78%',
    borderRadius: 12,
  },
});

export default NewStaffDashboard;
