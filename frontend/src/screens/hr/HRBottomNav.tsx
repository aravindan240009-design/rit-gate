import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../../context/ThemeContext';
import ThemedText from '../../components/ThemedText';

type HRTab = 'HOME' | 'GUEST' | 'EXITS' | 'PROFILE';

interface HRBottomNavProps {
  activeTab: HRTab;
  onTabChange: (tab: HRTab) => void;
}

const TABS: { key: HRTab; icon: string; iconActive: string; label: string }[] = [
  { key: 'HOME',    icon: 'home-outline',       iconActive: 'home',        label: 'Home' },
  { key: 'GUEST',   icon: 'person-add-outline',  iconActive: 'person-add',  label: 'Guest' },
  { key: 'EXITS',   icon: 'log-out-outline',     iconActive: 'log-out',     label: 'Exits' },
  { key: 'PROFILE', icon: 'person-outline',      iconActive: 'person',      label: 'Profile' },
];

const HRBottomNav: React.FC<HRBottomNavProps> = ({ activeTab, onTabChange }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.nav, { backgroundColor: theme.surface, borderTopColor: theme.border }]}>
      {TABS.map(tab => {
        const active = activeTab === tab.key;
        return (
          <TouchableOpacity key={tab.key} style={styles.item} onPress={() => onTabChange(tab.key)}>
            <Ionicons name={active ? tab.iconActive : tab.icon} size={22} color={active ? theme.primary : theme.textTertiary} />
            <ThemedText style={[styles.label, { color: active ? theme.primary : theme.textTertiary, fontWeight: active ? '700' : '500' }]}>
              {tab.label}
            </ThemedText>
            {active && <View style={[styles.indicator, { backgroundColor: theme.primary }]} />}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  nav: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 8, borderTopWidth: 1, elevation: 8 },
  item: { flex: 1, alignItems: 'center', paddingVertical: 6, position: 'relative' },
  label: { fontSize: 12, marginTop: 3 },
  indicator: { position: 'absolute', bottom: 0, width: 28, height: 3, borderRadius: 2 },
});

export default HRBottomNav;
