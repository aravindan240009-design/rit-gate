import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, Modal, TouchableOpacity, Image,
  TextInput, StatusBar, Platform, Dimensions, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const { width: SCREEN_W } = Dimensions.get('window');

interface SinglePassDetailsModalProps {
  visible: boolean;
  onClose: () => void;
  request: any;
  onApprove?: (id: number, remark: string) => void;
  onReject?: (id: number, remark: string) => void;
  showActions?: boolean;
  viewerRole?: 'staff' | 'hod' | 'hr';
  processing?: boolean;
}

const SinglePassDetailsModal: React.FC<SinglePassDetailsModalProps> = ({
  visible, onClose, request, onApprove, onReject,
  showActions = false, viewerRole = 'hr', processing = false,
}) => {
  const { theme, isDark } = useTheme();
  const [remark, setRemark] = useState('');
  const [showFullscreen, setShowFullscreen] = useState(false);

  useEffect(() => { if (visible) setRemark(''); }, [visible, request?.id]);

  if (!request) return null;

  const formatDate = (d: string) => {
    if (!d) return 'N/A';
    return new Date(d).toLocaleString('en-US', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true });
  };

  const getInitials = (name: string) =>
    (name || 'ST').split(' ').map(n => n[0]).join('').toUpperCase().substring(0, 2);

  const getStatusColor = (s: string) => {
    switch (s?.toUpperCase()) {
      case 'APPROVED': return theme.success;
      case 'REJECTED': return theme.error;
      default: return theme.warning;
    }
  };

  const statusColor = getStatusColor(request.status || request.hrApproval);
  const statusLabel = (request.hrApproval || request.status || 'PENDING').toUpperCase();
  const showStaffRemark = (viewerRole === 'hod' || viewerRole === 'hr') && !!request.staffRemark;
  const showHodRemark = viewerRole === 'hr' && !!request.hodRemark;
  const hasAnyRemark = showStaffRemark || showHodRemark;

  return (
    <Modal visible={visible} animationType="slide" transparent={false} statusBarTranslucent onRequestClose={onClose}>
      <SafeAreaView style={[styles.screen, { backgroundColor: theme.background }]} edges={['top', 'bottom']}>
        <StatusBar barStyle={isDark ? 'light-content' : 'dark-content'} backgroundColor={theme.surface} />

        {/* Header */}
        <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
          <TouchableOpacity onPress={onClose} style={[styles.backBtn, { backgroundColor: theme.inputBackground }]}>
            <Ionicons name="arrow-back" size={22} color={theme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: theme.text }]}>Pass Verification</Text>
          <View style={[styles.statusPill, { backgroundColor: statusColor + '22' }]}>
            <Text style={[styles.statusPillText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
        </View>

        {/* Profile Row */}
        <View style={[styles.profileRow, { backgroundColor: theme.surface }]}>
          <View style={[styles.avatar, { backgroundColor: statusColor }]}>
            <Text style={styles.avatarText}>{getInitials(request.studentName || request.staffName || request.regNo || 'ST')}</Text>
          </View>
          <View style={styles.profileInfo}>
            {request.requestType === 'VISITOR' && (
              <View style={[styles.visitorBadge, { backgroundColor: theme.primary + '22' }]}>
                <Text style={[styles.visitorBadgeText, { color: theme.primary }]}>VISITOR</Text>
              </View>
            )}
            <Text style={[styles.profileName, { color: theme.text }]} numberOfLines={1}>
              {request.studentName || request.staffName || request.regNo}
            </Text>
            <Text style={[styles.profileSub, { color: theme.textSecondary }]} numberOfLines={1}>
              {request.regNo || request.staffCode} • {request.department || 'N/A'}
            </Text>
          </View>
        </View>

        {/* Info Grid */}
        <View style={[styles.infoGrid, { backgroundColor: theme.surface }]}>
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>PURPOSE</Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>{request.purpose || 'General'}</Text>
          </View>
          <View style={[styles.infoDivider, { backgroundColor: theme.border }]} />
          <View style={styles.infoCell}>
            <Text style={[styles.infoLabel, { color: theme.textTertiary }]}>
              {request.requestType === 'VISITOR' ? 'ENTRY DATE' : 'EXIT DATE'}
            </Text>
            <Text style={[styles.infoValue, { color: theme.text }]} numberOfLines={2}>
              {formatDate(request.visitDate || request.exitDateTime || request.requestDate)}
            </Text>
          </View>
        </View>

        {/* Reason */}
        <View style={[styles.block, { backgroundColor: theme.surface }]}>
          <Text style={[styles.blockLabel, { color: theme.textTertiary }]}>REASON</Text>
          <Text style={[styles.reasonText, { color: theme.textSecondary }]} numberOfLines={3}>
            {request.reason || 'No reason provided.'}
          </Text>
        </View>

        {/* Attachment */}
        <View style={[styles.block, { backgroundColor: theme.surface }]}>
          <Text style={[styles.blockLabel, { color: theme.textTertiary }]}>PREVIEW</Text>
          {request.attachmentUri ? (
            <TouchableOpacity style={styles.previewBox} onPress={() => setShowFullscreen(true)} activeOpacity={0.85}>
              <Image source={{ uri: request.attachmentUri }} style={styles.previewImage} resizeMode="cover" />
              <View style={styles.previewOverlay}>
                <Ionicons name="expand-outline" size={16} color="#FFF" />
                <Text style={styles.previewOverlayText}>Tap to expand</Text>
              </View>
            </TouchableOpacity>
          ) : (
            <View style={[styles.noPreview, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
              <Ionicons name="image-outline" size={22} color={theme.textTertiary} />
              <Text style={[styles.noPreviewText, { color: theme.textTertiary }]}>No attachment</Text>
            </View>
          )}
        </View>

        {/* Remarks */}
        {hasAnyRemark && (
          <View style={[styles.block, { backgroundColor: theme.surface }]}>
            <Text style={[styles.blockLabel, { color: theme.textTertiary }]}>REMARKS</Text>
            {showStaffRemark && (
              <View style={[styles.remarkChip, { backgroundColor: theme.warning + '15', borderLeftColor: theme.warning }]}>
                <Text style={[styles.remarkChipRole, { color: theme.warning }]}>Staff</Text>
                <Text style={[styles.remarkChipText, { color: theme.text }]} numberOfLines={3}>{request.staffRemark}</Text>
              </View>
            )}
            {showHodRemark && (
              <View style={[styles.remarkChip, showStaffRemark && { marginTop: 8 }, { backgroundColor: theme.primary + '15', borderLeftColor: theme.primary }]}>
                <Text style={[styles.remarkChipRole, { color: theme.primary }]}>HOD</Text>
                <Text style={[styles.remarkChipText, { color: theme.text }]} numberOfLines={3}>{request.hodRemark}</Text>
              </View>
            )}
          </View>
        )}

        <View style={{ flex: 1 }} />

        {/* Footer */}
        {showActions ? (
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TextInput
              style={[styles.remarkInput, { backgroundColor: theme.inputBackground, borderColor: theme.border, color: theme.text }]}
              placeholder="Add review notes (optional)..."
              placeholderTextColor={theme.textTertiary}
              value={remark}
              onChangeText={setRemark}
              multiline
              numberOfLines={2}
              editable={!processing}
            />
            <View style={styles.actionRow}>
              {onReject && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.error }, processing && { opacity: 0.5 }]} onPress={() => onReject(request.id, remark)} disabled={processing}>
                  <Ionicons name="close-circle" size={20} color="#FFF" />
                  <Text style={styles.actionBtnText}>Reject</Text>
                </TouchableOpacity>
              )}
              {onApprove && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: theme.success }, processing && { opacity: 0.5 }]} onPress={() => onApprove(request.id, remark)} disabled={processing}>
                  {processing ? <ActivityIndicator size="small" color="#FFF" /> : <Ionicons name="checkmark-circle" size={20} color="#FFF" />}
                  <Text style={styles.actionBtnText}>{processing ? 'Processing...' : 'Approve'}</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        ) : (
          <View style={[styles.footer, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
            <TouchableOpacity style={[styles.closeBtn, { backgroundColor: theme.primary }]} onPress={onClose}>
              <Text style={styles.closeBtnText}>Close</Text>
            </TouchableOpacity>
          </View>
        )}
      </SafeAreaView>

      {/* Fullscreen */}
      <Modal visible={showFullscreen} animationType="fade" transparent={true} onRequestClose={() => setShowFullscreen(false)}>
        <View style={styles.fullscreenOverlay}>
          <TouchableOpacity style={styles.fullscreenCloseBtn} onPress={() => setShowFullscreen(false)}>
            <Ionicons name="close" size={28} color="#FFFFFF" />
          </TouchableOpacity>
          {request?.attachmentUri && <Image source={{ uri: request.attachmentUri }} style={styles.fullscreenImage} resizeMode="contain" />}
        </View>
      </Modal>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1 },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, gap: 10 },
  backBtn: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { flex: 1, fontSize: 17, fontWeight: '800' },
  statusPill: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  statusPillText: { fontSize: 11, fontWeight: '800', textTransform: 'uppercase', letterSpacing: 0.5 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginHorizontal: 16, marginTop: 12, borderRadius: 14, padding: 12, gap: 12, elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.05, shadowRadius: 4 },
  avatar: { width: 48, height: 48, borderRadius: 24, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  avatarText: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  profileInfo: { flex: 1 },
  visitorBadge: { paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, alignSelf: 'flex-start', marginBottom: 2 },
  visitorBadgeText: { fontSize: 9, fontWeight: '800', letterSpacing: 0.5 },
  profileName: { fontSize: 16, fontWeight: '700' },
  profileSub: { fontSize: 12, marginTop: 2 },
  infoGrid: { flexDirection: 'row', marginHorizontal: 16, marginTop: 10, borderRadius: 14, overflow: 'hidden', elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  infoCell: { flex: 1, padding: 12 },
  infoDivider: { width: 1, marginVertical: 8 },
  infoLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 4 },
  infoValue: { fontSize: 13, fontWeight: '600', lineHeight: 18 },
  block: { marginHorizontal: 16, marginTop: 10, borderRadius: 14, padding: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  blockLabel: { fontSize: 10, fontWeight: '700', letterSpacing: 0.8, marginBottom: 8 },
  reasonText: { fontSize: 14, lineHeight: 20, fontWeight: '500' },
  previewBox: { width: SCREEN_W * 0.38, height: 80, borderRadius: 10, overflow: 'hidden', backgroundColor: '#000' },
  previewImage: { width: '100%', height: '100%' },
  previewOverlay: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: 'rgba(0,0,0,0.45)', paddingVertical: 4, flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 4 },
  previewOverlayText: { color: '#FFF', fontSize: 11, fontWeight: '600' },
  noPreview: { width: SCREEN_W * 0.38, height: 80, borderRadius: 10, borderWidth: 1, borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center', gap: 4 },
  noPreviewText: { fontSize: 11, fontWeight: '500' },
  remarkChip: { borderRadius: 10, padding: 10, borderLeftWidth: 3 },
  remarkChipRole: { fontSize: 10, fontWeight: '800', letterSpacing: 0.5, marginBottom: 3, textTransform: 'uppercase' },
  remarkChipText: { fontSize: 13, lineHeight: 18, fontStyle: 'italic' },
  footer: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: Platform.OS === 'ios' ? 8 : 14, borderTopWidth: 1 },
  remarkInput: { borderRadius: 12, paddingHorizontal: 14, paddingVertical: 10, fontSize: 14, borderWidth: 1, textAlignVertical: 'top', marginBottom: 10, maxHeight: 68 },
  actionRow: { flexDirection: 'row', gap: 10 },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 14, borderRadius: 14, gap: 8 },
  actionBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  closeBtn: { paddingVertical: 14, borderRadius: 14, alignItems: 'center' },
  closeBtnText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  fullscreenOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.96)', justifyContent: 'center', alignItems: 'center' },
  fullscreenCloseBtn: { position: 'absolute', top: 52, right: 20, width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(255,255,255,0.2)', justifyContent: 'center', alignItems: 'center', zIndex: 10 },
  fullscreenImage: { width: '95%', height: '80%', borderRadius: 12 },
});

export default SinglePassDetailsModal;
