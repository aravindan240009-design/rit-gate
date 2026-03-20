import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  TextInput,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { apiService } from '../services/api';
import { THEME } from '../config/api.config';
import ParticipantsScreen from '../screens/shared/ParticipantsScreen';
import GatePassQRModal from './GatePassQRModal';

interface BulkDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  requestId: number;
  requesterInfo?: {
    name: string;
    role: string;
    department: string;
  };
  onApprove?: (id: number, remark: string) => void;
  onReject?: (id: number, remark: string) => void;
  showActions?: boolean;
  currentUserId?: string;
  processing?: boolean;
}

const BulkDetailsModal: React.FC<BulkDetailsModalProps> = ({
  visible,
  onClose,
  requestId,
  requesterInfo,
  onApprove,
  onReject,
  showActions = false,
  currentUserId,
  processing = false,
}) => {
  const [loading, setLoading] = useState(true);
  const [details, setDetails] = useState<any>(null);
  const [requester, setRequester] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [remark, setRemark] = useState('');
  const [showQRDetailed, setShowQRDetailed] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [showFullscreenAttachment, setShowFullscreenAttachment] = useState(false);
  const [participants, setParticipants] = useState<any[]>([]);

  useEffect(() => {
    if (visible && requestId) {
      loadDetails();
      setShowQRDetailed(false);
      setRemark('');
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
    return String(details.qrOwnerId).trim() === String(participant.id || participant.regNo || participant.staffCode).trim();
  };

  const isApproved = details?.status === 'APPROVED'
    || details?.hrApproval === 'APPROVED'
    || (details?.qrCode != null && details?.qrCode !== '');

  const statusColor = isApproved ? '#10B981' : '#F59E0B';
  const statusLabel = details?.status === 'REJECTED' ? 'REJECTED'
    : isApproved ? 'APPROVED' : 'PENDING';

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen}>
        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Bulk Pass Details</Text>
            {participants.length > 0 && (
              <Text style={styles.headerSub}>{participants.length} participants</Text>
            )}
          </View>
          {/* status pill */}
          {!loading && !error && (
            <View style={[styles.statusPill, { backgroundColor: statusColor + '18', borderColor: statusColor }]}>
              <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
            </View>
          )}
        </View>

        {/* ── Body ── */}
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
          <View style={styles.body}>
            {/* Row 1 — Requester card */}
            {requester && (
              <View style={styles.requesterCard}>
                <View style={styles.avatar}>
                  <Text style={styles.avatarText}>
                    {(requester.name || 'U').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View style={styles.requesterInfo}>
                  <Text style={styles.requesterName}>{requester.name || requester.requestedByStaffName}</Text>
                  <Text style={styles.requesterSub}>{requester.role || 'Staff'} · {requester.department}</Text>
                </View>
                {details?.qrOwnerId && (
                  <View style={styles.receiverPill}>
                    <Ionicons name="qr-code-outline" size={12} color="#6B21A8" />
                    <Text style={styles.receiverPillText}>QR: {details.qrOwnerId}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Row 2 — Info chips */}
            <View style={styles.chipRow}>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>PURPOSE</Text>
                <Text style={styles.chipValue} numberOfLines={1}>{details?.purpose || 'N/A'}</Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>DATE</Text>
                <Text style={styles.chipValue} numberOfLines={1}>
                  {new Date(details?.exitDateTime || details?.requestDate || '').toLocaleDateString('en-GB', {
                    day: '2-digit', month: 'short', year: 'numeric'
                  })}
                </Text>
              </View>
              <View style={styles.chip}>
                <Text style={styles.chipLabel}>PARTICIPANTS</Text>
                <Text style={styles.chipValue}>{participants.length}</Text>
              </View>
            </View>

            {/* Row 3 — Reason */}
            <View style={styles.reasonBox}>
              <Text style={styles.reasonLabel}>REASON</Text>
              <Text style={styles.reasonText} numberOfLines={2}>{details?.reason || 'N/A'}</Text>
            </View>

            {/* Row 4 — Attachment + Remarks side by side (if both exist) or full width */}
            <View style={styles.midRow}>
              {details?.attachmentUri ? (
                <TouchableOpacity
                  style={[styles.attachmentThumb, !details?.staffRemark && !details?.hodRemark && { flex: 1 }]}
                  onPress={() => setShowFullscreenAttachment(true)}
                  activeOpacity={0.85}
                >
                  <Image source={{ uri: details.attachmentUri }} style={styles.thumbImage} resizeMode="cover" />
                  <View style={styles.thumbOverlay}>
                    <Ionicons name="expand-outline" size={16} color="#FFF" />
                    <Text style={styles.thumbText}>PREVIEW</Text>
                  </View>
                </TouchableOpacity>
              ) : null}

              {(details?.staffRemark || details?.hodRemark) && (
                <View style={[styles.remarksBox, !details?.attachmentUri && { flex: 1 }]}>
                  <Text style={styles.remarksSectionLabel}>REMARKS</Text>
                  {details?.staffRemark && (
                    <View style={styles.remarkItem}>
                      <Text style={styles.remarkRole}>Staff</Text>
                      <Text style={styles.remarkText} numberOfLines={2}>{details.staffRemark}</Text>
                    </View>
                  )}
                  {details?.hodRemark && (
                    <View style={[styles.remarkItem, { marginTop: 6 }]}>
                      <Text style={styles.remarkRole}>HOD</Text>
                      <Text style={styles.remarkText} numberOfLines={2}>{details.hodRemark}</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Row 5 — View Participants button */}
            {participants.length > 0 && (
              <TouchableOpacity style={styles.participantsBtn} onPress={() => setShowParticipants(true)}>
                <Ionicons name="people" size={18} color="#FFF" />
                <Text style={styles.participantsBtnText}>View Participants</Text>
                <View style={styles.countBadge}>
                  <Text style={styles.countBadgeText}>{participants.length}</Text>
                </View>
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* ── Footer — remark input + action buttons ── */}
        {!loading && !error && showActions && (
          <View style={styles.footer}>
            <TextInput
              style={styles.remarkInput}
              placeholder="Add a remark (optional)..."
              placeholderTextColor="#9CA3AF"
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={2}
              editable={!processing}
            />
            <View style={styles.actionRow}>
              {onReject && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn, processing && { opacity: 0.5 }]}
                  onPress={() => { onClose(); onReject(requestId, remark); }}
                  disabled={processing}
                >
                  <Ionicons name="close-circle" size={18} color="#FFF" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              )}
              {onApprove && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn, processing && { opacity: 0.5 }]}
                  onPress={() => { onClose(); onApprove(requestId, remark); }}
                  disabled={processing}
                >
                  {processing ? (
                    <ActivityIndicator size="small" color="#FFF" />
                  ) : (
                    <Ionicons name="checkmark-circle" size={18} color="#FFF" />
                  )}
                  <Text style={styles.actionBtnText}>{processing ? 'Processing...' : 'Approve'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        )}

        {/* ── Sub-screens ── */}
        <GatePassQRModal
          visible={showQRDetailed}
          onClose={() => setShowQRDetailed(false)}
          personName={requester?.name || details?.requestedByStaffName || 'N/A'}
          personId={String(details?.qrOwnerId || '')}
          qrCodeData={details?.qrCode || details?.qrData?.qrString || null}
          manualCode={details?.manualCode || details?.qrData?.manualEntryCode}
          reason={details?.purpose}
        />

        <Modal
          visible={showParticipants}
          animationType="slide"
          transparent={false}
          onRequestClose={() => setShowParticipants(false)}
        >
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

        <Modal
          visible={showFullscreenAttachment}
          animationType="fade"
          transparent={true}
          onRequestClose={() => setShowFullscreenAttachment(false)}
        >
          <View style={styles.fsOverlay}>
            <TouchableOpacity style={styles.fsCloseBtn} onPress={() => setShowFullscreenAttachment(false)}>
              <Ionicons name="close" size={28} color="#FFF" />
            </TouchableOpacity>
            {details?.attachmentUri && (
              <Image source={{ uri: details.attachmentUri }} style={styles.fsImage} resizeMode="contain" />
            )}
          </View>
        </Modal>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F3F4F6',
  },

  /* Header */
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerCenter: {
    flex: 1,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerSub: {
    fontSize: 12,
    color: '#9CA3AF',
    marginTop: 1,
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Center states */
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 15,
    color: '#6B7280',
  },
  errorText: {
    marginTop: 12,
    fontSize: 15,
    color: '#EF4444',
    textAlign: 'center',
  },
  retryBtn: {
    marginTop: 16,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: THEME.colors.primary,
    borderRadius: 8,
  },
  retryText: {
    color: '#FFF',
    fontWeight: '600',
  },

  /* Body — flex column, no scroll */
  body: {
    flex: 1,
    padding: 14,
    gap: 10,
  },

  /* Requester card */
  requesterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    gap: 10,
  },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: THEME.colors.primary + '20',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 17,
    fontWeight: '700',
    color: THEME.colors.primary,
  },
  requesterInfo: {
    flex: 1,
  },
  requesterName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111827',
  },
  requesterSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },
  receiverPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F3E8FF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  receiverPillText: {
    fontSize: 11,
    color: '#6B21A8',
    fontWeight: '700',
  },

  /* Chips row */
  chipRow: {
    flexDirection: 'row',
    gap: 8,
  },
  chip: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  chipLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 3,
  },
  chipValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#1F2937',
  },

  /* Reason */
  reasonBox: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  reasonLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  reasonText: {
    fontSize: 13,
    color: '#374151',
    fontWeight: '500',
    lineHeight: 18,
  },

  /* Mid row — attachment + remarks */
  midRow: {
    flexDirection: 'row',
    gap: 10,
    flex: 1,
    minHeight: 0,
  },
  attachmentThumb: {
    width: 120,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#000',
  },
  thumbImage: {
    width: '100%',
    flex: 1,
  },
  thumbOverlay: {
    backgroundColor: 'rgba(0,0,0,0.55)',
    paddingVertical: 6,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  thumbText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  remarksBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  remarksSectionLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    fontWeight: '700',
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  remarkItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  remarkRole: {
    fontSize: 10,
    fontWeight: '700',
    color: '#6B7280',
    marginBottom: 2,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  remarkText: {
    fontSize: 12,
    color: '#374151',
    lineHeight: 16,
  },

  /* Participants button */
  participantsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4F46E5',
    paddingVertical: 13,
    borderRadius: 14,
    gap: 8,
  },
  participantsBtnText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFF',
  },
  countBadge: {
    backgroundColor: 'rgba(255,255,255,0.25)',
    borderRadius: 10,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  countBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFF',
  },

  /* Footer */
  footer: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    gap: 10,
  },
  remarkInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 10,
    padding: 10,
    fontSize: 14,
    color: '#1F2937',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    maxHeight: 70,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 13,
    borderRadius: 12,
    gap: 6,
  },
  rejectBtn: {
    backgroundColor: '#EF4444',
  },
  approveBtn: {
    backgroundColor: '#10B981',
  },
  actionBtnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },

  /* Fullscreen attachment */
  fsOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fsCloseBtn: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fsImage: {
    width: '92%',
    height: '80%',
  },
});

export default BulkDetailsModal;
