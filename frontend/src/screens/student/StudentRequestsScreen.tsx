import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
  Modal,
  Image,
  Alert,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { Student } from '../../types';
import { apiService } from '../../services/api';
import RequestTimeline from '../../components/RequestTimeline';
import MyRequestsBulkModal from '../../components/MyRequestsBulkModal';
import GatePassQRModal from '../../components/GatePassQRModal';

interface StudentRequestsScreenProps {
  student: Student;
  onTabChange: (tab: 'HOME' | 'REQUESTS' | 'HISTORY' | 'PROFILE') => void;
}

const StudentRequestsScreen: React.FC<StudentRequestsScreenProps> = ({
  student,
  onTabChange,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRequest, setSelectedRequest] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkModal, setShowBulkModal] = useState(false);
  const [showQRModal, setShowQRModal] = useState(false);
  const [selectedRequestId, setSelectedRequestId] = useState<number | null>(null);
  const [qrCodeData, setQrCodeData] = useState<string | null>(null);
  const [manualEntryCode, setManualEntryCode] = useState<string | null>(null);
  const [showAttachmentPreview, setShowAttachmentPreview] = useState(false);
  const [previewAttachmentUri, setPreviewAttachmentUri] = useState<string | null>(null);

  useEffect(() => {
    loadRequests();
  }, []);

  const loadRequests = async () => {
    try {
      const regNo = student.regNo || '';
      const response = await apiService.getStudentGatePassRequests(regNo);

      if (response.success && response.requests) {
        // Sort by approval status first (APPROVED first), then by date (newest first)
        const sorted = response.requests.sort((a: any, b: any) => {
          // Priority 1: APPROVED requests first
          if (a.status === 'APPROVED' && b.status !== 'APPROVED') return -1;
          if (a.status !== 'APPROVED' && b.status === 'APPROVED') return 1;
          
          // Priority 2: Within same status, sort by date (newest first)
          return new Date(b.requestDate).getTime() - new Date(a.requestDate).getTime();
        });
        setRequests(sorted);
      }
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
      request.reason?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.purpose?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      request.id?.toString().includes(searchQuery);

    return matchesSearch;
  });

  const handleViewQR = async (request: any) => {
    if (!request.id) return;
    setSelectedRequest(request);
    setQrCodeData(null);
    setManualEntryCode(null);
    setShowQRModal(true);

    try {
      if (request.qrCode) {
        setQrCodeData(request.qrCode);
        const manualCode = request.manualEntryCode || request.manualCode || null;
        if (manualCode) {
          setManualEntryCode(manualCode);
        }
        return;
      }

      const response = await apiService.getGatePassQRCode(request.id, student.regNo, false);

      if (response.success && response.qrCode) {
        if (response.qrCode.startsWith('GP|') || 
            response.qrCode.startsWith('ST|') || 
            response.qrCode.startsWith('SF|') || 
            response.qrCode.startsWith('VG|')) {
          setQrCodeData(response.qrCode);
        } else {
          const qrCodeWithPrefix = response.qrCode.startsWith('data:image')
            ? response.qrCode
            : `data:image/png;base64,${response.qrCode}`;
          setQrCodeData(qrCodeWithPrefix);
        }

        const manualCodeValue = response.manualCode || null;
        setManualEntryCode(manualCodeValue);
      } else {
        Alert.alert('Error', response.message || 'Could not fetch QR code');
        setShowQRModal(false);
      }
    } catch (error) {
      console.error('Error fetching QR code:', error);
      Alert.alert('Error', 'Failed to load QR code');
      setShowQRModal(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED':
        return '#10B981';
      case 'REJECTED':
        return '#EF4444';
      case 'PENDING_HOD':
        return '#3B82F6';
      default:
        return '#F59E0B';
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'PENDING_STAFF': return 'AWAITING STAFF';
      case 'PENDING_HOD': return 'AWAITING HOD';
      case 'APPROVED': return 'APPROVED';
      case 'REJECTED': return 'REJECTED';
      default: return status || 'PENDING';
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>My Requests</Text>
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
            <Ionicons name="document-text-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No requests found</Text>
          </View>
        ) : (
          filteredRequests.map((request) => (
            <TouchableOpacity
              key={request.id}
              style={styles.requestCard}
              onPress={() => {
                setSelectedRequest(request);
                setSelectedRequestId(request.id);
                if (request.requestType === 'BULK') {
                  setShowBulkModal(true);
                } else {
                  setShowDetailModal(true);
                }
              }}
            >
              <View style={styles.requestHeader}>
                <Text style={styles.requestTitle} numberOfLines={1}>
                  {request.purpose || 'Gate Pass Request'}
                </Text>
                <View
                  style={[
                    styles.statusBadge,
                    { backgroundColor: getStatusColor(request.status) + '20' },
                  ]}
                >
                  <Text
                    style={[
                      styles.statusText,
                      { color: getStatusColor(request.status) },
                    ]}
                  >
                    {getStatusLabel(request.status)}
                  </Text>
                </View>
              </View>
              <Text style={styles.requestDate}>{formatDate(request.requestDate)}</Text>
              
              {request.status === 'APPROVED' && (
                <TouchableOpacity
                  style={styles.quickQrButton}
                  onPress={(e) => {
                    e.stopPropagation();
                    handleViewQR(request);
                  }}
                  activeOpacity={0.7}
                >
                  <View style={styles.quickQrContent}>
                    <Ionicons name="qr-code-outline" size={16} color="#10B981" />
                    <Text style={styles.quickQrText}>
                      {request.requestType === 'BULK' ? 'View Group Pass QR' : 'View QR Code'}
                    </Text>
                  </View>
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <View style={styles.bottomNav}>
        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('HOME')}
        >
          <Ionicons name="home-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Home</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('REQUESTS')}
        >
          <Ionicons name="document-text" size={24} color="#1F2937" />
          <Text style={styles.navLabelActive}>Requests</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('HISTORY')}
        >
          <Ionicons name="time-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>History</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('PROFILE')}
        >
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>

      {/* Request Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.detailModalContainer}>
            <View style={styles.modalHandle} />

            {/* Header */}
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>Request Details</Text>
                {selectedRequest && (
                  <Text style={styles.modalSubtitle}>
                    {formatDate(selectedRequest.requestDate)}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setShowDetailModal(false)} style={styles.closeButton}>
                <Ionicons name="close" size={20} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedRequest && (
              <ScrollView style={styles.detailModalContent} showsVerticalScrollIndicator={false}>

                {/* Pass Details */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitleBold}>Pass Details</Text>

                  <View style={styles.detailChipRow}>
                    <View style={styles.detailChip}>
                      <Ionicons name="flag-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailChipLabel}>Purpose</Text>
                      <Text style={styles.detailChipValue}>{selectedRequest.purpose || 'N/A'}</Text>
                    </View>
                    <View style={styles.detailChip}>
                      <Ionicons name="calendar-outline" size={14} color="#6B7280" />
                      <Text style={styles.detailChipLabel}>Date</Text>
                      <Text style={styles.detailChipValue}>
                        {new Date(selectedRequest.requestDate).toLocaleDateString('en-GB', {
                          day: '2-digit', month: 'short', year: 'numeric'
                        })}
                      </Text>
                    </View>
                  </View>

                  {selectedRequest.reason && (
                    <View style={styles.reasonBox}>
                      <Text style={styles.reasonLabel}>Reason</Text>
                      <Text style={styles.reasonText}>{selectedRequest.reason}</Text>
                    </View>
                  )}
                </View>

                {/* Attachment */}
                {selectedRequest.attachmentUri && (
                  <View style={styles.infoSection}>
                    <Text style={styles.sectionTitleBold}>Attachment</Text>
                    <TouchableOpacity
                      onPress={() => {
                        setPreviewAttachmentUri(selectedRequest.attachmentUri);
                        setShowAttachmentPreview(true);
                      }}
                      activeOpacity={0.85}
                    >
                      <View style={styles.attachmentContainer}>
                        <Image
                          source={{ uri: selectedRequest.attachmentUri }}
                          style={styles.attachmentImage}
                          resizeMode="cover"
                        />
                        <View style={styles.attachmentTapHint}>
                          <Ionicons name="eye-outline" size={16} color="#6B7280" />
                          <Text style={styles.attachmentTapText}>Tap to preview full image</Text>
                        </View>
                      </View>
                    </TouchableOpacity>
                  </View>
                )}

                {/* Request Status (timeline) */}
                <View style={styles.infoSection}>
                  <Text style={styles.sectionTitleBold}>Request Status</Text>
                  <RequestTimeline
                    status={selectedRequest.status}
                    staffApproval={selectedRequest.staffApproval || 'PENDING'}
                    hodApproval={selectedRequest.hodApproval || 'PENDING'}
                    requestDate={selectedRequest.requestDate}
                    staffRemark={selectedRequest.staffRemark || selectedRequest.rejectionReason}
                    hodRemark={selectedRequest.hodRemark}
                  />
                </View>

                {/* Final status pill at the bottom */}
                <View style={styles.finalStatusRow}>
                  <View style={[
                    styles.finalStatusBadge,
                    { backgroundColor: getStatusColor(selectedRequest.status) + '18',
                      borderColor: getStatusColor(selectedRequest.status) }
                  ]}>
                    <Ionicons
                      name={
                        selectedRequest.status === 'APPROVED' ? 'checkmark-circle' :
                        selectedRequest.status === 'REJECTED' ? 'close-circle' : 'time'
                      }
                      size={18}
                      color={getStatusColor(selectedRequest.status)}
                    />
                    <Text style={[styles.finalStatusText, { color: getStatusColor(selectedRequest.status) }]}>
                      {getStatusLabel(selectedRequest.status)}
                    </Text>
                  </View>
                </View>

                <TouchableOpacity
                  style={styles.closeModalButton}
                  onPress={() => setShowDetailModal(false)}
                >
                  <Text style={styles.closeModalButtonText}>Close</Text>
                </TouchableOpacity>

                <View style={{ height: 20 }} />
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bulk Request Detail Modal */}
      <MyRequestsBulkModal
        visible={showBulkModal}
        onClose={() => setShowBulkModal(false)}
        requestId={selectedRequestId || 0}
        requesterInfo={{
          name: `${student.firstName} ${student.lastName || ''}`,
          role: 'STUDENT',
          department: student.department || 'N/A'
        }}
      />

      {/* Fullscreen Attachment Preview Modal */}
      <Modal
        visible={showAttachmentPreview}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowAttachmentPreview(false)}
      >
        <View style={styles.attachmentPreviewOverlay}>
          <TouchableOpacity
            style={styles.attachmentPreviewClose}
            onPress={() => setShowAttachmentPreview(false)}
          >
            <Ionicons name="close" size={26} color="#FFFFFF" />
          </TouchableOpacity>
          {previewAttachmentUri && (
            <Image
              source={{ uri: previewAttachmentUri }}
              style={styles.attachmentPreviewImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>

      {/* QR Code Modal */}
      <GatePassQRModal
        visible={showQRModal}
        onClose={() => setShowQRModal(false)}
        personName={`${student.firstName} ${student.lastName || ''}`}
        personId={student.regNo}
        qrCodeData={qrCodeData}
        manualCode={manualEntryCode}
        reason={selectedRequest?.reason || selectedRequest?.purpose}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 100,
  },
  emptyState: {
    paddingVertical: 80,
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  requestTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    flex: 1,
    marginRight: 8,
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  requestDate: {
    fontSize: 13,
    color: '#9CA3AF',
    marginTop: 4,
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
    shadowRadius: 8,
    elevation: 8,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 4,
    fontWeight: '500',
  },
  navLabelActive: {
    fontSize: 12,
    color: '#1F2937',
    marginTop: 4,
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 32,
    height: 3,
    backgroundColor: '#1F2937',
    borderRadius: 2,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalSubtitle: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 3,
    fontWeight: '500',
  },
  closeButton: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    padding: 20,
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

  qrModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  qrModalContent: {
    padding: 20,
  },
  qrCodeContainer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  qrCodeWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 4,
  },
  qrCodeImage: {
    width: 200,
    height: 200,
  },
  qrLoadingContainer: {
    width: 200,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  qrLoadingText: {
    fontSize: 16,
    color: '#9CA3AF',
  },
  manualCodeContainer: {
    backgroundColor: '#F3F4F6',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 20,
  },
  manualCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6B7280',
    marginBottom: 8,
  },
  manualCodeText: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    letterSpacing: 2,
  },
  qrInstructions: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 20,
  },
  detailModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  modalHandle: {
    width: 40,
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: 12,
    marginBottom: 8,
  },
  detailModalContent: {
    paddingHorizontal: 20,
  },
  infoSection: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitleBold: {
    fontSize: 16,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 12,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  infoLabel: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },
  attachmentContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  attachmentImage: {
    width: '100%',
    height: 200,
  },
  closeModalButton: {
    backgroundColor: '#F3F4F6',
    paddingVertical: 15,
    borderRadius: 16,
    alignItems: 'center',
  },
  closeModalButtonText: {
    fontWeight: '800',
    color: '#1F2937',
  },
  viewQRButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 15,
    borderRadius: 16,
    marginBottom: 12,
    gap: 8,
  },
  viewQRButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  attachmentTapHint: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: 6,
    backgroundColor: '#F9FAFB',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  attachmentTapText: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
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
  quickQrButton: {
    marginTop: 12,
    backgroundColor: '#D1FAE5',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  quickQrContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  quickQrText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  detailChipRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 12,
  },
  detailChip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 4,
  },
  detailChipLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  detailChipValue: {
    fontSize: 14,
    color: '#1F2937',
    fontWeight: '700',
  },
  reasonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 20,
  },
  finalStatusRow: {
    alignItems: 'center',
    marginBottom: 16,
    marginTop: 4,
  },
  finalStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 24,
    borderWidth: 1.5,
  },
  finalStatusText: {
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default StudentRequestsScreen;
