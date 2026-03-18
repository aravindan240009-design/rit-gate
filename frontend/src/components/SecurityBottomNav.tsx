import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { ScreenName } from '../types';

interface SecurityBottomNavProps {
  activeTab: 'home' | 'scanner' | 'history' | 'vehicle' | 'visitor' | 'contacts';
  onNavigate: (screen: ScreenName) => void;
}

const SecurityBottomNav: React.FC<SecurityBottomNavProps> = ({ activeTab, onNavigate }) => {
  const handleNavigate = (tab: string) => {
    const screenMap: { [key: string]: ScreenName } = {
      'home': 'SECURITY_DASHBOARD',
      'scanner': 'QR_SCANNER',
      'history': 'SCAN_HISTORY',
      'vehicle': 'VEHICLE_REGISTRATION',
      'visitor': 'VISITOR_REGISTRATION',
      'hods': 'HOD_CONTACTS',
    };
    onNavigate(screenMap[tab] || 'SECURITY_DASHBOARD');
  };

  return (
    <View style={styles.bottomTabBar}>
      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('home')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'home' ? 'home' : 'home-outline'} 
          size={24} 
          color={activeTab === 'home' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'home' && styles.activeBottomTabLabel]}>
          Home
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('scanner')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'scanner' ? 'qr-code' : 'qr-code-outline'} 
          size={24} 
          color={activeTab === 'scanner' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'scanner' && styles.activeBottomTabLabel]}>
          Scanner
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('history')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'history' ? 'time' : 'time-outline'} 
          size={24} 
          color={activeTab === 'history' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'history' && styles.activeBottomTabLabel]}>
          History
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('vehicle')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'vehicle' ? 'car' : 'car-outline'} 
          size={24} 
          color={activeTab === 'vehicle' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'vehicle' && styles.activeBottomTabLabel]}>
          Vehicle
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('visitor')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'visitor' ? 'people' : 'people-outline'} 
          size={24} 
          color={activeTab === 'visitor' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'visitor' && styles.activeBottomTabLabel]}>
          Visitor
        </Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.bottomTab}
        onPress={() => handleNavigate('hods')}
        activeOpacity={0.7}
      >
        <Ionicons 
          name={activeTab === 'contacts' ? 'call' : 'call-outline'} 
          size={24} 
          color={activeTab === 'contacts' ? '#00BCD4' : '#9CA3AF'} 
        />
        <Text style={[styles.bottomTabLabel, activeTab === 'contacts' && styles.activeBottomTabLabel]}>
          Contacts
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  bottomTabBar: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 4,
    paddingBottom: Platform.OS === 'ios' ? 24 : 8,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomTab: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  bottomTabLabel: {
    fontSize: 11,
    color: '#9CA3AF',
    fontWeight: '600',
    marginTop: 4,
    textAlign: 'center',
  },
  activeBottomTabLabel: {
    color: '#00BCD4',
  },
});

export default SecurityBottomNav;
