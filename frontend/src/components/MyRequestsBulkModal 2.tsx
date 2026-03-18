import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { apiService } from '../services/api';
import { THEME } from '../config/api.config';
import ParticipantsScreen from '../screens/shared/ParticipantsScreen';
import GatePassQRModal from './GatePassQRModal';

interface MyRequestsBulkModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;
  requesterInfo?: {
    name: string;
    role: string;
    department: string;
  };
}

const MyRequestsBulkModal: React.FC<MyRequestsBulkModalProps> = ({
  visible,
  onClose,
  requestId,
  requesterInfo,
}) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const [requester, setRequester] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [showQRDetailed, setShowQRDetailed] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showFullscreenAttachment, setShowFullscreenAttachment] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (visible && requestId) {
      loadDetails();
      setShowQRDetailed(false);
    }
  }, [visible, requestId]);

  const loadDetails = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiService.getBulkGatePassDetails(requestId) as any;
      if (response.success) {
        const requestData = response.request || response.data || response;
        setDetails(requestData);
        const incomingParticipants =
          (response.request && response.request.participants) ||
          response.participants ||
          (response.request && response.request.students) ||
          response.students ||
          [];
        setParticipants(incomingParticipants);
        setRequester(response.requester || (response.request && response.request.requester) || requesterInfo);
      } else {
        setError(response.message || 'Failed to load details');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-US', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true,
    });
  };

  const students = participants.filter(p => p.type === 'student' || !p.type);
  const staffParticipants = participants.filter(p => p.type === 'staff' || p.type === 'hod');

  const isReceiver = (participant: any) => {
    if (!details?.qrOwnerId) return false;
    return String(details.qrOwnerId).trim() === String(participant.id || participant.regNo || participant.staffCode).trim();
  };

  const isApproved =
    details?.status === 'APPROVED' ||
    (details?.qrCode != null && details?.qrCode !== '');

  const hasQR = !!(details?.qrCode || details?.qrData?.qrString);

  return (
    <Modal visible={visible} animationType="slide" transparent={true} onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Bulk Pass Details</Text>
              {participants.length > 0 && (
                <Text style={styles.subtitle}>{participants.length} Participants</Text>
              )}
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={24} color="#6B7280" />
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.center}>
              <ActivityIndicator size="large" color={THEME.colors.primary} />
              <Text style={styles.loadingText}>Loading...</Text>
            </View>
          ) : error ? (
            <View style={styles.center}>
              <Ionicons name="alert-circle" size={48} color="#EF4444" />
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity style={styles.retryBtn} onPress={loadDetails}>
                <Text style={styles.retryText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Requester */}
              {requester && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Requested By</Text>
                  <View style={styles.requesterCard}>
                    <View style={styles.avatar}>
                      <Text style={styles.avatarText}>
                        {(requester.name || 'U').charAt(0).toUpperCase()}
                      </Text>
                    </View>
                    <View style={styles.requesterInfo}>
                      <Text style={styles.requesterName}>{requester.name}</Text>
                      <Text style={styles.requesterSub}>{requester.role} • {requester.department}</Text>
                    </View>
                  </View>
                </View>
              )}

              {/* Pass Info */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Pass Information</Text>
                <View style={styles.infoRow}>
                  <Ionicons name="time-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Pass Time:</Text>
                  <Text style={styles.infoValue}>{formatDate(details?.exitDateTime || details?.requestDate)}</Text>
                </View>
                <View style={styles.infoGrid}>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Purpose</Text>
                    <Text style={styles.infoBoxValue}>{details?.purpose || 'N/A'}</Text>
                  </View>
                  <View style={styles.infoBox}>
                    <Text style={styles.infoBoxLabel}>Status</Text>
                    <View style={[styles.statusBadge, { backgroundColor: isApproved ? '#D1FAE5' : '#FEF3C7' }]}>
                      <Text style={[styles.statusText, { color: isApproved ? '#10B981' : '#F59E0B' }]}>
                        {isApproved ? 'APPROVED' : (details?.status || 'PENDING')}
                      </Text>
                    </View>
                  </View>
                </View>
                <View style={[styles.infoRow, { alignItems: 'flex-start', marginTop: 8 }]}>
                  <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                  <Text style={styles.infoLabel}>Reason:</Text>
                  <Text style={styles.infoValue}>{details?.reason || 'N/A'}</Text>
                </View>
                {/* HOD Remark */}
                {details?.hodRemark ? (
                  <View style={styles.hodRemarkBox}>
                    <Text style={styles.hodRemarkLabel}>HOD Remark</Text>
                    <Text style={styles.hodRemarkText}>"{details.hodRemark}"</Text>
                  </View>
                ) : null}
              </View>

              {/* Attachment Section */}
              {details?.attachmentUri && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Attachment</Text>
                  <TouchableOpacity style={styles.attachmentCard} onPress={() => setShowFullscreenAttachment(true)}>
                    <Image source={{ uri: details.attachmentUri }} style={styles.attachmentImage} resizeMode="cover" />
                    <View style={styles.attachmentOverlay}>
                      <Ionicons name="expand-outline" size={20} color="#FFF" />
                      <Text style={styles.attachmentOverlayText}>Tap to View Full</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* Approval Timeline */}
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Timeline</Text>
                <View style={styles.timelineBar} />

                {/* Step 1: Submitted */}
                <View style={styles.timelineItem}>
                  <View style={[styles.timelineIcon, styles.timelineIconComplete]}>
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>Request Submitted</Text>
                    <Text style={[styles.timelineStatus, styles.timelineStatusComplete]}>✓ Completed</Text>
                  </View>
                </View>

                <View style={[styles.timelineLine, styles.timelineLineComplete]} />

                {/* Step 2: HOD Approval */}
                <View style={styles.timelineItem}>
                  <View style={[
                    styles.timelineIcon,
                    (details?.status === 'APPROVED' || details?.status === 'REJECTED' || details?.hodApproval === 'APPROVED') ? styles.timelineIconComplete : styles.timelineIconPending,
                    details?.hodApproval === 'REJECTED' && styles.timelineIconRejected,
                  ]}>
                    {(details?.hodApproval === 'APPROVED' || details?.status === 'APPROVED') ? (
                      <Ionicons name="checkmark" size={16} color="#FFF" />
                    ) : details?.hodApproval === 'REJECTED' ? (
                      <Ionicons name="close" size={16} color="#FFF" />
                    ) : (
                      <View style={styles.timelineDot} />
                    )}
                  </View>
                  <View style={styles.timelineContent}>
                    <Text style={styles.timelineTitle}>HOD Approval</Text>
                    <Text style={[
                      styles.timelineStatus,
                      (details?.hodApproval === 'APPROVED' || details?.status === 'APPROVED') && styles.timelineStatusComplete,
                      details?.hodApproval === 'REJECTED' && styles.timelineStatusRejected,
                    ]}>
                      {(details?.hodApproval === 'APPROVED' || details?.status === 'APPROVED')
                        ? '✓ Completed'
                        : details?.hodApproval === 'REJECTED'
                        ? '✗ Rejected'
                        : 'Pending'}
                    </Text>
                    {details?.hodRemark ? (
                      <View style={styles.remarkBox}>
                        <Text style={styles.remarkLabel}>HOD Remark:</Text>
                        <Text style={styles.remarkText}>{details.hodRemark}</Text>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>

              {/* View Participants */}
              {participants.length > 0 && (
                <View style={styles.section}>
                  <TouchableOpacity style={styles.participantsBtn} onPress={() => setShowParticipants(true)}>
                    <Ionicons name="people" size={20} color="#FFFFFF" />
                    <Text style={styles.participantsBtnText}>View Participants</Text>
                    <View style={styles.countBadge}>
                      <Text style={styles.countBadgeText}>{participants.length}</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              )}

              {/* View QR — always shown when approved */}
              {isApproved && hasQR && (
                <View style={styles.section}>
                  <TouchableOpacity style={styles.qrBtn} onPress={() => setShowQRDetailed(true)}>
                    <Ionicons name="qr-code" size={20} color="#FFFFFF" />
                    <Text style={styles.qrBtnText}>View QR & Manual Code</Text>
                  </TouchableOpacity>
                </View>
              )}

              <View style={{ height: 40 }} />
            </ScrollView>
          )}

          {/* QR Modal */}
          <GatePassQRModal
            visible={showQRDetailed}
            onClose={() => setShowQRDetailed(false)}
            personName={requester?.name || details?.requestedByStaffName || 'N/A'}
            personId={String(details?.qrOwnerId || '')}
            qrCodeData={details?.qrCode || details?.qrData?.qrString || null}
            manualCode={details?.manualCode || details?.qrData?.manualEntryCode}
            reason={details?.purpose}
          />

          {/* Participants Modal */}
          <Modal visible={showParticipants} animationType="slide" transparent={false} onRequestClose={() => setShowParticipants(false)}>
            <ParticipantsScreen
              participants={[
                ...students.map(s => ({
                  id: s.id || s.regNo || '',
                  name: s.name || s.studentName || s.fullName || 'N/A',
                  type: 'student' as const,
                  department: s.department,
                  isReceiver: isReceiver(s),
                })),
                ...staffParticipants.map(s => ({
                  id: s.id || s.staffCode || '',
                  name: s.name || s.fullName || 'N/A',
                  type: 'staff' as const,
                  department: s.department,
                  isReceiver: isReceiver(s),
                })),
              ]}
              onBack={() => setShowParticipants(false)}
              title="Participants"
            />
          </Modal>

          {/* Fullscreen Attachment Modal */}
          <Modal visible={showFullscreenAttachment} animationType="fade" transparent={true} onRequestClose={() => setShowFullscreenAttachment(false)}>
            <View style={styles.fullscreenOverlay}>
              <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setShowFullscreenAttachment(false)}>
                <Ionicons name="close" size={28} color="#FFFFFF" />
              </TouchableOpacity>
              {details?.attachmentUri && (
                <Image source={{ uri: details.attachmentUri }} style={styles.fullscreenImage} resizeMode="contain" />
              )}
            </View>
          </Modal>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' },
  container: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, height: '85%' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F3F4F6' },
  title: { fontSize: 20, fontWeight: '700', color: '#1F2937' },
  subtitle: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  closeBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  loadingText: { marginTop: 12, fontSize: 16, color: '#6B7280' },
  errorText: { marginTop: 12, fontSize: 16, color: '#EF4444', textAlign: 'center' },
  retryBtn: { marginTop: 20, paddingHorizontal: 24, paddingVertical: 12, backgroundColor: THEME.colors.primary, borderRadius: 8 },
  retryText: { color: '#FFF', fontWeight: '600' },
  content: { flex: 1, padding: 20 },
  section: { marginBottom: 20 },
  sectionTitle: { fontSize: 13, fontWeight: '700', color: '#6B7280', textTransform: 'uppercase', letterSpacing: 1, marginBottom: 10 },
  requesterCard: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#E5E7EB' },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: THEME.colors.primary + '20', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  avatarText: { fontSize: 18, fontWeight: '700', color: THEME.colors.primary },
  requesterInfo: { flex: 1 },
  requesterName: { fontSize: 16, fontWeight: '700', color: '#111827' },
  requesterSub: { fontSize: 13, color: '#6B7280', marginTop: 2 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 10, gap: 8 },
  infoLabel: { fontSize: 14, color: '#6B7280', width: 70 },
  infoValue: { flex: 1, fontSize: 14, color: '#1F2937', fontWeight: '500' },
  infoGrid: { flexDirection: 'row', gap: 12, marginBottom: 4 },
  infoBox: { flex: 1, backgroundColor: '#F9FAFB', padding: 12, borderRadius: 12 },
  infoBoxLabel: { fontSize: 12, color: '#6B7280', marginBottom: 4 },
  infoBoxValue: { fontSize: 15, fontWeight: '600', color: '#1F2937' },
  statusBadge: { alignSelf: 'flex-start', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6 },
  statusText: { fontSize: 12, fontWeight: '700' },
  hodRemarkBox: { marginTop: 10, backgroundColor: '#FEF3C7', borderRadius: 10, padding: 12, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  hodRemarkLabel: { fontSize: 11, fontWeight: '700', color: '#D97706', letterSpacing: 0.5, marginBottom: 4, textTransform: 'uppercase' },
  hodRemarkText: { fontSize: 13, color: '#92400E', fontStyle: 'italic', lineHeight: 18 },
  timelineBar: { height: 3, backgroundColor: '#10B981', borderRadius: 2, marginBottom: 14 },
  timelineItem: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 2 },
  timelineIcon: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#E5E7EB', justifyContent: 'center', alignItems: 'center', flexShrink: 0 },
  timelineIconComplete: { backgroundColor: '#10B981' },
  timelineIconPending: { backgroundColor: '#F3F4F6', borderWidth: 2, borderColor: '#E5E7EB' },
  timelineIconRejected: { backgroundColor: '#EF4444' },
  timelineDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: '#9CA3AF' },
  timelineContent: { flex: 1, paddingTop: 6 },
  timelineTitle: { fontSize: 15, fontWeight: '700', color: '#1F2937', marginBottom: 2 },
  timelineStatus: { fontSize: 13, color: '#6B7280' },
  timelineStatusComplete: { color: '#10B981' },
  timelineStatusRejected: { color: '#EF4444' },
  timelineLine: { width: 2, height: 24, backgroundColor: '#E5E7EB', marginLeft: 15, marginVertical: 2 },
  timelineLineComplete: { backgroundColor: '#10B981' },
  remarkBox: { marginTop: 8, backgroundColor: '#F3F4F6', borderRadius: 8, paddingHorizontal: 12, paddingVertical: 8, borderLeftWidth: 3, borderLeftColor: '#F59E0B' },
  remarkLabel: { fontSize: 12, fontWeight: '700', color: '#6B7280', marginBottom: 2 },
  remarkText: { fontSize: 14, color: '#1F2937', lineHeight: 20, fontWeight: '500' },
  participantsBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#4F46E5', paddingVertical: 14, borderRadius: 14, gap: 10 },
  participantsBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  countBadge: { backgroundColor: 'rgba(255,255,255,0.25)', borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2 },
  countBadgeText: { fontSize: 12, fontWeight: '700', color: '#FFF' },
  qrBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', backgroundColor: '#10B981', paddingVertical: 14, borderRadius: 14, gap: 10 },
  qrBtnText: { fontSize: 15, fontWeight: '700', color: '#FFF' },
  qrOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  qrCard: { width: '100%', backgroundColor: '#FFF', borderRadius: 24, padding: 24, alignItems: 'center' },
  qrCardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', width: '100%', marginBottom: 20 },
  qrCardTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  qrOwnerInfo: { alignItems: 'center', marginBottom: 20 },
  qrOwnerName: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  qrOwnerId: { fontSize: 14, color: '#6B7280', marginTop: 4 },
  qrWrapper: { padding: 16, backgroundColor: '#FFF', borderRadius: 20, borderWidth: 1, borderColor: '#F3F4F6', elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  scanText: { marginTop: 20, fontSize: 12, fontWeight: '600', color: '#6B7280', letterSpacing: 1 },
  manualBox: { marginTop: 20, backgroundColor: '#FEF3C7', padding: 16, borderRadius: 12, width: '100%', alignItems: 'center', borderWidth: 1, borderColor: '#FDE68A' },
  manualLabel: { fontSize: 13, color: '#92400E', fontWeight: '700' },
  manualCode: { fontSize: 32, fontWeight: '800', color: '#92400E', marginTop: 8, letterSpacing: 4 },
  manualHint: { fontSize: 11, color: '#D97706', marginTop: 8 },
  qrFooter: { marginTop: 20, width: '100%', backgroundColor: '#F9FAFB', borderRadius: 12, padding: 16 },
  qrFooterRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 8 },
  qrFooterLabel: { fontSize: 13, color: '#6B7280' },
  qrFooterValue: { fontSize: 13, fontWeight: '600', color: '#1F2937', flex: 1, textAlign: 'right', marginLeft: 12 },
  qrCloseBtn: { marginTop: 20, backgroundColor: '#1F2937', width: '100%', paddingVertical: 14, borderRadius: 12, alignItems: 'center' },
  qrCloseBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  attachmentCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#000' },
  attachmentImage: { width: '100%', height: 200 },
  attachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  attachmentOverlayText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullscreenCloseBtn: { position: 'absolute', top: 50, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  fullscreenImage: { width: '92%', height: '80%' },
});

export default MyRequestsBulkModal;
