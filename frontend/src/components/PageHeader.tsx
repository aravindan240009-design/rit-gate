/**
 * PageHeader — single source of truth for simple page headers (My Requests, Gate Logs, etc.)
 *
 * Canonical spec:
 *   paddingHorizontal: 20, paddingVertical: 16, borderBottomWidth: 1
 *   title: fontSize 18, fontWeight '700'
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ThemedText from './ThemedText';

interface PageHeaderProps {
  title: string;
}

const PageHeader: React.FC<PageHeaderProps> = ({ title }) => {
  const { theme } = useTheme();
  return (
    <View style={[styles.header, { backgroundColor: theme.surface, borderBottomColor: theme.border }]}>
      <ThemedText style={[styles.title, { color: theme.text }]}>{title}</ThemedText>
    </View>
  );
};

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
});

export default PageHeader;
