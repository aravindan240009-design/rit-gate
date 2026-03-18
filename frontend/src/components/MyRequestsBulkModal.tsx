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
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { THEME } from '../config/api.config';
import ParticipantsScreen from '../screens/shared/ParticipantsScreen';
import GatePassQRModal from './GatePassQRModal';

interface MyRequestsBulkModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;
  userRole?: 'STAFF' | 'HOD';
  currentUserId?: string;
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
  userRole = 'STAFF',
  currentUserId,
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
      const response = userRole === 'HOD'
        ? await (apiService as any).getHODBulkGatePassDetails(requestId)
        : await apiService.getBulkGatePassDetails(requestId) as any;
      if (response.success) {
        const requestData = response.request || response.data || response;
        console.log('[MyRequestsBulkModal] requestData:', JSON.stringify(requestData, null, 2));
        setDetails(requestData);
        const incomingParticipants =
          (response.request && response.request.participants) ||
          response.participants ||
          (response.request && response.request.students) ||
          response.students ||
          [];
        setParticipants(incomingParticipants);
        setRequester(
          response.requester ||
          (response.request && response.request.requester) ||
          requesterInfo
        );
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
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const students = participants.filter(p => p.type === 'student' || !p.type);
  const staffParticipants = participants.filter(p => p.type === 'staff' || p.type === 'hod');

  const isReceiver = (participant: any) => {
    if (!details?.qrOwnerId) return false;
    return String(details.qrOwnerId).trim() ===
      String(participant.id || participant.regNo || participant.staffCode).trim();
  };

  const isApproved =
    details?.status === 'APPROVED' ||
    (details?.qrCode != null && details?.qrCode !== '');

  const hasQR = !!(details?.qrCode || details?.qrData?.qrString);

  // Only the QR owner (receiver) can view the QR
  const isQROwner = currentUserId
    ? String(currentUserId).trim() === String(details?.qrOwnerId || '').trim()
    : true; // if no currentUserId passed, show by default (HOD bulk — HOD is always owner)

  const statusColor =
    details?.status === 'REJECTED' ? '#EF4444' :
    isApproved ? '#10B981' : '#F59E0B';
  const statusLabel =
    details?.status === 'REJECTED' ? 'REJECTED' :
    isApproved ? 'APPROVED' : (details?.status || 'PENDING');

  // Normalize enum values that may come as objects or strings
  const hodApprovalStr = details?.hodApproval != null ? String(details.hodApproval) : null;
  const hrApprovalStr = details?.hrApproval != null ? String(details.hrApproval) : null;
  const statusStr = details?.status != null ? String(details.status) : null;

  const superiorLabel = userRole === 'HOD' ? 'HR Remark:' : 'HOD Remark:';
  const superiorRemark = userRole === 'HOD' ? details?.hrRemark : details?.hodRemark;
  const superiorApprovalLabel = userRole === 'HOD' ? 'HR Approval' : 'HOD Approval';
  const superiorApproved =
    userRole === 'HOD'
      ? (hrApprovalStr === 'APPROVED' || statusStr === 'APPROVED')
      : (hodApprovalStr === 'APPROVED' || statusStr === 'APPROVED');
  const superiorRejected =
    userRole === 'HOD'
      ? (hrApprovalStr === 'REJECTED' || statusStr === 'REJECTED')
      : hodApprovalStr === 'REJECTED';


  return (
    <Modal visible={visible} animationType="slide" transparent={false} onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Bulk Pass Details</Text>
            {participants.length > 0 && (
              <Text style={styles.headerSub}>{participants.length} Participants</Text>
            )}
          </View>
          {!loading && !error && (
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          )}
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
            {requester && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Requested By</Text>
                <View style={styles.requesterCard}>
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>{(requester.name || 'U').charAt(0).toUpperCase()}</Text>
                  </View>
                  <View style={styles.requesterInfo}>
                    <Text style={styles.requesterName}>{requester.name}</Text>
                    <Text style={styles.requesterSub}>{requester.role} • {requester.department}</Text>
                  </View>
                </View>
              </View>
            )}

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
                  <Text style={styles.infoBoxLabel}>Participants</Text>
                  <Text style={styles.infoBoxValue}>{participants.length}</Text>
                </View>
              </View>
              <View style={[styles.infoRow, { alignItems: 'flex-start', marginTop: 8 }]}>
                <Ionicons name="document-text-outline" size={16} color="#6B7280" />
                <Text style={styles.infoLabel}>Reason:</Text>
                <Text style={styles.infoValue}>{details?.reason || 'N/A'}</Text>
              </View>
            </View>

            {details?.attachmentUri ? (
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
            ) : null}

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Request Status</Text>
              <View style={styles.timelineBar} />
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
              <View style={styles.timelineItem}>
                <View style={[
                  styles.timelineIcon,
                  superiorApproved ? styles.timelineIconComplete : styles.timelineIconPending,
                  superiorRejected ? styles.timelineIconRejected : undefined,
                ]}>
                  {superiorApproved ? (
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  ) : superiorRejected ? (
                    <Ionicons name="close" size={16} color="#FFF" />
                  ) : (
                    <View style={styles.timelineDot} />
                  )}
                </View>
                <View style={styles.timelineContent}>
                  <Text style={styles.timelineTitle}>{superiorApprovalLabel}</Text>
                  <Text style={[
                    styles.timelineStatus,
                    superiorApproved ? styles.timelineStatusComplete : undefined,
                    superiorRejected ? styles.timelineStatusRejected : undefined,
                  ]}>
                    {superiorApproved ? '✓ Completed' : superiorRejected ? '✗ Rejected' : 'Pending'}
                  </Text>
                  {superiorRemark ? (
                    <View style={styles.remarkBox}>
                      <Text style={styles.remarkLabel}>{superiorLabel}</Text>
                      <Text style={styles.remarkText}>{superiorRemark}</Text>
                    </View>
                  ) : null}
                </View>
              </View>
            </View>

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

            {isApproved && hasQR && isQROwner && (
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

        <GatePassQRModal
          visible={showQRDetailed}
          onClose={() => setShowQRDetailed(false)}
          personName={requester?.name || details?.requestedByStaffName || 'N/A'}
          personId={String(details?.qrOwnerId || '')}
          qrCodeData={details?.qrCode || details?.qrData?.qrString || null}
          manualCode={details?.manualCode || details?.qrData?.manualEntryCode}
          reason={details?.purpose}
        />

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
      </SafeAreaView>
    </Modal>
  );
};


const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F3F4F6' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 14, backgroundColor: '#FFFFFF', borderBottomWidth: 1, borderBottomColor: '#E5E7EB', gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#F3F4F6', justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#1F2937' },
  headerSub: { fontSize: 12, color: '#9CA3AF', marginTop: 1 },
  statusPill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20, borderWidth: 1.5 },
  statusPillText: { fontSize: 11, fontWeight: '800', letterSpacing: 0.5 },
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
  attachmentCard: { borderRadius: 16, overflow: 'hidden', borderWidth: 1, borderColor: '#E5E7EB', backgroundColor: '#000' },
  attachmentImage: { width: '100%', height: 200 },
  attachmentOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.5)', padding: 12, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8 },
  attachmentOverlayText: { color: '#FFF', fontSize: 14, fontWeight: '600' },
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
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.95)', justifyContent: 'center', alignItems: 'center' },
  fullscreenCloseBtn: { position: 'absolute', top: 50, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  fullscreenImage: { width: '92%', height: '80%' },
});

export default MyRequestsBulkModal;
