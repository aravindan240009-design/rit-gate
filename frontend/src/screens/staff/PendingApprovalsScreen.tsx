import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
  TextInput,
  Modal,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Staff } from '../../types';
import { apiService } from '../../services/api';
import { THEME } from '../../config/api.config';
import BulkDetailsModal from '../../components/BulkDetailsModal';
import SinglePassDetailsModal from '../../components/SinglePassDetailsModal';
import SuccessModal from '../../components/SuccessModal';
import ErrorModal from '../../components/ErrorModal';

interface PendingApprovalsScreenProps {
  user: Staff;
  navigation?: any;
  onBack?: () => void;
}

const PendingApprovalsScreen: React.FC<PendingApprovalsScreenProps> = ({ user, navigation, onBack }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [pendingRequests, setPendingRequests] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [rejectModalVisible, setRejectModalVisible] = useState(false);
  const [rejectReason, setRejectReason] = useState('');
  const [rejectingRequestId, setRejectingRequestId] = useState<number | null>(null);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [selectedBulkId, setSelectedBulkId] = useState<number | null>(null);
  const [selectedBulkRequester, setSelectedBulkRequester] = useState<any>(null);
  const [verificationModalVisible, setVerificationModalVisible] = useState(false);
  const [selectedRequest, setSelectedRequest] = useState<any>(null);
  const [staffRemark, setStaffRemark] = useState('');
  const [processingId, setProcessingId] = useState<number | null>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [showErrorModal, setShowErrorModal] = useState(false);
  const [feedbackMessage, setFeedbackMessage] = useState('');

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onBack) {
      onBack();
    }
  };

  useEffect(() => {
    loadPendingRequests();
  }, []);

  const loadPendingRequests = async () => {
    setIsLoading(true);
    try {
      const response = await apiService.getStaffVisitorRequests(user.staffCode);
      if (response.success && response.data) {
        setPendingRequests(response.data);
      }
    } catch (error) {
      console.error('Error loading pending requests:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadPendingRequests();
    setRefreshing(false);
  };

  const handleApprove = async (requestId: number, remark?: string) => {
    const targetRemark = remark !== undefined ? remark : staffRemark;
    setProcessingId(requestId);
    setVerificationModalVisible(false);
    setShowBulkModal(false);
    try {
      const res = await apiService.approveGatePassByStaff(user.staffCode, requestId, targetRemark);
      if (res.success !== false) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setFeedbackMessage('Request approved successfully.');
        setShowSuccessModal(true);
      } else {
        setFeedbackMessage(res.message || 'Failed to approve request.');
        setShowErrorModal(true);
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to approve request.');
      setShowErrorModal(true);
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = (requestId: number, remark?: string) => {
    if (remark !== undefined) {
      // Direct rejection from BulkDetailsModal with remark already provided
      setShowBulkModal(false);
      doReject(requestId, remark);
    } else {
      setRejectingRequestId(requestId);
      setRejectReason('');
      setRejectModalVisible(true);
    }
  };

  const doReject = async (requestId: number, reason: string) => {
    setProcessingId(requestId);
    try {
      const res = await apiService.rejectGatePassByStaff(user.staffCode, requestId, reason.trim());
      if (res.success !== false) {
        setPendingRequests(prev => prev.filter(r => r.id !== requestId));
        setFeedbackMessage('Request rejected.');
        setShowSuccessModal(true);
      } else {
        setFeedbackMessage(res.message || 'Failed to reject request.');
        setShowErrorModal(true);
      }
    } catch (err: any) {
      setFeedbackMessage(err.message || 'Failed to reject request.');
      setShowErrorModal(true);
    } finally {
      setProcessingId(null);
    }
  };

  const confirmReject = () => {
    const requestId = selectedRequest?.id || rejectingRequestId;
    const reason = rejectReason || staffRemark;

    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for rejection');
      return;
    }
    if (requestId === null) return;

    setRejectModalVisible(false);
    setVerificationModalVisible(false);
    setRejectReason('');
    setStaffRemark('');
    setRejectingRequestId(null);
    doReject(requestId as number, reason);
  };

  const cancelReject = () => {
    setRejectModalVisible(false);
    setRejectReason('');
    setRejectingRequestId(null);
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Pending Approvals</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : pendingRequests.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="checkmark-done" size={64} color={THEME.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No pending requests</Text>
            <Text style={styles.emptyStateSubtext}>
              All gate pass requests have been processed
            </Text>
          </View>
        ) : (
          pendingRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                setStaffRemark('');
                if (request.passType === 'BULK') {
                  setSelectedBulkId(request.id);
                  setSelectedBulkRequester({
                    name: request.requestedByStaffName || 'Staff',
                    role: request.userType || 'Staff',
                    department: request.department || 'Dept'
                  });
                  setShowBulkModal(true);
                } else {
                  setVerificationModalVisible(true);
                }
              }}
            >
              <View style={styles.cardTopRow}>
                <View style={styles.avatarContainer}>
                  <Text style={styles.avatarText}>
                    {getInitials(request.passType === 'BULK' 
                      ? (request.requestedByStaffName || 'BR')
                      : (request.regNo || 'ST'))}
                  </Text>
                </View>
                
                <View style={styles.headerMainInfo}>
                  <View style={styles.nameRow}>
                    <Text style={styles.requestStudentName}>
                      {request.passType === 'BULK' ? (request.requestedByStaffName || 'Bulk Request') : request.regNo}
                    </Text>
                    <Text style={styles.passTypeLabel}>
                      {request.passType === 'BULK' ? '(Bulk Pass)' : '(Gatepass)'}
                    </Text>
                  </View>
                  <Text style={styles.studentIdSub}>
                    {request.passType === 'BULK' 
                      ? `${request.userType || 'Staff'} • ${request.department || 'Dept'}`
                      : `${request.regNo} • ${request.department || 'Department'}`}
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
                {request.passType === 'BULK' && (
                  <View style={styles.detailItem}>
                    <Ionicons name="people" size={16} color="#4B5563" />
                    <Text style={styles.detailText}>
                      {(() => {
                        const parts: string[] = [];
                        if (request.includeStaff) parts.push('Staff - 1');
                        if (request.studentCount) parts.push(`Students - ${request.studentCount}`);
                        return parts.join(', ') || 'Bulk Pass';
                      })()}
                    </Text>
                  </View>
                )}
              </View>

              <View style={styles.cardFooter}>
                <View style={styles.statusBadge}>
                  <Text style={styles.statusText}>PENDING</Text>
                </View>
                
                <View style={styles.footerActions}>
                  {request.passType === 'BULK' && (
                    <View style={styles.viewBadge}>
                      <Ionicons name="people" size={14} color="#4B5563" />
                      <Text style={styles.viewBadgeText}>Bulk Pass</Text>
                    </View>
                  )}
                  <TouchableOpacity
                    style={[styles.actionIcon, styles.approveIcon, processingId === request.id && { opacity: 0.5 }]}
                    onPress={() => handleApprove(request.id)}
                    disabled={processingId !== null}
                  >
                    {processingId === request.id ? (
                      <ActivityIndicator size="small" color="#FFF" />
                    ) : (
                      <Ionicons name="checkmark" size={20} color="#FFF" />
                    )}
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.actionIcon, styles.rejectIcon, processingId === request.id && { opacity: 0.5 }]}
                    onPress={() => handleReject(request.id)}
                    disabled={processingId !== null}
                  >
                    <Ionicons name="close" size={20} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bulk Detail Modal */}
      <BulkDetailsModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        requestId={selectedBulkId || 0}
        requesterInfo={selectedBulkRequester}
        onApprove={(id, remark) => handleApprove(id, remark)}
        onReject={(id, remark) => handleReject(id, remark)}
        showActions={selectedRequest && (selectedRequest.status === 'PENDING' || !selectedRequest.status)}
      />

      {/* Single Pass Detail Modal */}
      <SinglePassDetailsModal
        visible={verificationModalVisible}
        onClose={() => setVerificationModalVisible(false)}
        request={selectedRequest}
        onApprove={(id, remark) => handleApprove(id, remark)}
        onReject={(id, remark) => handleReject(id, remark)}
        showActions={selectedRequest && (selectedRequest.status === 'PENDING' || !selectedRequest.status)}
        viewerRole="staff"
        processing={processingId !== null}
      />

      <SuccessModal
        visible={showSuccessModal}
        title="Done"
        message={feedbackMessage}
        onClose={() => setShowSuccessModal(false)}
        autoClose={true}
        autoCloseDelay={2000}
      />

      <ErrorModal
        visible={showErrorModal}
        type="api"
        title="Action Failed"
        message={feedbackMessage}
        onClose={() => setShowErrorModal(false)}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
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
  avatarText: {
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
    backgroundColor: '#FEF3C7',
  },
  statusText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F59E0B',
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
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  viewIconButton: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  approveIcon: {
    backgroundColor: '#10B981',
  },
  rejectIcon: {
    backgroundColor: '#EF4444',
  },
  // Verification Modal Styles
  vContainer: {
    flex: 1,
    backgroundColor: '#F9FAFB',
  },
  vHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFF',
  },
  vBackButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vHeaderTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    letterSpacing: 0.5,
  },
  vContent: {
    flex: 1,
    padding: 20,
  },
  vProfileSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  vAvatarCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#3B82F6',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  vAvatarText: {
    color: '#FFF',
    fontSize: 24,
    fontWeight: '800',
  },
  vProfileInfo: {
    flex: 1,
  },
  vProfileName: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 4,
  },
  vProfileId: {
    fontSize: 16,
    color: '#6B7280',
    fontWeight: '600',
  },
  vTimeInfo: {
    alignItems: 'flex-end',
  },
  vTimeText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#4B5563',
  },
  vTimeSub: {
    fontSize: 12,
    color: '#9CA3AF',
  },
  vCard: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 16,
    marginBottom: 28,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 2,
  },
  vCardItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 4,
  },
  vCardText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  vSectionTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#9CA3AF',
    marginBottom: 12,
    letterSpacing: 1,
  },
  vAttachmentCard: {
    borderRadius: 20,
    overflow: 'hidden',
    marginBottom: 28,
    backgroundColor: '#E5E7EB',
    height: 300,
    position: 'relative',
  },
  vAttachmentImage: {
    width: '100%',
    height: '100%',
  },
  vPreviewButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -100 }, { translateY: -25 }],
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 8,
    width: 200,
    justifyContent: 'center',
  },
  vPreviewText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#1F2937',
  },
  vRemarkContainer: {
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    padding: 20,
    minHeight: 120,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  vRemarkInput: {
    fontSize: 18,
    fontWeight: '700',
    color: '#4B5563',
    paddingTop: 0,
    textAlignVertical: 'top',
  },
  vFooter: {
    flexDirection: 'row',
    padding: 20,
    backgroundColor: '#FFF',
    gap: 12,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  vFooterButton: {
    flex: 1,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  vRejectBtn: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#FCA5A5',
  },
  vApproveBtn: {
    backgroundColor: '#10B981',
  },
  vFooterButtonText: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 1,
    color: '#FFF',
  },
});

export default PendingApprovalsScreen;
