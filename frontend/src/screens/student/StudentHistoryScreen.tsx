import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '../../types';
import { apiService } from '../../services/api';

interface StudentHistoryScreenProps {
  student: Student;
  onTabChange: (tab: 'HOME' | 'REQUESTS' | 'HISTORY' | 'PROFILE') => void;
}

interface HistoryItem {
  id: string;
  type: 'ENTRY' | 'EXIT' | 'LATE_ENTRY' | 'GATE_PASS';
  timestamp: string;
  reason?: string;
  passId?: string;
  location?: string;
}

const StudentHistoryScreen: React.FC<StudentHistoryScreenProps> = ({
  student,
  onTabChange,
}) => {
  const [refreshing, setRefreshing] = useState(false);
  const [historyData, setHistoryData] = useState<HistoryItem[]>([]);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      // Load entry/exit history
      const entryHistory = await apiService.getUserEntryHistory(student.regNo);
      
      // Load gate pass requests
      const gatePassResponse = await apiService.getStudentGatePassRequests(student.regNo);
      const gatePasses = gatePassResponse.success ? gatePassResponse.requests : [];

      // Combine and format data
      const combinedHistory: HistoryItem[] = [];

      // Add entry/exit records
      entryHistory.forEach((item: any) => {
        if (item.entryTime) {
          combinedHistory.push({
            id: `entry-${item.id || Date.now()}`,
            type: item.lateEntry ? 'LATE_ENTRY' : 'ENTRY',
            timestamp: item.entryTime,
            reason: item.lateReason || undefined,
            location: 'Main Gate',
          });
        }
        if (item.exitTime) {
          combinedHistory.push({
            id: `exit-${item.id || Date.now()}`,
            type: 'EXIT',
            timestamp: item.exitTime,
            location: 'Main Gate',
          });
        }
      });

      // Add gate pass usage logs (approved passes that were used)
      if (gatePasses && Array.isArray(gatePasses)) {
        gatePasses
          .filter((pass: any) => pass.status === 'APPROVED' && pass.usedAt)
          .forEach((pass: any) => {
            combinedHistory.push({
              id: `gatepass-${pass.id}`,
              type: 'GATE_PASS',
              timestamp: pass.usedAt,
              passId: `GP-${pass.id}`,
              reason: pass.purpose || pass.reason,
              location: 'Main Gate',
            });
          });
      }

      // Sort by timestamp descending
      combinedHistory.sort((a, b) => 
        new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
      );

      setHistoryData(combinedHistory);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const onRefresh = () => {
    setRefreshing(true);
    loadHistory();
  };

  const filteredHistory = historyData;

  const getIconName = (type: string) => {
    switch (type) {
      case 'ENTRY':
        return 'log-in';
      case 'EXIT':
        return 'log-out';
      case 'LATE_ENTRY':
        return 'warning';
      case 'GATE_PASS':
        return 'qr-code';
      default:
        return 'time';
    }
  };

  const getIconColor = (type: string) => {
    switch (type) {
      case 'ENTRY':
        return '#10B981';
      case 'EXIT':
        return '#EF4444';
      case 'LATE_ENTRY':
        return '#F59E0B';
      case 'GATE_PASS':
        return '#06B6D4';
      default:
        return '#6B7280';
    }
  };

  const getTypeLabel = (type: string) => {
    switch (type) {
      case 'ENTRY':
        return 'Entry';
      case 'EXIT':
        return 'Exit';
      case 'LATE_ENTRY':
        return 'Late Entry';
      case 'GATE_PASS':
        return 'Gate Pass Used';
      default:
        return type;
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
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
        <Text style={styles.headerTitle}>History</Text>
      </View>



      {/* History List */}
      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={styles.scrollContent}
      >
        {filteredHistory.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color="#D1D5DB" />
            <Text style={styles.emptyText}>No history records</Text>
          </View>
        ) : (
          filteredHistory.map((item) => (
            <View key={item.id} style={styles.historyCard}>
              <View
                style={[
                  styles.iconContainer,
                  { backgroundColor: getIconColor(item.type) + '20' },
                ]}
              >
                <Ionicons
                  name={getIconName(item.type)}
                  size={24}
                  color={getIconColor(item.type)}
                />
              </View>
              <View style={styles.historyContent}>
                <Text style={styles.historyType}>{getTypeLabel(item.type)}</Text>
                {item.passId && (
                  <Text style={styles.historyPassId}>{item.passId}</Text>
                )}
                {item.reason && (
                  <Text style={styles.historyReason} numberOfLines={2}>
                    {item.reason}
                  </Text>
                )}
                <View style={styles.historyMeta}>
                  <Ionicons name="time-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.historyTimestamp}>
                    {formatTimestamp(item.timestamp)}
                  </Text>
                </View>
                {item.location && (
                  <View style={styles.historyMeta}>
                    <Ionicons name="location-outline" size={14} color="#9CA3AF" />
                    <Text style={styles.historyLocation}>{item.location}</Text>
                  </View>
                )}
              </View>
            </View>
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
          <Ionicons name="document-text-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Requests</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('HISTORY')}
        >
          <Ionicons name="time" size={24} color="#1F2937" />
          <Text style={styles.navLabelActive}>History</Text>
          <View style={styles.activeIndicator} />
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.navItem}
          onPress={() => onTabChange('PROFILE')}
        >
          <Ionicons name="person-outline" size={24} color="#9CA3AF" />
          <Text style={styles.navLabel}>Profile</Text>
        </TouchableOpacity>
      </View>
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
  historyCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    gap: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  historyContent: {
    flex: 1,
    gap: 4,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
  },
  historyPassId: {
    fontSize: 13,
    fontWeight: '600',
    color: '#06B6D4',
  },
  historyReason: {
    fontSize: 14,
    color: '#6B7280',
    lineHeight: 20,
  },
  historyMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  historyTimestamp: {
    fontSize: 13,
    color: '#9CA3AF',
  },
  historyLocation: {
    fontSize: 13,
    color: '#9CA3AF',
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
});

export default StudentHistoryScreen;
