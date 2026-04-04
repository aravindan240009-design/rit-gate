import { AppRegistry, Linking } from 'react-native';
import React from 'react';
import App from './App';
import ErrorBoundary from './src/components/ErrorBoundary';
import { ThemeProvider } from './src/context/ThemeContext';
import notifee, { EventType } from '@notifee/react-native';
import { registerBackgroundHandler } from './src/services/pushNotification.service';
import AsyncStorage from '@react-native-async-storage/async-storage';

// ── FCM background handler (must be registered before AppRegistry) ──────────
registerBackgroundHandler();

// ── Notifee background handler ───────────────────────────────────────────────
notifee.onBackgroundEvent(async ({ type, detail }) => {
  const data = detail.notification?.data || {};
  const actionId = detail.pressAction?.id;

  if (type === EventType.PRESS || type === EventType.ACTION_PRESS) {
    // Download notification — open the file
    if (data.type === 'download' && data.filePath) {
      try {
        const { NativeModules, Platform } = require('react-native');
        if (Platform.OS === 'android') {
          // Use Android Intent to open the file
          const IntentLauncher = require('expo-intent-launcher');
          await IntentLauncher.startActivityAsync('android.intent.action.VIEW', {
            data: `file://${data.filePath}`,
            flags: 1, // FLAG_GRANT_READ_URI_PERMISSION
            type: data.mimeType || 'application/pdf',
          });
        }
      } catch (e) {
        // Fallback: store path so app can open it on resume
        await AsyncStorage.setItem('@pending_open_file', JSON.stringify({
          filePath: data.filePath,
          mimeType: data.mimeType,
        }));
      }
      return;
    }

    // App notification — store actionRoute so App.tsx applies it on resume
    if (data.actionRoute) {
      await AsyncStorage.setItem('@pending_notification_route', data.actionRoute);
    }
  }
});

function Root() {
  return (
    <ThemeProvider>
      <ErrorBoundary>
        <App />
      </ErrorBoundary>
    </ThemeProvider>
  );
}

AppRegistry.registerComponent('main', () => Root);
