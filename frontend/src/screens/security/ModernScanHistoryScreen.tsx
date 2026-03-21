import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  TextInput,
  StatusBar,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { SecurityPersonnel, ScreenName } from '../../types';
import { apiService } from '../../services/api';
import SecurityBottomNav from '../../components/SecurityBottomNav';

interface ModernScanHistoryScreenProps {
  security: SecurityPersonnel;
  onBack: () => void;
  onNavigate: (screen: ScreenName) => void;
}

interface ScanRecord {
  id: number;
  name: string;
  type: string;
  purpose: string;
  inTime?: string;
  outTime?: string;
  entryTime?: string;
  exitTime?: string;
  status: string;
  isBulkPass?: boolean;
  incharge?: string;
  subtype?: string;
  participantCount?: string;
  reason?: string;
  participants?: Array<{
    id: string;
    name: string;
    type: string;
    department: string;
  }>;
  regNo?: string;
  department?: string;
}

const ModernScanHistoryScreen: React.FC<ModernScanHistoryScreenProps> = ({
  security,
  onBack,
  onNavigate,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [scans, setScans] = useState<ScanRecord[]>([]);
  const [vehicles, setVehicles] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'SCANS' | 'VEHICLES'>('SCANS');
  const [activeFilter, setActiveFilter] = useState<'ALL' | 'ENTRY' | 'EXIT' | 'TODAY'>('ALL');
  const [selectedScan, setSelectedScan] = useState<ScanRecord | null>(null);
  const [selectedVehicle, setSelectedVehicle] = useState<any | null>(null);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showVehicleModal, setShowVehicleModal] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (activeTab === 'SCANS') {
      loadScanHistory();
    } else {
      loadVehicleHistory();
    }
  }, [activeTab]);

  const loadScanHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getScanHistory(security.securityId);
      if (response.success && response.data) {
        const mappedData = response.data.map((scan: any) => {
          const inTime = scan.entryTime || scan.inTime;
          const outTime = scan.exitTime || scan.outTime;
          // For exit-only records (RailwayExitLog), backend sets both entryTime and exitTime
          // to the same value with status="EXITED". Distinguish using status field.
          const isExitOnly = scan.status === 'EXITED' && inTime === outTime;
          return {
            ...scan,
            inTime: isExitOnly ? undefined : inTime,
            outTime,
          };
        });
        setScans(mappedData);
      }
    } catch (error) {
      console.error('Error loading scan history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const loadVehicleHistory = async () => {
    try {
      setLoading(true);
      const response = await apiService.getVehicles();
      if (response.success && response.data) {
        setVehicles(response.data);
      }
    } catch (error) {
      console.error('Error loading vehicle history:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    if (activeTab === 'SCANS') {
      loadScanHistory();
    } else {
      loadVehicleHistory();
    }
  };

  const filteredVehicles = vehicles.filter(vehicle => {
    const matchesSearch = searchQuery === '' ||
      vehicle.ownerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.licensePlate?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      vehicle.vehicleType?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const filteredScans = scans.filter(scan => {
    const matchesSearch = searchQuery === '' ||
      scan.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      scan.type?.toLowerCase().includes(searchQuery.toLowerCase());

    let matchesFilter = true;
    if (activeFilter === 'ENTRY') {
      // Show records that are entries (person is inside / has entered)
      matchesFilter = scan.status === 'ENTERED' || (!scan.outTime && !!scan.inTime);
    } else if (activeFilter === 'EXIT') {
      matchesFilter = scan.status === 'EXITED' || !!scan.outTime;
    } else if (activeFilter === 'TODAY') {
      const today = new Date().toDateString();
      const timeToCheck = scan.inTime || scan.outTime;
      const scanDate = timeToCheck ? new Date(timeToCheck).toDateString() : '';
      matchesFilter = today === scanDate;
    }

    return matchesSearch && matchesFilter;
  });

  const getInitials = (name: string) => {
    if (!name) return 'NA';
    return name
      .split(' ')
      .map(n => n[0])
      .join('')
      .toUpperCase()
      .substring(0, 2);
  };

  const formatTime = (timeString?: string) => {
    if (!timeString) return 'N/A';
    try {
      const date = new Date(timeString);
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return timeString;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={onBack}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>History</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Main Tab Switcher */}
      <View style={styles.mainTabContainer}>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'SCANS' && styles.mainTabActive]}
          onPress={() => {
            setActiveTab('SCANS');
            setSearchQuery('');
            setActiveFilter('ALL');
          }}
        >
          <Ionicons 
            name="qr-code" 
            size={20} 
            color={activeTab === 'SCANS' ? '#00BCD4' : '#9CA3AF'} 
          />
          <Text style={[styles.mainTabText, activeTab === 'SCANS' && styles.mainTabTextActive]}>
            Scan History
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.mainTab, activeTab === 'VEHICLES' && styles.mainTabActive]}
          onPress={() => {
            setActiveTab('VEHICLES');
            setSearchQuery('');
          }}
        >
          <Ionicons 
            name="car" 
            size={20} 
            color={activeTab === 'VEHICLES' ? '#00BCD4' : '#9CA3AF'} 
          />
          <Text style={[styles.mainTabText, activeTab === 'VEHICLES' && styles.mainTabTextActive]}>
            Vehicle History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#9CA3AF" />
        <TextInput
          style={styles.searchInput}
          placeholder={activeTab === 'SCANS' ? "Search by name or type..." : "Search by owner, plate, or type..."}
          placeholderTextColor="#9CA3AF"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
      </View>

      {/* Filter Tabs - Only for Scan History */}
      {activeTab === 'SCANS' && (
        <View style={styles.filterContainer}>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ALL' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ALL')}
          >
            <Text style={[styles.filterText, activeFilter === 'ALL' && styles.filterTextActive]}>
              All
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'ENTRY' && styles.filterTabActive]}
            onPress={() => setActiveFilter('ENTRY')}
          >
            <Text style={[styles.filterText, activeFilter === 'ENTRY' && styles.filterTextActive]}>
              Entry
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'EXIT' && styles.filterTabActive]}
            onPress={() => setActiveFilter('EXIT')}
          >
            <Text style={[styles.filterText, activeFilter === 'EXIT' && styles.filterTextActive]}>
              Exit
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.filterTab, activeFilter === 'TODAY' && styles.filterTabActive]}
            onPress={() => setActiveFilter('TODAY')}
          >
            <Text style={[styles.filterText, activeFilter === 'TODAY' && styles.filterTextActive]}>
              Today
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Content - Scan List or Vehicle List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#00BCD4" />
          <Text style={styles.loadingText}>Loading {activeTab === 'SCANS' ? 'scan' : 'vehicle'} history...</Text>
        </View>
      ) : (
        <ScrollView
          style={styles.content}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
          contentContainerStyle={styles.scrollContent}
        >
          {activeTab === 'SCANS' ? (
            // Scan History List
            filteredScans.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="time-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No scan records found</Text>
              </View>
            ) : (
              filteredScans.map((scan, index) => (
                <TouchableOpacity
                  key={`${scan.id}-${index}`}
                  style={styles.scanCard}
                  onPress={() => {
                    setSelectedScan(scan);
                    setShowDetailModal(true);
                  }}
                >
                  <View style={styles.scanAvatar}>
                    <Text style={styles.scanAvatarText}>
                      {scan.isBulkPass ? 'GP' : getInitials(scan.name)}
                    </Text>
                  </View>
                  <View style={styles.scanInfo}>
                    {scan.isBulkPass ? (
                      <>
                        <Text style={styles.scanName}>Bulk Pass - {scan.incharge}</Text>
                        <Text style={styles.scanType}>
                          {scan.subtype} • {scan.participantCount} participants
                        </Text>
                        <Text style={styles.scanPurpose} numberOfLines={1}>
                          {scan.purpose || scan.reason}
                        </Text>
                      </>
                    ) : (
                      <>
                        <Text style={styles.scanName}>{scan.name}</Text>
                        <Text style={styles.scanType}>{scan.type}</Text>
                        <Text style={styles.scanPurpose} numberOfLines={1}>
                          {scan.purpose}
                        </Text>
                      </>
                    )}
                  </View>
                  <View style={styles.scanRight}>
                    <View style={[
                      styles.scanStatusBadge,
                      scan.status === 'EXITED' || scan.outTime ? styles.scanStatusExit : styles.scanStatusEntry
                    ]}>
                      <Ionicons
                        name={scan.status === 'EXITED' || scan.outTime ? 'log-out' : 'log-in'}
                        size={12}
                        color={scan.status === 'EXITED' || scan.outTime ? '#EF4444' : '#10B981'}
                      />
                      <Text style={[
                        styles.scanStatusText,
                        scan.status === 'EXITED' || scan.outTime ? styles.scanStatusTextExit : styles.scanStatusTextEntry
                      ]}>
                        {scan.status === 'EXITED' || scan.outTime ? 'EXIT' : 'ENTRY'}
                      </Text>
                    </View>
                    <Text style={styles.scanTime}>{formatTime(scan.outTime || scan.inTime)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          ) : (
            // Vehicle History List
            filteredVehicles.length === 0 ? (
              <View style={styles.emptyState}>
                <Ionicons name="car-outline" size={64} color="#D1D5DB" />
                <Text style={styles.emptyText}>No vehicle records found</Text>
              </View>
            ) : (
              filteredVehicles.map((vehicle) => (
                <TouchableOpacity
                  key={vehicle.id}
                  style={styles.scanCard}
                  onPress={() => {
                    setSelectedVehicle(vehicle);
                    setShowVehicleModal(true);
                  }}
                >
                  <View style={[styles.scanAvatar, { backgroundColor: '#F59E0B' }]}>
                    <Ionicons name="car" size={24} color="#FFF" />
                  </View>
                  <View style={styles.scanInfo}>
                    <Text style={styles.scanName}>{vehicle.licensePlate || 'N/A'}</Text>
                    <Text style={styles.scanType}>{vehicle.vehicleType || 'Unknown Type'}</Text>
                    <Text style={styles.scanPurpose} numberOfLines={1}>
                      Owner: {vehicle.ownerName || 'N/A'}
                    </Text>
                  </View>
                  <View style={styles.scanRight}>
                    <View style={[
                      styles.scanStatusBadge,
                      vehicle.status === 'APPROVED' ? styles.scanStatusEntry : styles.scanStatusExit
                    ]}>
                      <Ionicons
                        name={vehicle.status === 'APPROVED' ? 'checkmark-circle' : 'time'}
                        size={12}
                        color={vehicle.status === 'APPROVED' ? '#10B981' : '#F59E0B'}
                      />
                      <Text style={[
                        styles.scanStatusText,
                        vehicle.status === 'APPROVED' ? styles.scanStatusTextEntry : { color: '#F59E0B' }
                      ]}>
                        {vehicle.status || 'PENDING'}
                      </Text>
                    </View>
                    <Text style={styles.scanTime}>{formatTime(vehicle.createdAt)}</Text>
                  </View>
                </TouchableOpacity>
              ))
            )
          )}
        </ScrollView>
      )}

      {/* Detail Modal */}
      <Modal
        visible={showDetailModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowDetailModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Scan Details</Text>
              <TouchableOpacity
                onPress={() => setShowDetailModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedScan && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
                {selectedScan.isBulkPass ? (
                  // Bulk Pass Details
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Bulk Pass Information</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Applied By</Text>
                        <Text style={styles.modalValue}>{selectedScan.incharge}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Type</Text>
                        <Text style={styles.modalValue}>{selectedScan.subtype}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Total Participants</Text>
                        <Text style={styles.modalValue}>{selectedScan.participantCount}</Text>
                      </View>
                      {selectedScan.purpose && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Purpose</Text>
                          <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                            {selectedScan.purpose}
                          </Text>
                        </View>
                      )}
                      {selectedScan.reason && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Reason</Text>
                          <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                            {selectedScan.reason}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Participants</Text>
                      {selectedScan.participants && selectedScan.participants.length > 0 ? (
                        selectedScan.participants.map((participant, index) => (
                          <View key={index} style={styles.participantCard}>
                            <View style={styles.participantAvatar}>
                              <Text style={styles.participantAvatarText}>
                                {getInitials(participant.name)}
                              </Text>
                            </View>
                            <View style={styles.participantInfo}>
                              <Text style={styles.participantName}>{participant.name}</Text>
                              <Text style={styles.participantDetails}>
                                {participant.id} • {participant.type}
                              </Text>
                              {participant.department && (
                                <Text style={styles.participantDept}>{participant.department}</Text>
                              )}
                            </View>
                          </View>
                        ))
                      ) : (
                        <Text style={styles.noDataText}>No participants listed</Text>
                      )}
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Time Information</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Exit Time</Text>
                        <Text style={styles.modalValue}>{formatTime(selectedScan.inTime)}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Status</Text>
                        <View style={[
                          styles.scanStatusBadge,
                          styles.scanStatusExit
                        ]}>
                          <Ionicons name="log-out" size={12} color="#EF4444" />
                          <Text style={[styles.scanStatusText, styles.scanStatusTextExit]}>
                            EXITED
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                ) : (
                  // Single Pass Details
                  <>
                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Person Information</Text>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Name</Text>
                        <Text style={styles.modalValue}>{selectedScan.name}</Text>
                      </View>
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Type</Text>
                        <Text style={styles.modalValue}>{selectedScan.type}</Text>
                      </View>
                      {selectedScan.regNo && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Roll No</Text>
                          <Text style={styles.modalValue}>{selectedScan.regNo}</Text>
                        </View>
                      )}
                      {selectedScan.department && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Department</Text>
                          <Text style={styles.modalValue}>{selectedScan.department}</Text>
                        </View>
                      )}
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Purpose</Text>
                        <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                          {selectedScan.purpose}
                        </Text>
                      </View>
                      {selectedScan.reason && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Reason</Text>
                          <Text style={[styles.modalValue, { flex: 1, textAlign: 'right' }]}>
                            {selectedScan.reason}
                          </Text>
                        </View>
                      )}
                    </View>

                    <View style={styles.modalSection}>
                      <Text style={styles.sectionTitle}>Time Information</Text>
                      {selectedScan.inTime && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Entry Time</Text>
                          <Text style={styles.modalValue}>{formatTime(selectedScan.inTime)}</Text>
                        </View>
                      )}
                      {selectedScan.outTime && (
                        <View style={styles.modalRow}>
                          <Text style={styles.modalLabel}>Exit Time</Text>
                          <Text style={styles.modalValue}>{formatTime(selectedScan.outTime)}</Text>
                        </View>
                      )}
                      <View style={styles.modalRow}>
                        <Text style={styles.modalLabel}>Status</Text>
                        <View style={[
                          styles.scanStatusBadge,
                          selectedScan.status === 'EXITED' || selectedScan.outTime ? styles.scanStatusExit : styles.scanStatusEntry
                        ]}>
                          <Ionicons
                            name={selectedScan.status === 'EXITED' || selectedScan.outTime ? 'log-out' : 'log-in'}
                            size={12}
                            color={selectedScan.status === 'EXITED' || selectedScan.outTime ? '#EF4444' : '#10B981'}
                          />
                          <Text style={[
                            styles.scanStatusText,
                            selectedScan.status === 'EXITED' || selectedScan.outTime ? styles.scanStatusTextExit : styles.scanStatusTextEntry
                          ]}>
                            {selectedScan.status === 'EXITED' || selectedScan.outTime ? 'EXITED' : 'ACTIVE'}
                          </Text>
                        </View>
                      </View>
                    </View>
                  </>
                )}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Vehicle Detail Modal */}
      <Modal
        visible={showVehicleModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowVehicleModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Vehicle Details</Text>
              <TouchableOpacity
                onPress={() => setShowVehicleModal(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={24} color="#6B7280" />
              </TouchableOpacity>
            </View>

            {selectedVehicle && (
              <ScrollView style={styles.modalContent} contentContainerStyle={styles.modalScrollContent}>
                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Vehicle Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>License Plate</Text>
                    <Text style={styles.modalValue}>{selectedVehicle.licensePlate || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Vehicle Type</Text>
                    <Text style={styles.modalValue}>{selectedVehicle.vehicleType || 'N/A'}</Text>
                  </View>
                  {(selectedVehicle.vehicleColor || selectedVehicle.color) && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Color</Text>
                      <Text style={styles.modalValue}>{selectedVehicle.vehicleColor || selectedVehicle.color || 'N/A'}</Text>
                    </View>
                  )}
                  {(selectedVehicle.vehicleModel || selectedVehicle.model) && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Model</Text>
                      <Text style={styles.modalValue}>{selectedVehicle.vehicleModel || selectedVehicle.model || 'N/A'}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Owner Information</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Owner Name</Text>
                    <Text style={styles.modalValue}>{selectedVehicle.ownerName || 'N/A'}</Text>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Owner Type</Text>
                    <Text style={styles.modalValue}>{selectedVehicle.ownerType || 'N/A'}</Text>
                  </View>
                  {(selectedVehicle.ownerPhone || selectedVehicle.contactNumber) && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Contact</Text>
                      <Text style={styles.modalValue}>{selectedVehicle.ownerPhone || selectedVehicle.contactNumber}</Text>
                    </View>
                  )}
                  {selectedVehicle.registeredBy && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Registered By</Text>
                      <Text style={styles.modalValue}>{selectedVehicle.registeredBy}</Text>
                    </View>
                  )}
                </View>

                <View style={styles.modalSection}>
                  <Text style={styles.sectionTitle}>Registration Details</Text>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Status</Text>
                    <View style={[
                      styles.scanStatusBadge,
                      selectedVehicle.status === 'APPROVED' ? styles.scanStatusEntry : styles.scanStatusExit
                    ]}>
                      <Ionicons
                        name={selectedVehicle.status === 'APPROVED' ? 'checkmark-circle' : 'time'}
                        size={12}
                        color={selectedVehicle.status === 'APPROVED' ? '#10B981' : '#F59E0B'}
                      />
                      <Text style={[
                        styles.scanStatusText,
                        selectedVehicle.status === 'APPROVED' ? styles.scanStatusTextEntry : { color: '#F59E0B' }
                      ]}>
                        {selectedVehicle.status || 'PENDING'}
                      </Text>
                    </View>
                  </View>
                  <View style={styles.modalRow}>
                    <Text style={styles.modalLabel}>Registered On</Text>
                    <Text style={styles.modalValue}>{formatTime(selectedVehicle.createdAt || selectedVehicle.registeredAt)}</Text>
                  </View>
                  {selectedVehicle.updatedAt && selectedVehicle.updatedAt !== selectedVehicle.createdAt && (
                    <View style={styles.modalRow}>
                      <Text style={styles.modalLabel}>Last Updated</Text>
                      <Text style={styles.modalValue}>{formatTime(selectedVehicle.updatedAt)}</Text>
                    </View>
                  )}
                </View>
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Bottom Navigation */}
      <SecurityBottomNav activeTab="history" onNavigate={onNavigate} />
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
  mainTabContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    gap: 12,
  },
  mainTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#E5E7EB',
    gap: 8,
  },
  mainTabActive: {
    backgroundColor: '#E0F7FA',
    borderColor: '#00BCD4',
  },
  mainTabText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B7280',
  },
  mainTabTextActive: {
    color: '#00BCD4',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    marginHorizontal: 20,
    marginTop: 16,
    marginBottom: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: '#1F2937',
  },
  filterContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 16,
    gap: 8,
  },
  filterTab: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  filterTabActive: {
    backgroundColor: '#00BCD4',
    borderColor: '#00BCD4',
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  content: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingBottom: 100,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: '#6B7280',
    marginTop: 16,
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
  scanCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  scanAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#00BCD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  scanAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  scanInfo: {
    flex: 1,
  },
  scanName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  scanType: {
    fontSize: 13,
    color: '#00BCD4',
    fontWeight: '600',
    marginBottom: 2,
  },
  scanPurpose: {
    fontSize: 13,
    color: '#6B7280',
  },
  scanRight: {
    alignItems: 'flex-end',
  },
  scanStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 6,
    gap: 4,
  },
  scanStatusEntry: {
    backgroundColor: '#D1FAE5',
  },
  scanStatusExit: {
    backgroundColor: '#FEE2E2',
  },
  scanStatusText: {
    fontSize: 11,
    fontWeight: '700',
  },
  scanStatusTextEntry: {
    color: '#10B981',
  },
  scanStatusTextExit: {
    color: '#EF4444',
  },
  scanTime: {
    fontSize: 12,
    color: '#9CA3AF',
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
    height: '80%',
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
  },
  modalScrollContent: {
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 40,
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
  participantCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  participantAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#00BCD4',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  participantAvatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  participantInfo: {
    flex: 1,
  },
  participantName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 2,
  },
  participantDetails: {
    fontSize: 12,
    color: '#6B7280',
    marginBottom: 2,
  },
  participantDept: {
    fontSize: 12,
    color: '#00BCD4',
    fontWeight: '500',
  },
  noDataText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
    textAlign: 'center',
    paddingVertical: 12,
  },
});

export default ModernScanHistoryScreen;
