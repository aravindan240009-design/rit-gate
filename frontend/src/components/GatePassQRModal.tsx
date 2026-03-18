import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ScrollView,
  Image,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';

interface GatePassQRModalProps {
  visible: boolean;
  onClose: () => void;
  // Person info shown at top
  personName: string;
  personId: string; // regNo / staffCode / hodCode
  // QR data
  qrCodeData: string | null;
  manualCode?: string | null;
  // Footer details
  reason?: string;
  validUntil?: string; // defaults to "One time"
}

const isQRString = (val: string) =>
  val.startsWith('GP|') || val.startsWith('ST|') || val.startsWith('SF|') || val.startsWith('VG|');

const GatePassQRModal: React.FC<GatePassQRModalProps> = ({
  visible,
  onClose,
  personName,
  personId,
  qrCodeData,
  manualCode,
  reason,
  validUntil = 'One time',
}) => {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Gate Pass QR Code</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn}>
              <Ionicons name="close" size={22} color="#374151" />
            </TouchableOpacity>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {/* Person Info */}
            <Text style={styles.personName}>{personName.toUpperCase()}</Text>
            <Text style={styles.personId}>{personId}</Text>

            {/* QR Code */}
            <View style={styles.qrCard}>
              {qrCodeData ? (
                isQRString(qrCodeData) ? (
                  <QRCode
                    value={qrCodeData}
                    size={220}
                    color="#000000"
                    backgroundColor="#FFFFFF"
                  />
                ) : (
                  <Image
                    source={{ uri: qrCodeData.startsWith('data:image') ? qrCodeData : `data:image/png;base64,${qrCodeData}` }}
                    style={styles.qrImage}
                    resizeMode="contain"
                  />
                )
              ) : (
                <View style={styles.qrLoading}>
                  <ActivityIndicator size="large" color="#6B7280" />
                  <Text style={styles.qrLoadingText}>Loading...</Text>
                </View>
              )}
            </View>

            {/* Manual Entry Code — dashed box */}
            {manualCode ? (
              <View style={styles.manualBox}>
                <Text style={styles.manualLabel}>MANUAL ENTRY CODE</Text>
                <Text style={styles.manualValue}>{manualCode}</Text>
              </View>
            ) : null}

            {/* Scan instruction */}
            <Text style={styles.scanText}>SCAN AT MAIN GATE EXIT</Text>

            {/* Details card */}
            <View style={styles.detailsCard}>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Reason:</Text>
                <Text style={styles.detailValue} numberOfLines={2}>
                  {reason || 'Gate Pass'}
                </Text>
              </View>
              <View style={styles.detailRow}>
                <Text style={styles.detailLabel}>Valid Until:</Text>
                <Text style={styles.detailValue}>{validUntil}</Text>
              </View>
            </View>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    width: '100%',
    maxWidth: 360,
    maxHeight: '88%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  title: {
    fontSize: 18,
    fontWeight: '800',
    color: '#111827',
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#E5E7EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  body: {
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 14,
    paddingBottom: 24,
  },
  personName: {
    fontSize: 17,
    fontWeight: '800',
    color: '#111827',
    textAlign: 'center',
    letterSpacing: 0.5,
  },
  personId: {
    fontSize: 13,
    color: '#6B7280',
    fontWeight: '600',
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
  },
  qrCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 5,
    marginBottom: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrLoading: {
    width: 220,
    height: 220,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
  },
  qrLoadingText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontWeight: '500',
  },
  manualBox: {
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: '#9CA3AF',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '100%',
    marginBottom: 12,
  },
  manualLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1,
    marginBottom: 5,
  },
  manualValue: {
    fontSize: 28,
    fontWeight: '700',
    color: '#111827',
    letterSpacing: 6,
  },
  scanText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#6B7280',
    letterSpacing: 1.5,
    marginBottom: 14,
  },
  detailsCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    width: '100%',
    gap: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  detailLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '500',
    flex: 1,
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '800',
    color: '#111827',
    flex: 2,
    textAlign: 'right',
  },
});

export default GatePassQRModal;
