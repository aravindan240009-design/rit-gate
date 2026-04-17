/**
 * BottomNavBar — single source of truth for the bottom navigation bar.
 * All screens must use this component so the bar is pixel-identical everywhere.
 *
 * Canonical spec:
 *   container  : paddingVertical 10, paddingHorizontal 8, borderTopWidth 1, elevation 8
 *   navItem    : flex 1, alignItems center, paddingVertical 8
 *   icon size  : 22 (regular), 28 (add-circle centre button)
 *   label      : fontSize 11, fontWeight '600', marginTop 4
 *   activeIndicator: width 28, height 3, borderRadius 2, absolute bottom 0
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ThemedText from './ThemedText';

export interface NavTab {
  key: string;
  label: string;
  /** Ionicons name when inactive */
  icon: string;
  /** Ionicons name when active — defaults to icon */
  iconActive?: string;
  /** Use the large add-circle style (centre button) */
  isAdd?: boolean;
}

interface BottomNavBarProps {
  tabs: NavTab[];
  activeKey: string;
  onPress: (key: string) => void;
}

const BottomNavBar: React.FC<BottomNavBarProps> = ({ tabs, activeKey, onPress }) => {
  const { theme } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        {
          backgroundColor: theme.surface,
          borderTopColor: theme.border,
          paddingBottom: insets.bottom,
        },
      ]}
    >
      {tabs.map((tab) => {
        const active = tab.key === activeKey;
        const iconName = active ? (tab.iconActive ?? tab.icon) : tab.icon;
        const color = active ? theme.primary : theme.textTertiary;

        return (
          <TouchableOpacity
            key={tab.key}
            style={styles.navItem}
            onPress={() => onPress(tab.key)}
            activeOpacity={0.7}
          >
            <Ionicons
              name={iconName as any}
              size={tab.isAdd ? 28 : 22}
              color={color}
            />
            <ThemedText
              style={[
                styles.navLabel,
                { color },
                active && styles.navLabelActive,
              ]}
            >
              {tab.label}
            </ThemedText>
            {active && !tab.isAdd && (
              <View style={[styles.activeIndicator, { backgroundColor: theme.primary }]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
  },
  navItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    position: 'relative',
  },
  navLabel: {
    fontSize: 11,
    fontWeight: '600',
    marginTop: 4,
  },
  navLabelActive: {
    fontWeight: '700',
  },
  activeIndicator: {
    position: 'absolute',
    bottom: 0,
    width: 28,
    height: 3,
    borderRadius: 2,
  },
});

export default BottomNavBar;
