import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Image,
  TextInput,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

const { width: SCREEN_W } = Dimensions.get('window');

interface SinglePassDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  request: any;
  onApprove?: (id: number, remark: string) => void;
  onReject?: (id: number, remark: string) => void;
  showActions?: boolean;
  // 'staff' = staff approving (no remarks yet)
  // 'hod'   = HOD approving (show staff remark)
  // 'hr'    = HR / view-only (show staff + HOD remarks)
  viewerRole?: 'staff' | 'hod' | 'hr';
}

const SinglePassDetailsModal: React.FC<SinglePassDetailsModalProps> = ({
  visible,
  onClose,
  request,
  onApprove,
  onReject,
  showActions = false,
  viewerRole = 'hr',
}) => {
  const [remark, setRemark] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => {
    if (visible) setRemark('');
  }, [visible, request?.id]);

  if (!request) return null;

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-US', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit', hour12: true,
    });
  };

  const getInitials = (name: string) =>
    (name || 'ST').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const getStatusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'APPROVED': return '#10B981';
      case 'REJECTED': return '#EF4444';
      default: return '#F59E0B';
    }
  };

  const statusColor = getStatusColor(request.status || request.hrApproval);
  const statusLabel = (request.hrApproval || request.status || 'PENDING').toUpperCase();

  // Which remarks to show based on viewer role
  const showStaffRemark = (viewerRole === 'hod' || viewerRole === 'hr') && !!request.staffRemark;
  const showHodRemark   = viewerRole === 'hr' && !!request.hodRemark;
  const hasAnyRemark    = showStaffRemark || showHodRemark;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={false}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.screen} edges={['top', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

        {/* ── Header ── */}
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose} style={styles.backBtn}>
            <Ionicons name="arrow-back" size={22} color="#1F2937" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Pass Verification</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '18' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* ── Profile Row ── */}
        <View style={styles.profileRow}>
          <View style={[styles.avatar, { backgroundColor: statusColor }]}>
            <Text style={styles.avatarText}>
              {getInitials(request.studentName || request.staffName || request.regNo || 'ST')}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            {request.requestType === 'VISITOR' && (
              <View style={styles.visitorBadge}>
                <Text style={styles.visitorBadgeText}>VISITOR</Text>
              </View>
            )}
            <Text style={styles.profileName} numberOfLines={1}>
              {request.studentName || request.staffName || request.regNo}
            </Text>
            <Text style={styles.profileSub} numberOfLines={1}>
              {request.regNo || request.staffCode} • {request.department || 'N/A'}
            </Text>
          </View>
        </View>

        {/* ── Info Grid ── */}
        <View style={styles.infoGrid}>
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>PURPOSE</Text>
            <Text style={styles.infoValue} numberOfLines={2}>{request.purpose || 'General'}</Text>
          </View>
          <View style={styles.infoDivider} />
          <View style={styles.infoCell}>
            <Text style={styles.infoLabel}>
              {request.requestType === 'VISITOR' ? 'ENTRY DATE' : 'EXIT DATE'}
            </Text>
            <Text style={styles.infoValue} numberOfLines={2}>
              {formatDate(request.visitDate || request.exitDateTime || request.requestDate)}
            </Text>
          </View>
        </View>

        {/* ── Reason ── */}
        <View style={styles.block}>
          <Text style={styles.blockLabel}>REASON</Text>
          <Text style={styles.reasonText} numberOfLines={3}>
            {request.reason || 'No reason provided.'}
          </Text>
        </View>

        {/* ── Attachment Preview ── */}
        <View style={styles.block}>
          <Text style={styles.blockLabel}>PREVIEW</Text>
          {request.attachmentUri ? (
            <TouchableOpacity
              style={styles.previewBox}
              onPress={() => setShowFullscreen(true)}
              activeOpacity={0.85}
            >
              <Image
                source={{ uri: request.attachmentUri }}
                style={styles.previewImage}
                resizeMode="cover"
              />
              <View style={styles.previewOverlay}>
                <Ionicons name="expand-outline" size={16} color="#FFF" />
                <Text style={styles.previewOverlayText}>Tap to expand</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={styles.noPreview}>
              <Ionicons name="image-outline" size={22} color="#D1D5DB" />
              <Text style={styles.noPreviewText}>No attachment</Text>
            </View>
          )}
        </View>

        {/* ── Remarks (context-aware) ── */}
        {hasAnyRemark && (
          <View style={styles.block}>
            <Text style={styles.blockLabel}>REMARKS</Text>
            {showStaffRemark && (
              <View style={styles.remarkChip}>
                <Text style={styles.remarkChipRole}>Staff</Text>
                <Text style={styles.remarkChipText} numberOfLines={3}>{request.staffRemark}</Text>
              </View>
            )}
            {showHodRemark && (
              <View style={[styles.remarkChip, showStaffRemark && { marginTop: 8 }]}>
                <Text style={styles.remarkChipRole}>HOD</Text>
                <Text style={styles.remarkChipText} numberOfLines={3}>{request.hodRemark}</Text>
              </View>
            )}
          </View>
        )}

        {/* ── Spacer ── */}
        <View style={{ flex: 1 }} />

        {/* ── Action Footer ── */}
        {showActions ? (
          <View style={styles.footer}>
            <TextInput
              style={styles.remarkInput}
              placeholder="Add review notes (optional)..."
              placeholderTextColor="#9CA3AF"
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={2}
            />
            <View style={styles.actionRow}>
              {onReject && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.rejectBtn]}
                  onPress={() => onReject(request.id, remark)}
                >
                  <Ionicons name="close-circle" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              )}
              {onApprove && (
                <TouchableOpacity
                  style={[styles.actionBtn, styles.approveBtn]}
                  onPress={() => onApprove(request.id, remark)}
                >
                  <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Approve</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={styles.footer}>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* ── Fullscreen Attachment ── */}
      <Modal
        visible={showFullscreen}
        animationType="fade"
        transparent={true}
        onRequestClose={() => setShowFullscreen(false)}
      >
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity
            style={styles.fullscreenCloseBtn}
            onPress={() => setShowFullscreen(false)}
          >
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {request?.attachmentUri && (
            <Image
              source={{ uri: request.attachmentUri }}
              style={styles.fullscreenImage}
              resizeMode="contain"
            />
          )}
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
    gap: 10,
  },
  backBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    flex: 1,
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
  },
  statusPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  statusPillText: {
    fontSize: 11,
    fontWeight: '800',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },

  // Profile
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 12,
    borderRadius: 14,
    padding: 12,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#FFFFFF',
  },
  profileInfo: { flex: 1 },
  visitorBadge: {
    backgroundColor: '#EDE9FE',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    alignSelf: 'flex-start',
    marginBottom: 2,
  },
  visitorBadgeText: {
    fontSize: 9,
    fontWeight: '800',
    color: '#7C3AED',
    letterSpacing: 0.5,
  },
  profileName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111827',
  },
  profileSub: {
    fontSize: 12,
    color: '#6B7280',
    marginTop: 2,
  },

  // Info grid
  infoGrid: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  infoCell: {
    flex: 1,
    padding: 12,
  },
  infoDivider: {
    width: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 8,
  },
  infoLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#1F2937',
    lineHeight: 18,
  },

  // Generic block
  block: {
    backgroundColor: '#FFFFFF',
    marginHorizontal: 16,
    marginTop: 10,
    borderRadius: 14,
    padding: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 1,
  },
  blockLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: '#9CA3AF',
    letterSpacing: 0.8,
    marginBottom: 8,
  },
  reasonText: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 20,
    fontWeight: '500',
  },

  // Attachment preview — small rectangle
  previewBox: {
    width: SCREEN_W * 0.38,
    height: 80,
    borderRadius: 10,
    overflow: 'hidden',
    backgroundColor: '#000',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  previewOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0,0,0,0.45)',
    paddingVertical: 4,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
  },
  previewOverlayText: {
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
  },
  noPreview: {
    width: SCREEN_W * 0.38,
    height: 80,
    borderRadius: 10,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  noPreviewText: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '500',
  },

  // Remarks
  remarkChip: {
    backgroundColor: '#FFFBEB',
    borderRadius: 10,
    padding: 10,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  remarkChipRole: {
    fontSize: 10,
    fontWeight: '800',
    color: '#D97706',
    letterSpacing: 0.5,
    marginBottom: 3,
    textTransform: 'uppercase',
  },
  remarkChipText: {
    fontSize: 13,
    color: '#92400E',
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Footer
  footer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: Platform.OS === 'ios' ? 8 : 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  remarkInput: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111827',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    textAlignVertical: 'top',
    marginBottom: 10,
    maxHeight: 68,
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
    paddingVertical: 14,
    borderRadius: 14,
    gap: 8,
  },
  rejectBtn: { backgroundColor: '#EF4444' },
  approveBtn: { backgroundColor: '#10B981' },
  actionBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },
  closeBtn: {
    backgroundColor: '#1F2937',
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: 'center',
  },
  closeBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '700',
  },

  // Fullscreen
  fullscreenOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.96)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreenCloseBtn: {
    position: 'absolute',
    top: 52,
    right: 20,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  fullscreenImage: {
    width: '95%',
    height: '80%',
    borderRadius: 12,
  },
});

export default SinglePassDetailsModal;
