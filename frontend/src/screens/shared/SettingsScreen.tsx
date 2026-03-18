import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Alert,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { apiService } from '../../services/api';
import AsyncStorage from '@react-native-async-storage/async-storage';

export const SettingsScreen: React.FC = () => {
  const [currentURL, setCurrentURL] = useState<string>('');
  const [manualIP, setManualIP] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  useEffect(() => {
    loadCurrentSettings();
  }, []);

  const loadCurrentSettings = async () => {
    try {
      const url = apiService.getCurrentBackendUrl();
      setCurrentURL(url);
      
      // Extract IP from URL
      const match = url.match(/http:\/\/([^:]+):/);
      if (match) {
        setManualIP(match[1]);
      }
    } catch (error) {
      console.error('Error loading settings:', error);
    }
  };

  const handleTestConnection = async () => {
    setIsTesting(true);
    try {
      const isAvailable = await apiService.checkBackendStatus();
      if (isAvailable) {
        Alert.alert('Success', 'Backend is reachable!');
      } else {
        Alert.alert('Error', 'Cannot reach backend at current URL');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to test connection');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSetManualIP = async () => {
    if (!manualIP.trim()) {
      Alert.alert('Error', 'Please enter an IP address');
      return;
    }

    // Validate IP format
    const ipRegex = /^(\d{1,3}\.){3}\d{1,3}$/;
    if (!ipRegex.test(manualIP.trim())) {
      Alert.alert('Error', 'Invalid IP address format. Example: 192.168.1.100');
      return;
    }

    setIsLoading(true);
    try {
      const success = await apiService.setManualIP(manualIP.trim());
      if (success) {
        Alert.alert('Success', `Backend URL set to http://${manualIP.trim()}:8080/api`);
        await loadCurrentSettings();
      } else {
        Alert.alert(
          'Error',
          'Cannot reach backend at this IP address. Please check:\n\n' +
          '1. Backend is running\n' +
          '2. Both devices on same WiFi\n' +
          '3. Firewall is disabled\n' +
          '4. IP address is correct'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to set manual IP');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAutoDiscover = async () => {
    setIsLoading(true);
    try {
      const success = await apiService.rediscoverBackend();
      if (success) {
        Alert.alert('Success', 'Backend URL auto-discovered!');
        await loadCurrentSettings();
      } else {
        Alert.alert(
          'Error',
          'Could not auto-discover backend. Please set IP manually.'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to auto-discover backend');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearManualIP = async () => {
    Alert.alert(
      'Clear Manual IP',
      'This will clear the manual IP and try to auto-discover the backend. Continue?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Clear',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await apiService.clearManualIP();
              Alert.alert('Success', 'Manual IP cleared. Auto-discovery enabled.');
              await loadCurrentSettings();
            } catch (error) {
              Alert.alert('Error', 'Failed to clear manual IP');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleGetCurrentIP = async () => {
    try {
      // Get laptop IP from Expo Constants
      const Constants = require('expo-constants').default;
      if (Constants.expoConfig?.hostUri) {
        const ip = Constants.expoConfig.hostUri.split(':')[0];
        setManualIP(ip);
        Alert.alert(
          'Auto-detected IP',
          `Found IP from Expo: ${ip}\n\nTap "Set Manual IP" to use this.`
        );
      } else {
        Alert.alert(
          'Info',
          'Could not auto-detect IP. Please enter manually.\n\n' +
          'To find your laptop IP:\n' +
          '• Mac/Linux: ifconfig | grep "inet "\n' +
          '• Windows: ipconfig'
        );
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to get current IP');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.content}>
        <Text style={styles.title}>Backend Settings</Text>
        
        {/* Current URL */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Current Backend URL</Text>
          <View style={styles.urlBox}>
            <Text style={styles.urlText}>{currentURL}</Text>
          </View>
          
          <TouchableOpacity
            style={[styles.button, styles.testButton]}
            onPress={handleTestConnection}
            disabled={isTesting}
          >
            {isTesting ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Test Connection</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Manual IP Input */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Set Manual IP Address</Text>
          <Text style={styles.helpText}>
            Enter your laptop's WiFi IP address (e.g., 192.168.1.100)
          </Text>
          
          <View style={styles.inputRow}>
            <TextInput
              style={styles.input}
              value={manualIP}
              onChangeText={setManualIP}
              placeholder="192.168.1.100"
              keyboardType="numeric"
              autoCapitalize="none"
              autoCorrect={false}
            />
            <TouchableOpacity
              style={styles.detectButton}
              onPress={handleGetCurrentIP}
            >
              <Text style={styles.detectButtonText}>Auto-detect</Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[styles.button, styles.primaryButton]}
            onPress={handleSetManualIP}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.buttonText}>Set Manual IP</Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Auto-discover */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Auto-Discovery</Text>
          <Text style={styles.helpText}>
            Automatically find the backend by testing common URLs
          </Text>
          
          <TouchableOpacity
            style={[styles.button, styles.secondaryButton]}
            onPress={handleAutoDiscover}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#06B6D4" />
            ) : (
              <Text style={[styles.buttonText, styles.secondaryButtonText]}>
                Auto-Discover Backend
              </Text>
            )}
          </TouchableOpacity>
        </View>

        {/* Clear Manual IP */}
        <View style={styles.section}>
          <TouchableOpacity
            style={[styles.button, styles.dangerButton]}
            onPress={handleClearManualIP}
            disabled={isLoading}
          >
            <Text style={styles.buttonText}>Clear Manual IP</Text>
          </TouchableOpacity>
        </View>

        {/* Help Text */}
        <View style={styles.helpSection}>
          <Text style={styles.helpTitle}>How to find your laptop IP:</Text>
          <Text style={styles.helpText}>
            • Mac/Linux: Open Terminal and run: ifconfig | grep "inet "{'\n'}
            • Windows: Open Command Prompt and run: ipconfig{'\n\n'}
            Look for the IP address starting with 192.168.x.x or 10.x.x.x
          </Text>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F7FA',
  },
  content: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#1F2937',
    marginBottom: 20,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 8,
  },
  urlBox: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  urlText: {
    fontSize: 14,
    color: '#4B5563',
    fontFamily: 'monospace',
  },
  inputRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  input: {
    flex: 1,
    backgroundColor: '#F9FAFB',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    color: '#1F2937',
  },
  detectButton: {
    backgroundColor: '#F3F4F6',
    borderRadius: 8,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  detectButtonText: {
    fontSize: 14,
    color: '#06B6D4',
    fontWeight: '600',
  },
  button: {
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  primaryButton: {
    backgroundColor: '#06B6D4',
  },
  secondaryButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 2,
    borderColor: '#06B6D4',
  },
  testButton: {
    backgroundColor: '#10B981',
  },
  dangerButton: {
    backgroundColor: '#EF4444',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  secondaryButtonText: {
    color: '#06B6D4',
  },
  helpSection: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 16,
    marginTop: 8,
  },
  helpTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
    marginBottom: 8,
  },
  helpText: {
    fontSize: 13,
    color: '#6B7280',
    lineHeight: 20,
    marginBottom: 8,
  },
});
