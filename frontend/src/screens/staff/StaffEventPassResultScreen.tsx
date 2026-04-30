import React from 'react';
import { View, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { RITGateEvent } from '../../types';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';

interface Props {
  event: RITGateEvent;
  result: { total: number; issued: number; failed: number; errors?: any[] };
  onDone: () => void;
}

const StaffEventPassResultScreen: React.FC<Props> = ({ event, result, onDone }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();
  const allSuccess = result.failed === 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]} edges={['top']}>
      <View style={[styles.header, { borderBottomColor: theme.border, paddingTop: insets.top > 0 ? 0 : 12 }]}>
        <ThemedText style={styles.headerTitle}>Upload Complete</ThemedText>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.iconWrap}>
          <View style={[styles.iconCircle, { backgroundColor: allSuccess ? '#dcfce7' : '#fef3c7' }]}>
            <Ionicons
              name={allSuccess ? 'checkmark-circle' : 'alert-circle'}
              size={64}
              color={allSuccess ? '#16a34a' : '#f59e0b'}
            />
          </View>
          <ThemedText style={styles.resultTitle}>
            {allSuccess ? 'All Passes Issued!' : 'Partially Complete'}
          </ThemedText>
          <ThemedText style={[styles.resultSub, { color: theme.textSecondary }]}>
            {event.eventName}
          </ThemedText>
        </View>

        <View style={[styles.statsCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <View style={styles.statRow}>
            <View style={styles.statItem}>
              <ThemedText style={styles.statCount}>{result.total}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Total</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statCount, { color: '#16a34a' }]}>{result.issued}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Emails Sent</ThemedText>
            </View>
            <View style={[styles.statDivider, { backgroundColor: theme.border }]} />
            <View style={styles.statItem}>
              <ThemedText style={[styles.statCount, { color: result.failed > 0 ? '#dc2626' : theme.textSecondary }]}>{result.failed}</ThemedText>
              <ThemedText style={[styles.statLabel, { color: theme.textSecondary }]}>Failed</ThemedText>
            </View>
          </View>
        </View>

        {result.failed > 0 && (
          <View style={[styles.failCard, { backgroundColor: '#fef2f2', borderColor: '#fca5a5' }]}>
            <ThemedText style={styles.failTitle}>Failed Emails</ThemedText>
            {(result.errors || []).map((err: any, i: number) => (
              <View key={i} style={styles.failRow}>
                <Ionicons name="alert-circle-outline" size={14} color="#dc2626" />
                <ThemedText style={styles.failText}>{err.name || err.email} — {err.reason}</ThemedText>
              </View>
            ))}
            <ThemedText style={[styles.failNote, { color: '#dc2626' }]}>
              These passes were still created. QR codes can be resent from the event passes list.
            </ThemedText>
          </View>
        )}

        <View style={[styles.infoCard, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}>
          <Ionicons name="information-circle-outline" size={20} color={theme.primary} />
          <ThemedText style={[styles.infoText, { color: theme.textSecondary }]}>
            Each participant has received an email with their unique QR code. Passes are valid until midnight on {event.eventDate}.
          </ThemedText>
        </View>
      </ScrollView>

      <View style={[styles.footer, { borderTopColor: theme.border, backgroundColor: theme.background }]}>
        <TouchableOpacity style={[styles.doneBtn, { backgroundColor: theme.primary }]} onPress={onDone}>
          <ThemedText style={styles.doneBtnText}>Done</ThemedText>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingHorizontal: 16, paddingVertical: 14, borderBottomWidth: 1, alignItems: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700' },
  content: { padding: 20, gap: 20, alignItems: 'center' },
  iconWrap: { alignItems: 'center', gap: 8, paddingTop: 16 },
  iconCircle: { width: 100, height: 100, borderRadius: 50, alignItems: 'center', justifyContent: 'center' },
  resultTitle: { fontSize: 22, fontWeight: '800', marginTop: 4 },
  resultSub: { fontSize: 14 },
  statsCard: { width: '100%', borderRadius: 16, padding: 20, borderWidth: 1 },
  statRow: { flexDirection: 'row', alignItems: 'center' },
  statItem: { flex: 1, alignItems: 'center' },
  statCount: { fontSize: 28, fontWeight: '800' },
  statLabel: { fontSize: 12, marginTop: 4 },
  statDivider: { width: 1, height: 44 },
  failCard: { width: '100%', borderRadius: 12, padding: 16, borderWidth: 1, gap: 8 },
  failTitle: { fontSize: 14, fontWeight: '700', color: '#dc2626', marginBottom: 4 },
  failRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 6 },
  failText: { fontSize: 12, color: '#dc2626', flex: 1 },
  failNote: { fontSize: 12, marginTop: 8, fontStyle: 'italic' },
  infoCard: { width: '100%', borderRadius: 12, padding: 16, borderWidth: 1, flexDirection: 'row', gap: 10 },
  infoText: { flex: 1, fontSize: 13, lineHeight: 20 },
  footer: { padding: 16, borderTopWidth: 1 },
  doneBtn: { borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  doneBtnText: { color: '#fff', fontWeight: '700', fontSize: 16 },
});

export default StaffEventPassResultScreen;
