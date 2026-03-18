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
import { SecurityPersonnel, ActivePerson, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import SecurityBottomNav from '../../components/SecurityBottomNav';
import { useProfile } from '../../context/ProfileContext';
import { useNotifications } from '../../context/NotificationContext';
import NotificationDropdown from '../../components/NotificationDropdown';

interface NewSecurityDashboardProps {
  user: SecurityPersonnel;
  onLogout: () => void;
  onNavigate: (screen: ScreenName) => void;
}

interface EscalatedVisitor {
  id: number;
  name: string;
  email: string;
  phone: string;
  department: string;
  personToMeet: string;
  purpose: string;
  numberOfPeople: number;
  status: string;
  escalatedToSecurity: boolean;
  escalationTime: string;
  notificationSentAt: string;
  createdAt: string;
}

const NewSecurityDashboard: React.FC<NewSecurityDashboardProps> = ({
  user,
  onLogout,
  onNavigate,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [activePersons, setActivePersons] = useState<ActivePerson[]>([]);
  const { profileImage } = useProfile();
  const [selectedPerson, setSelectedPerson] = useState<ActivePerson | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const { unreadCount, loadNotifications } = useNotifications();
  const [escalatedVisitors, setEscalatedVisitors] = useState<EscalatedVisitor[]>([]);
  const [selectedVisitor, setSelectedVisitor] = useState<EscalatedVisitor | null>(null);
  const [showVisitorModal, setShowVisitorModal] = useState(false);
  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [showNotificationDropdown, setShowNotificationDropdown] = useState(false);

  const [stats, setStats] = useState({
    active: 0,
    exited: 0,
    total: 0,
  });

  useEffect(() => {
    loadDashboardData();
    loadEscalatedVisitors();
    loadNotifications(user.securityId, 'security');
  }, []);

  const loadDashboardData = async () => {
    try {
      const response = await apiService.getActivePersons();
      if (response.success && response.data) {
        const validPersons = response.data.filter((person: ActivePerson) => 
          person.name && 
          !person.name.startsWith('QR Not Found') && 
          !person.name.includes('Unknown')
        );
        setActivePersons(validPersons);

        // Calculate stats
        const active = validPersons.filter((p: ActivePerson) => p.status === 'PENDING').length;
        const exited = validPersons.filter((p: ActivePerson) => p.status === 'EXITED').length;
        
        setStats({
          active,
          exited,
          total: validPersons.length,
        });
      }
    } catch (error) {
      console.error('Error loading dashboard data:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const loadEscalatedVisitors = async () => {
    try {
      const response = await apiService.getEscalatedVisitors();
      if (response.success && response.data) {
        setEscalatedVisitors(response.data);
      }
    } catch (error) {
      console.error('Error loading escalated visitors:', error);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadDashboardData();
    loadEscalatedVisitors();
  };

  const getInitials = (name: string) => {
    if (!name || typeof name !== 'string') return 'SG';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (timeString: string) => {
    try {
      const date = new Date(timeString);
      const hours = date.getHours();
      const minutes = date.getMinutes();
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const formattedHours = hours % 12 || 12;
      const formattedMinutes = minutes < 10 ? `0${minutes}` : minutes;
      return `${formattedHours}:${formattedMinutes} ${ampm}`;
    } catch (error) {
      return timeString;
    }
  };

  const handleManualExit = async (person: ActivePerson) => {
    Alert.alert(
      'Manual Exit',
      `Mark ${person.name} as exited?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Exit',
          style: 'destructive',
          onPress: async () => {
            try {
              const response = await apiService.manualExit(person.id);
              if (response.success) {
                Alert.alert('Success', `${person.name} has been marked as exited`);
                loadDashboardData();
              } else {
                Alert.alert('Error', response.message || 'Failed to mark exit');
              }
            } catch (error) {
              console.error('Manual exit error:', error);
              Alert.alert('Error', 'Failed to process manual exit');
            }
          }
        }
      ]
    );
  };

  const handleApproveVisitor = async (visitor: EscalatedVisitor) => {
    Alert.alert(
      'Approve Visitor',
      `Approve ${visitor.name} to visit ${visitor.personToMeet}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            try {
              const securityId = user.securityId || user.id?.toString() || 'SEC001';
              const response = await apiService.approveEscalatedVisitor(visitor.id, securityId);
              if (response.success) {
                Alert.alert('Success', 'Visitor approved successfully');
                setShowVisitorModal(false);
                loadEscalatedVisitors();
              } else {
                Alert.alert('Error', response.message || 'Failed to approve visitor');
              }
            } catch (error) {
              console.error('Approve visitor error:', error);
              Alert.alert('Error', 'Failed to approve visitor');
            }
          }
        }
      ]
    );
  };

  const handleRejectVisitor = async (visitor: EscalatedVisitor) => {
    setSelectedVisitor(visitor);
    setRejectionReason('');
    setShowRejectModal(true);
  };

  const confirmRejectVisitor = async () => {
    if (!selectedVisitor) return;

    try {
      const response = await apiService.rejectEscalatedVisitor(
        selectedVisitor.id,
        rejectionReason || 'Rejected by security'
      );
      if (response.success) {
        Alert.alert('Success', 'Visitor rejected');
        setShowRejectModal(false);
        setShowVisitorModal(false);
        setRejectionReason('');
        loadEscalatedVisitors();
      } else {
        Alert.alert('Error', response.message || 'Failed to reject visitor');
      }
    } catch (error) {
      console.error('Reject visitor error:', error);
      Alert.alert('Error', 'Failed to reject visitor');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity 
            style={styles.avatar}
            onPress={() => onNavigate('PROFILE')}
          >
            {profileImage ? (
              <Image source={{ uri: profileImage }} style={styles.avatarImage} />
            ) : (
              <Text style={styles.avatarText}>{getInitials(user.name || user.securityName || 'SG')}</Text>
            )}
          </TouchableOpacity>
          <View style={styles.headerInfo}>
            <Text style={styles.greeting}>Good Morning,</Text>
            <Text style={styles.userName}>{(user.name || user.securityName || 'SECURITY').toUpperCase()}</Text>
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

      {/* Stats Cards */}
      <View style={styles.statsContainer}>
        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#D1FAE5' }]}>
            <Ionicons name="enter-outline" size={20} color="#10B981" />
          </View>
          <Text style={styles.statValue}>{stats.active}</Text>
          <Text style={styles.statLabel}>Active</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#FEE2E2' }]}>
            <Ionicons name="exit-outline" size={20} color="#EF4444" />
          </View>
          <Text style={styles.statValue}>{stats.exited}</Text>
          <Text style={styles.statLabel}>Exited</Text>
        </View>

        <View style={styles.statCard}>
          <View style={[styles.statIcon, { backgroundColor: '#DBEAFE' }]}>
            <Ionicons name="people-outline" size={20} color="#3B82F6" />
          </View>
          <Text style={styles.statValue}>{stats.total}</Text>
          <Text style={styles.statLabel}>Total</Text>
        </View>
      </View>

      {/* Visitor Requests Section */}
      {escalatedVisitors.length > 0 && (
        <>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Visitor Requests</Text>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{escalatedVisitors.length}</Text>
            </View>
          </View>

          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.visitorRequestsContainer}
            contentContainerStyle={styles.visitorRequestsContent}
          >
            {escalatedVisitors.map((visitor) => (
              <TouchableOpacity
                key={visitor.id}
                style={styles.visitorRequestCard}
                onPress={() => {
                  setSelectedVisitor(visitor);
                  setShowVisitorModal(true);
                }}
              >
                <View style={styles.visitorCardHeader}>
                  <View style={styles.visitorAvatar}>
                    <Ionicons name="person" size={20} color="#F59E0B" />
                  </View>
                  <View style={styles.urgentBadge}>
                    <Ionicons name="time" size={12} color="#EF4444" />
                    <Text style={styles.urgentText}>URGENT</Text>
                  </View>
                </View>
                <Text style={styles.visitorName} numberOfLines={1}>{visitor.name}</Text>
                <Text style={styles.visitorMeet} numberOfLines={1}>
                  To meet: {visitor.personToMeet}
                </Text>
                <Text style={styles.visitorDept} numberOfLines={1}>
                  {visitor.department}
                </Text>
                <View style={styles.visitorActions}>
                  <TouchableOpacity
                    style={styles.approveBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleApproveVisitor(visitor);
                    }}
                  >
                    <Ionicons name="checkmark" size={16} color="#FFF" />
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.rejectBtn}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleRejectVisitor(visitor);
                    }}
                  >
                    <Ionicons name="close" size={16} color="#FFF" />
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </>
      )}

      {/* Active Persons List */}
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Active Persons</Text>
        <Text style={styles.sectionCount}>{stats.active} active</Text>
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {activePersons.filter(p => p.status === 'PENDING').length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No active persons</Text>
          </View>
        ) : (
          activePersons
            .filter(p => p.status === 'PENDING')
            .map((person, index) => (
              <TouchableOpacity
                key={`${person.id}-${index}`}
                style={styles.personCard}
                onPress={() => {
                  setSelectedPerson(person);
                  setShowDetailModal(true);
                }}
              >
                <View style={styles.personAvatar}>
                  <Text style={styles.personAvatarText}>{getInitials(person.name)}</Text>
                </View>
                <View style={styles.personInfo}>
                  <Text style={styles.personName}>{person.name}</Text>
                  <Text style={styles.personType}>{person.type}</Text>
                  <Text style={styles.personPurpose} numberOfLines={1}>
                    {person.purpose}
                  </Text>
                </View>
                <View style={styles.personRight}>
                  <View style={styles.statusBadge}>
                    <View style={styles.statusDot} />
                    <Text style={styles.statusText}>ACTIVE</Text>
                  </View>
                  <Text style={styles.personTime}>{formatTime(person.inTime)}</Text>
                  <TouchableOpacity
                    style={styles.exitButton}
                    onPress={(e) => {
                      e.stopPropagation();
                      handleManualExit(person);
                    }}
                  >
                    <Ionicons name="log-out-outline" size={16} color="#FFF" />
                    <Text style={styles.exitButtonText}>Exit</Text>
                  </TouchableOpacity>
                </View>
              </TouchableOpacity>
            ))
        )}
      </ScrollView>

      {/* Bottom Navigation */}
      <SecurityBottomNav activeTab="home" onNavigate={onNavigate} />

      {/* Person Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Person Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedPerson && (
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={styles.modalScrollContent}
                showsVerticalScrollIndicator={true}
              >
                {/* Person Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Person Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Name</Text>
                    <Text style={styles.modalValue}>{selectedPerson.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Type</Text>
                    <Text style={styles.modalValue}>{selectedPerson.type}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Purpose</Text>
                    <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                      {selectedPerson.purpose}
                    </Text>
                  </View>
                </View>

                {/* Time Info */}
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Time Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Entry Time</Text>
                    <Text style={styles.modalValue}>{formatTime(selectedPerson.inTime)}</Text>
                  </View>
                  {selectedPerson.outTime && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Exit Time</Text>
                      <Text style={styles.modalValue}>{formatTime(selectedPerson.outTime)}</Text>
                    </View>
                  )}
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View style={styles.statusBadge}>
                      <View style={styles.statusDot} />
                      <Text style={styles.statusText}>{selectedPerson.status}</Text>
                    </View>
                  </View>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Visitor Detail Modal */}
      <Modal
        visible={showVisitorModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVisitorModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Visitor Request</Text>
              <TouchableOpacity
                onPress={() => setShowVisitorModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <ScrollView 
                style={styles.modalContent}
                contentContainerStyle={styles.modalScrollContent}
              >
                <View style={styles.urgentBanner}>
                  <Ionicons name="alert-circle" size={20} color="#EF4444" />
                  <Text style={styles.urgentBannerText}>
                    Request escalated - No response from {selectedVisitor.personToMeet}
                  </Text>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Visitor Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Name</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.name}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Email</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.email}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Phone</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.phone}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>People</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.numberOfPeople}</Text>
                  </View>
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Visit Details</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Person to Meet</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.personToMeet}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Department</Text>
                    <Text style={styles.modalValue}>{selectedVisitor.department}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Purpose</Text>
                    <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                      {selectedVisitor.purpose}
                    </Text>
                  </View>
                </View>

                <View style={styles.modalActions}>
                  <TouchableOpacity
                    style={styles.modalApproveBtn}
                    onPress={() => handleApproveVisitor(selectedVisitor)}
                  >
                    <Ionicons name="checkmark-circle" size={20} color="#FFF" />
                    <Text style={styles.modalBtnText}>Approve</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.modalRejectBtn}
                    onPress={() => handleRejectVisitor(selectedVisitor)}
                  >
                    <Ionicons name="close-circle" size={20} color="#FFF" />
                    <Text style={styles.modalBtnText}>Reject</Text>
                  </TouchableOpacity>
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Rejection Reason Modal */}
      <Modal
        visible={showRejectModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowRejectModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.rejectModalContent}>
            <View style={styles.rejectModalHeader}>
              <Text style={styles.rejectModalTitle}>Reject Visitor</Text>
              <TouchableOpacity onPress={() => setShowRejectModal(false)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            {selectedVisitor && (
              <Text style={styles.rejectModalSubtitle}>
                Provide reason for rejecting {selectedVisitor.name}
              </Text>
            )}

            <TextInput
              style={styles.rejectReasonInput}
              placeholder="Enter rejection reason..."
              placeholderTextColor="#94A3B8"
              value={rejectionReason}
              onChangeText={setRejectionReason}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            <View style={styles.rejectModalButtons}>
              <TouchableOpacity
                style={styles.rejectModalCancelBtn}
                onPress={() => setShowRejectModal(false)}
              >
                <Text style={styles.rejectModalCancelText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.rejectModalConfirmBtn}
                onPress={confirmRejectVisitor}
              >
                <Ionicons name="close-circle" size={20} color="#FFF" />
                <Text style={styles.rejectModalConfirmText}>Reject</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Notification Dropdown */}
      <NotificationDropdown
        visible={showNotificationDropdown}
        onClose={() => setShowNotificationDropdown(false)}
        userId={user.securityId}
        userType="security"
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
    backgroundColor: '#00BCD4',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
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
    fontSize: 13,
    color: '#6B7280',
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1F2937',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
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
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#EF4444',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingTop: 20,
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 8,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
    minHeight: 80,
  },
  statIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6,
  },
  statValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 14,
    color: '#6B7280',
    fontWeight: '600',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 24,
    paddingBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  sectionCount: {
    fontSize: 14,
    color: '#6B7280',
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
  personCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  personAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00BCD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  personAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  personInfo: {
    flex: 1,
  },
  personName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  personType: {
    fontSize: 13,
    color: '#00BCD4',
    fontWeight: '600',
    marginBottom: 2,
  },
  personPurpose: {
    fontSize: 13,
    color: '#6B7280',
  },
  personRight: {
    alignItems: 'flex-end',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#10B981',
    marginRight: 6,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#10B981',
  },
  personTime: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 6,
  },
  exitButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#EF4444',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    gap: 4,
  },
  exitButtonText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#FFF',
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
    maxHeight: '90%',
    minHeight: '50%',
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
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    flex: 1,
    maxHeight: '100%',
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
  },
  modalSection: {
    marginBottom: 20,
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
  badge: {
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#EF4444',
  },
  visitorRequestsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  visitorRequestsContent: {
    paddingHorizontal: 20,
    gap: 12,
  },
  visitorRequestCard: {
    width: 200,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    borderWidth: 2,
    borderColor: '#FEF3C7',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  visitorCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  visitorAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FEF3C7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  urgentBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  urgentText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#EF4444',
  },
  visitorName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  visitorMeet: {
    fontSize: 13,
    color: '#6B7280',
    marginBottom: 2,
  },
  visitorDept: {
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 12,
  },
  visitorActions: {
    flexDirection: 'row',
    gap: 8,
  },
  approveBtn: {
    flex: 1,
    backgroundColor: '#10B981',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectBtn: {
    flex: 1,
    backgroundColor: '#EF4444',
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgentBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FEE2E2',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    gap: 8,
  },
  urgentBannerText: {
    flex: 1,
    fontSize: 13,
    color: '#991B1B',
    fontWeight: '600',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  modalApproveBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10B981',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalRejectBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  modalBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
  // Rejection Modal Styles
  rejectModalContent: {
    backgroundColor: '#FFF',
    borderRadius: 20,
    padding: 24,
    width: '90%',
    maxWidth: 400,
  },
  rejectModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  rejectModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1E293B',
  },
  rejectModalSubtitle: {
    fontSize: 14,
    color: '#64748B',
    marginBottom: 16,
  },
  rejectReasonInput: {
    borderWidth: 1,
    borderColor: '#E2E8F0',
    borderRadius: 12,
    padding: 12,
    fontSize: 14,
    color: '#1E293B',
    minHeight: 100,
    marginBottom: 20,
  },
  rejectModalButtons: {
    flexDirection: 'row',
    gap: 12,
  },
  rejectModalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  rejectModalCancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#64748B',
  },
  rejectModalConfirmBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EF4444',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  rejectModalConfirmText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFF',
  },
});

export default NewSecurityDashboard;
