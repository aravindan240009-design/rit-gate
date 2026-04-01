import React, { useState } from 'react';
import {
  View, TouchableOpacity, FlatList, StyleSheet, Modal,
} from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { useTheme } from '../context/ThemeContext';
import ThemedText from './ThemedText';

export interface DropdownItem {
  label: string;
  value: string;
}

interface SearchableDropdownProps {
  items: DropdownItem[];
  selectedValue: string;
  onSelect: (value: string, label: string) => void;
  placeholder?: string;
  disabled?: boolean;
}

const SearchableDropdown: React.FC<SearchableDropdownProps> = ({
  items,
  selectedValue,
  onSelect,
  placeholder = 'Select...',
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [open, setOpen] = useState(false);

  const selectedLabel = items.find(i => i.value === selectedValue)?.label || '';

  const handleOpen = () => {
    if (disabled) return;
    setOpen(true);
  };

  const handleSelect = (item: DropdownItem) => {
    onSelect(item.value, item.label);
    setOpen(false);
  };

  return (
    <>
      {/* Trigger — tappable field */}
      <TouchableOpacity
        style={[
          styles.trigger,
          { backgroundColor: theme.surface, borderColor: disabled ? theme.border : theme.primary },
          disabled && { opacity: 0.5 },
        ]}
        onPress={handleOpen}
        activeOpacity={0.8}
        disabled={disabled}
      >
        <ThemedText
          ignoreGradient
          style={[styles.triggerText, { color: selectedValue ? theme.text : theme.textTertiary }]}
          numberOfLines={1}
        >
          {selectedLabel || placeholder}
        </ThemedText>
        <Ionicons name="chevron-down" size={18} color={theme.primary} />
      </TouchableOpacity>

      {/* Dropdown Modal */}
      <Modal
        visible={open}
        transparent
        animationType="fade"
        onRequestClose={() => setOpen(false)}
      >
        <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={() => setOpen(false)} />
        <View style={[styles.dropdownCard, { backgroundColor: theme.surface, borderColor: theme.primary }]}>
          <FlatList
            data={items}
            keyExtractor={item => item.value}
            style={styles.list}
            keyboardShouldPersistTaps="handled"
            renderItem={({ item }) => (
              <TouchableOpacity
                style={[
                  styles.listItem,
                  { borderBottomColor: theme.border },
                  item.value === selectedValue && { backgroundColor: theme.primary + '12' },
                ]}
                onPress={() => handleSelect(item)}
                activeOpacity={0.7}
              >
                <ThemedText
                  ignoreGradient
                  style={[
                    styles.listItemText,
                    { color: theme.text },
                    item.value === selectedValue && { color: theme.primary, fontWeight: '700' },
                  ]}
                >
                  {item.label}
                </ThemedText>
                {item.value === selectedValue && (
                  <Ionicons name="checkmark" size={16} color={theme.primary} />
                )}
              </TouchableOpacity>
            )}
            ListEmptyComponent={
              <View style={styles.empty}>
                <ThemedText ignoreGradient style={[styles.emptyText, { color: theme.textTertiary }]}>No options</ThemedText>
              </View>
            }
          />
        </View>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1.5,
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 50,
  },
  triggerText: { flex: 1, fontSize: 15, marginRight: 8 },
  backdrop: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.3)' },
  dropdownCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    top: '25%',
    borderRadius: 16,
    borderWidth: 1.5,
    maxHeight: 360,
    overflow: 'hidden',
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
  },
  list: { maxHeight: 360 },
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  listItemText: { fontSize: 15, flex: 1 },
  empty: { padding: 20, alignItems: 'center' },
  emptyText: { fontSize: 14 },
});

export default SearchableDropdown;
