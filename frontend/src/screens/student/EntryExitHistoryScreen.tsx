import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Student } from '../../types';
import { THEME } from '../../config/api.config';

interface EntryExitHistoryScreenProps {
  user: Student;
  navigation?: any;
  onBack?: () => void;
}

interface HistoryEntry {
  id: number;
  type: 'ENTRY' | 'EXIT';
  timestamp: string;
  gate: string;
  purpose?: string;
}

const EntryExitHistoryScreen: React.FC<EntryExitHistoryScreenProps> = ({ user, navigation, onBack }) => {
  const [refreshing, setRefreshing] = useState(false);
  const [history, setHistory] = useState<HistoryEntry[]>([]);

  const handleGoBack = () => {
    if (navigation?.goBack) {
      navigation.goBack();
    } else if (onBack) {
      onBack();
    }
  };
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    setIsLoading(true);
    try {
      console.log('📋 Loading entry/exit history for user:', user.regNo);
      
      // Import apiService
      const { apiService } = await import('../../services/api');
      
      // Fetch history from API
      const response = await apiService.getUserEntryHistory(user.regNo);
      console.log('📥 Received history response:', response);
      
      // Extract history array from response
      const historyData = (response as any).history || response || [];
      console.log('📥 History data:', historyData);
      
      // Transform the data to match our interface
      const transformedHistory: HistoryEntry[] = historyData.map((item: any, index: number) => {
        // The backend now returns unified format with type field
        const type = item.type || 'ENTRY';
        const timestamp = item.timestamp || item.exitTime || item.entryTime || new Date().toISOString();
        const gate = item.gate || item.scanLocation || item.location || 'Main Gate';
        const purpose = item.purpose || (type === 'ENTRY' ? 'Campus Entry' : 'Campus Exit');
        
        return {
          id: item.id || index,
          type: type as 'ENTRY' | 'EXIT',
          timestamp: timestamp,
          gate: gate,
          purpose: purpose,
        };
      });
      
      console.log('✅ Transformed history:', transformedHistory.length, 'records');
      setHistory(transformedHistory);
    } catch (error) {
      console.error('❌ Error loading history:', error);
      setHistory([]);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
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
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={THEME.colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Entry/Exit History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
      >
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={THEME.colors.primary} />
            <Text style={styles.loadingText}>Loading history...</Text>
          </View>
        ) : history.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="time-outline" size={64} color={THEME.colors.textSecondary} />
            <Text style={styles.emptyStateText}>No entry/exit history</Text>
            <Text style={styles.emptyStateSubtext}>
              Your campus entry and exit records will appear here
            </Text>
          </View>
        ) : (
          history.map((entry) => (
            <View key={entry.id} style={styles.historyCard}>
              <View style={styles.historyHeader}>
                <View style={[
                  styles.typeIcon,
                  { backgroundColor: entry.type === 'ENTRY' ? THEME.colors.success + '20' : THEME.colors.warning + '20' }
                ]}>
                  <Ionicons
                    name={entry.type === 'ENTRY' ? 'enter-outline' : 'exit-outline'}
                    size={24}
                    color={entry.type === 'ENTRY' ? THEME.colors.success : THEME.colors.warning}
                  />
                </View>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyType}>
                    {entry.type === 'ENTRY' ? 'Campus Entry' : 'Campus Exit'}
                  </Text>
                  <Text style={styles.historyTime}>{formatTime(entry.timestamp)}</Text>
                </View>
              </View>
              <View style={styles.historyDetails}>
                <View style={styles.detailRow}>
                  <Ionicons name="location-outline" size={16} color={THEME.colors.textSecondary} />
                  <Text style={styles.detailText}>{entry.gate}</Text>
                </View>
                {entry.purpose && (
                  <View style={styles.detailRow}>
                    <Ionicons name="document-text-outline" size={16} color={THEME.colors.textSecondary} />
                    <Text style={styles.detailText}>{entry.purpose}</Text>
                  </View>
                )}
                {entry.type === 'ENTRY' && entry.purpose?.includes('Late') && (
                  <View style={[styles.badge, { backgroundColor: THEME.colors.error + '20' }]}>
                    <Ionicons name="time-outline" size={14} color={THEME.colors.error} />
                    <Text style={[styles.badgeText, { color: THEME.colors.error }]}>Late Arrival</Text>
                  </View>
                )}
                {entry.type === 'EXIT' && (
                  <View style={[styles.badge, { backgroundColor: THEME.colors.primary + '20' }]}>
                    <Ionicons name="checkmark-circle-outline" size={14} color={THEME.colors.primary} />
                    <Text style={[styles.badgeText, { color: THEME.colors.primary }]}>Gate Pass Used</Text>
                  </View>
                )}
              </View>
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: THEME.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: THEME.colors.card,
    borderBottomWidth: 1,
    borderBottomColor: THEME.colors.border,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: THEME.colors.background,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: THEME.colors.text,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 40,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: THEME.colors.textSecondary,
  },
  emptyState: {
    alignItems: 'center',
    padding: 40,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: THEME.colors.text,
    marginTop: 16,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 8,
    textAlign: 'center',
  },
  historyCard: {
    backgroundColor: THEME.colors.card,
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  historyHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  typeIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  historyInfo: {
    flex: 1,
  },
  historyType: {
    fontSize: 16,
    fontWeight: '600',
    color: THEME.colors.text,
  },
  historyTime: {
    fontSize: 14,
    color: THEME.colors.textSecondary,
    marginTop: 2,
  },
  historyDetails: {
    borderTopWidth: 1,
    borderTopColor: THEME.colors.border,
    paddingTop: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 8,
  },
  detailText: {
    fontSize: 14,
    color: THEME.colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
    gap: 6,
    alignSelf: 'flex-start',
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

export default EntryExitHistoryScreen;
