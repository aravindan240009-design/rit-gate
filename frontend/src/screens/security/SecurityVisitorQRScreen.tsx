import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Modal,
  RefreshControl,
  Alert,
  StatusBar,
  Clipboard,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import QRCode from 'react-native-qrcode-svg';
import { SecurityPersonnel, ScreenName } from '../../types';
import { API_CONFIG } from '../../config/api.config';
import SecurityBottomNav from '../../components/SecurityBottomNav';

interface VisitorRequest {
  id: number;
  name: string;
  phone: string;
  purpose: string;
  personToMeet: string; // Staff member name
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  qrCode?: string;
  manualCode?: string;
  createdAt: string;
}

interface Props {
  security: SecurityPersonnel;
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
}

const SecurityVisitorQRScreen: React.FC<Props> = ({ security, onBack, onNavigate }) => {
  const [visitors, setVisitors] = useState<VisitorRequest[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<VisitorRequest[]>([]);
  const [selectedFilter, setSelectedFilter] = useState<'ALL' | 'PENDING' | 'APPROVED' | 'REJECTED'>('ALL');
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorRequest | null>(null);
  const [showQRModal, setShowQRModal] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchVisitors();
  }, []);

  useEffect(() => {
    applyFilter();
  }, [selectedFilter, visitors]);

  const fetchVisitors = async () => {
    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/security/my-visitor-requests?securityId=${security.securityId}`);
      if (response.ok) {
        const result = await response.json();
        // Backend returns { success: true, data: [...], count: X }
        const data = result.data || result;
        setVisitors(Array.isArray(data) ? data : []);
      } else {
        console.error('Failed to fetch visitors:', response.status);
        setVisitors([]);
      }
    } catch (error) {
      console.error('Error fetching visitors:', error);
      setVisitors([]);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchVisitors();
    setRefreshing(false);
  };

  const applyFilter = () => {
    if (!visitors || !Array.isArray(visitors)) {
      setFilteredVisitors([]);
      return;
    }
    
    if (selectedFilter === 'ALL') {
      setFilteredVisitors(visitors);
    } else {
      setFilteredVisitors(visitors.filter(v => v.status === selectedFilter));
    }
  };

  const openQRModal = (visitor: VisitorRequest) => {
    if (visitor.status !== 'APPROVED') {
      Alert.alert('Not Approved', 'This visitor request has not been approved yet.');
      return;
    }
    setSelectedVisitor(visitor);
    setShowQRModal(true);
  };

  const copyManualCode = (code: string) => {
    try {
      Clipboard.setString(code);
      Alert.alert('Copied!', 'Manual code copied to clipboard', [{ text: 'OK' }]);
    } catch (error) {
      Alert.alert('Error', 'Failed to copy code to clipboard');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#10B981';
      case 'PENDING': return '#F59E0B';
      case 'REJECTED': return '#EF4444';
      default: return '#6B7280';
    }
  };

  const getStatusBgColor = (status: string) => {
    switch (status) {
      case 'APPROVED': return '#D1FAE5';
      case 'PENDING': return '#FEF3C7';
      case 'REJECTED': return '#FEE2E2';
      default: return '#F3F4F6';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => onNavigate('VISITOR_REGISTRATION')} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Visitor QR Codes</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        {(['ALL', 'PENDING', 'APPROVED', 'REJECTED'] as const).map((filter) => (
          <TouchableOpacity
            key={filter}
            style={[
              styles.filterTab,
              selectedFilter === filter && styles.filterTabActive,
            ]}
            onPress={() => setSelectedFilter(filter)}
          >
            <Text
              numberOfLines={1}
              style={[
                styles.filterText,
                selectedFilter === filter && styles.filterTextActive,
              ]}
            >
              {filter}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Visitor List */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#00BCD4']} />
        }
      >
        {filteredVisitors.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No visitor requests found</Text>
            <Text style={styles.emptySubtext}>
              {selectedFilter === 'ALL' 
                ? 'Visitor requests will appear here' 
                : `No ${selectedFilter.toLowerCase()} requests`}
            </Text>
          </View>
        ) : (
          filteredVisitors.map((visitor) => (
            <TouchableOpacity
              key={visitor.id}
              style={styles.card}
              onPress={() => openQRModal(visitor)}
              disabled={visitor.status !== 'APPROVED'}
              activeOpacity={0.7}
            >
              <View style={styles.cardHeader}>
                <View style={styles.cardHeaderLeft}>
                  <View style={styles.iconContainer}>
                    <Ionicons name="person" size={20} color="#00BCD4" />
                  </View>
                  <View style={styles.cardHeaderInfo}>
                    <Text style={styles.visitorName}>{visitor.name}</Text>
                    <Text style={styles.visitorPhone}>{visitor.phone}</Text>
                  </View>
                </View>
                <View style={[styles.statusBadge, { backgroundColor: getStatusBgColor(visitor.status) }]}>
                  <Text style={[styles.statusText, { color: getStatusColor(visitor.status) }]}>
                    {visitor.status}
                  </Text>
                </View>
              </View>

              <View style={styles.cardDivider} />

              <View style={styles.cardBody}>
                <View style={styles.infoRow}>
                  <Ionicons name="document-text-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoLabel}>Purpose:</Text>
                  <Text style={styles.infoValue}>{visitor.purpose}</Text>
                </View>

                <View style={styles.infoRow}>
                  <Ionicons name="person-outline" size={18} color="#6B7280" />
                  <Text style={styles.infoLabel}>Meeting:</Text>
                  <Text style={styles.infoValue}>{visitor.personToMeet}</Text>
                </View>

                {visitor.status === 'APPROVED' && (
                  <View style={styles.qrIndicator}>
                    <Ionicons name="qr-code" size={16} color="#00BCD4" />
                    <Text style={styles.qrIndicatorText}>Tap to view QR code</Text>
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))
        )}
      </ScrollView>

      {/* QR Code Modal */}
      <Modal
        visible={showQRModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowQRModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor QR Code</Text>
              <TouchableOpacity 
                onPress={() => setShowQRModal(false)}
                style={styles.modalCloseButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <>
                <View style={styles.modalVisitorInfo}>
                  <Text style={styles.modalVisitorName}>{selectedVisitor.name}</Text>
                  <Text style={styles.modalVisitorPhone}>{selectedVisitor.phone}</Text>
                  <Text style={styles.modalVisitorMeeting}>Meeting: {selectedVisitor.personToMeet}</Text>
                </View>

                {selectedVisitor.qrCode && (
                  <View style={styles.qrContainer}>
                    <View style={styles.qrWrapper}>
                      <QRCode value={selectedVisitor.qrCode} size={220} />
                    </View>
                  </View>
                )}

                {selectedVisitor.manualCode && (
                  <View style={styles.manualCodeContainer}>
                    <View style={styles.manualCodeHeader}>
                      <Text style={styles.manualCodeLabel}>Manual Entry Code</Text>
                      <TouchableOpacity
                        style={styles.copyButton}
                        onPress={() => copyManualCode(selectedVisitor.manualCode!)}
                        activeOpacity={0.7}
                      >
                        <Ionicons name="copy-outline" size={18} color="#92400E" />
                        <Text style={styles.copyButtonText}>Copy</Text>
                      </TouchableOpacity>
                    </View>
                    <Text style={styles.manualCodeValue}>{selectedVisitor.manualCode}</Text>
                  </View>
                )}

                <View style={styles.instructionContainer}>
                  <Ionicons name="information-circle-outline" size={20} color="#6B7280" />
                  <Text style={styles.instructionText}>
                    Scan this QR code or enter the manual code at the gate
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>
      </Modal>

      <SecurityBottomNav
        activeTab="visitor"
        onNavigate={onNavigate}
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
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    width: 40,
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    minHeight: 40,
  },
  filterTabActive: {
    backgroundColor: '#E0F7FA',
    borderColor: '#00BCD4',
  },
  filterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6B7280',
    textAlign: 'center',
  },
  filterTextActive: {
    color: '#00BCD4',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
    overflow: 'hidden',
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  cardHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#E0F7FA',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  cardHeaderInfo: {
    flex: 1,
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  visitorPhone: {
    fontSize: 13,
    color: '#6B7280',
  },
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
  },
  cardDivider: {
    height: 1,
    backgroundColor: '#F3F4F6',
    marginHorizontal: 16,
  },
  cardBody: {
    padding: 16,
    gap: 12,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    color: '#1F2937',
    flex: 1,
  },
  qrIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginTop: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
  },
  qrIndicatorText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#00BCD4',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#9CA3AF',
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 14,
    color: '#D1D5DB',
    marginTop: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
  },
  modalCloseButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalVisitorInfo: {
    alignItems: 'center',
    marginBottom: 24,
  },
  modalVisitorName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  modalVisitorPhone: {
    fontSize: 14,
    color: '#6B7280',
  },
  modalVisitorMeeting: {
    fontSize: 14,
    color: '#00BCD4',
    fontWeight: '600',
    marginTop: 6,
  },
  qrContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  qrWrapper: {
    padding: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  manualCodeContainer: {
    backgroundColor: '#FEF3C7',
    padding: 16,
    borderRadius: 12,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  manualCodeHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 8,
  },
  manualCodeLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
    textTransform: 'uppercase',
  },
  copyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FDE68A',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  copyButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#92400E',
  },
  manualCodeValue: {
    fontSize: 28,
    fontWeight: '800',
    color: '#92400E',
    letterSpacing: 4,
    textAlign: 'center',
    width: '100%',
  },
  instructionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
  },
  instructionText: {
    flex: 1,
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 18,
  },
});

export default SecurityVisitorQRScreen;
