/**
 * Non-dismissible "Update Required" screen shown at launch when the installed APK
 * is older than the backend's minimum supported versionCode. Blocks all app use
 * until the user updates.
 */
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Linking } from 'react-native';

interface Props {
  updateUrl: string;
  message?: string;
}

const ForceUpdateScreen: React.FC<Props> = ({ updateUrl, message }) => {
  const handleUpdate = async () => {
    try {
      await Linking.openURL(updateUrl);
    } catch {
      // Fallback to the Play Store web URL if the market:// intent fails.
      try {
        await Linking.openURL('https://play.google.com/store/apps/details?id=com.mygate.app');
      } catch {}
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconWrap}>
        <Text style={{ fontSize: 40 }}>⬆️</Text>
      </View>
      <Text style={styles.title}>Update Required</Text>
      <Text style={styles.subtitle}>
        {message || 'A new version of the app is required to continue. Please update to the latest version.'}
      </Text>
      <TouchableOpacity style={styles.btn} onPress={handleUpdate}>
        <Text style={styles.btnText}>Update Now</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  iconWrap: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#DBEAFE',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#1F2937',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#6B7280',
    textAlign: 'center',
    marginBottom: 28,
    lineHeight: 20,
  },
  btn: {
    backgroundColor: '#1E40AF',
    paddingVertical: 14,
    paddingHorizontal: 40,
    borderRadius: 14,
  },
  btnText: {
    color: '#FFF',
    fontSize: 15,
    fontWeight: '700',
  },
});

export default ForceUpdateScreen;
